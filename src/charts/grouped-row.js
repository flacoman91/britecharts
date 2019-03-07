define(function (require) {
    'use strict';

    const d3Array = require('d3-array');
    const d3Axis = require('d3-axis');
    const d3Color = require('d3-color');
    const d3Collection = require('d3-collection');
    const d3Dispatch = require('d3-dispatch');
    const d3Ease = require('d3-ease');
    const d3Format = require('d3-format');
    const d3Interpolate = require('d3-interpolate');
    const d3Scale = require('d3-scale');
    const d3Selection = require('d3-selection');
    const assign = require('lodash.assign');
    const d3Transition = require('d3-transition');

    const textHelper = require('./helpers/text');
    const { exportChart } = require('./helpers/export');
    const colorHelper = require('./helpers/color');
    const {bar} = require('./helpers/load');
    const numberHelper = require('./helpers/number');

    const NUMBER_FORMAT = ',f';
    const uniq = (arrArg) => arrArg.filter((elem, pos, arr) => arr.indexOf(elem) == pos);


    /**
     * @typdef D3Layout
     * @type function
     */

    /**
     * @typedef GroupedRowChartData
     * @type {Object[]}
     * @property {String} name         Name of the entry
     * @property {String} group        group of the entry
     * @property {Number} value        Value of the entry
     *
     * @example
     * [
     *     {
     *         name: "2011-01",
     *         group: "Direct",
     *         value: 0
     *     }
     * ]
     */

    /**
     * Grouped Row Chart reusable API module that allows us
     * rendering a multi grouped Row and configurable chart.
     *
     * @module Grouped-row
     * @tutorial grouped-row
     * @requires d3-array, d3-axis, d3-color, d3-collection, d3-dispatch, d3-ease,
     *  d3-interpolate, d3-scale, d3-selection, lodash assign
     *
     * @example
     * let groupedRow = GroupedRow();
     *
     * groupedRow
     *     .width(containerWidth);
     *
     * d3Selection.select('.css-selector')
     *     .datum(dataset.data)
     *     .call(groupedRow);
     *
     */
    return function module() {

        let margin = {
                top: 40,
                right: 30,
                bottom: 60,
                left: 70
            },
            containerRoot,
            width = 960,
            height = 500,
            loadingState = bar,

            xScale,
            xAxis,
            yScale,
            yScale2,
            yAxis,

            aspectRatio = null,

            yTickTextOffset = {
                y: -8,
                x: -20
            },

            yTicks = 5,
            xTicks = 5,
            percentageAxisToMaxRatio = 1,
            baseLine,
            backgroundHoverColor = '#d6e8fa',
            colorSchema = colorHelper.colorSchemas.britecharts,

            categoryColorMap = {},

            layers,

            ease = d3Ease.easeQuadInOut,
            isHorizontal = false,
            isStacked = false,
            svg,
            chartWidth, chartHeight,
            data,
            groups,
            names,
            layerElements,

            transformedData,

            tooltipThreshold = 480,

            xAxisPadding = {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            },
            yAxisLabel,
            yAxisLabelEl,
            yAxisLabelOffset = -60,

            barOpacity = 0.24,

            animationDelayStep = 20,
            animationDelays,
            animationDuration = 1000,

            grid = null,

            nameLabel = 'name',
            valueLabel = 'value',
            groupLabel = 'group',
            valueLabelFormat = NUMBER_FORMAT,

            // getters
            getName = ({name}) => name,
            getParentValue = ({parentVal}) => parentVal,
            getValue = ({value}) => value,
            getGroup = ({group}) => group,
            getScaledValue = (d) => getValue( d ),

            getStriped = ({striped}) => striped,
            isAnimated = false,
            isPrintMode = false,

            // legend stuff
            // tooltip
            tooltip,
            tooltipOffset = {
                y: -55,
                x: 0
            },

            circleYOffset = 10,
            entryLineLimit = 5,
            initialTooltipTextXPosition = -25,
            tooltipTextLinePadding = 5,
            tooltipRightWidth,
            tooltipMaxTopicLength = 200,
            tooltipTextContainer,
            tooltipDivider,
            tooltipBody,
            tooltipTitle,
            tooltipWidth = 250,
            tooltipHeight = 48,
            tooltipBorderRadius = 3,
            ttTextX = 0,
            ttTextY = 37,
            textHeight,
            bodyFillColor = '#FFFFFF',
            borderStrokeColor = '#D2D6DF',
            titleFillColor = '#6D717A',
            textFillColor = '#282C35',
            tooltipTextColor = '#000000',

            // events
            dispatcher = d3Dispatch.dispatch(
                'customMouseOver',
                'customMouseOut',
                'customMouseMove',
                'customClick'
            );

        /**
         * This function creates the graph using the selection and data provided
         * @param {D3Selection} _selection A d3 selection that represents
         * the container(s) where the chart(s) will be rendered
         * @param {GroupedRowChartData} _data The data to attach and generate the chart
         */
        function exports(_selection) {
            _selection.each(function (_data) {
                const printWidth = isPrintMode ? 250 : 0;
                chartWidth = width - margin.left - margin.right - printWidth;
                chartHeight = height - margin.top - margin.bottom;
                data = cleanData(_data);

                prepareData(data);
                buildScales();
                buildLayers();
                buildSVG(this);
                drawGridLines();
                buildAxis();
                drawGroupedRow();
                drawAxis();
                drawLegend();
                addMouseEvents();
            });
        }

        /**
         * Adds events to the container group if the environment is not mobile
         * Adding: mouseover, mouseout and mousemove
         */
        function addMouseEvents() {
            if (shouldShowTooltip()) {
                svg
                    .on('mouseover', function(d) {
                        handleMouseOver(this, d);
                    })
                    .on('mouseout', function(d) {
                        handleMouseOut(this, d);
                    })
                    .on('mousemove',  function(d) {
                        handleMouseMove(this, d);
                    })
                    .on('click',  function(d) {
                        handleCustomClick(this, d);
                    });
            }

            svg.selectAll('.bar')
                .on('mouseover', function(d) {
                    handleBarsMouseOver(this, d);
                })
                .on('mouseout', function(d) {
                    handleBarsMouseOut(this, d);
                });
        }


        /**
         * Creates the d3 x and y axis, setting orientations
         * @private
         */
        function buildAxis() {
            xAxis = d3Axis.axisBottom(xScale)
                .ticks(xTicks, valueLabelFormat);
            yAxis = d3Axis.axisLeft(yScale)
        }

        /**
         * Builds containers for the chart, the axis and a wrapper for all of them
         * NOTE: The order of drawing of this group elements is really important,
         * as everything else will be drawn on top of them
         * @private
         */
        function buildContainerGroups() {
            let container = svg
                .append('g')
                .classed('container-group', true)
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // append def for the striped fill
            container.append('g')
                .append('defs')
                .append('pattern')
                .attr('id', 'diagonalHatch')
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('patternTransform', 'rotate(45)')
                .attr('width', 10)
                .attr('height', 100)
                .append('rect')
                .attr('width', 5)
                .attr('height', 100)
                .attr('transform', 'translate(0,0)')
                .attr('fill', 'white');

            container
                .append('g').classed('x-axis-group', true)
                .append('g').classed('x axis', true);
            container.selectAll('.x-axis-group')
                .append('g').classed('month-axis', true);
            container
                .append('g').classed('grid-lines-group', true);
            container
                .append('g').classed('chart-group', true);

            if(isPrintMode) {
                container
                    .append( 'g' ).classed( 'legend-group', true );
            }

            container
                .append('g').classed('y-axis-group axis', true);
            container
                .append('g').classed('y-axis-label', true);
            container
                .append('g').classed('metadata-group', true);
        }

        /**
         * Builds the grouped layers layout
         * @return {D3Layout} Layout for drawing the chart
         * @private
         */
        function buildLayers() {
            layers = transformedData.map((item) => {
                let ret = {};

                groups.forEach((key) => {
                    ret[key] = item[key];
                });

                return assign({}, item, ret);
            });
        }

        /**
         * Creates the x, y and color scales of the chart
         * @private
         */
        function buildScales() {
            let yMax = d3Array.max(data.map(getValue));
            let percentageAxis = isStacked ? Math.min(percentageAxisToMaxRatio * d3Array.max(data, getParentValue)) :
                Math.min(percentageAxisToMaxRatio * d3Array.max(data, getValue));

            xScale = d3Scale.scaleLinear()
                .domain([0, percentageAxis])
                .rangeRound([0, chartWidth - 1]);
            // 1 pix for edge tick

            // names of bars on right side
            yScale = d3Scale.scaleBand()
                .domain(data.map(getName))
                .rangeRound([chartHeight, 0])
                .padding(0.1);

            // group on left side of chart
            yScale2 = d3Scale.scaleBand()
                .domain(data.map(getGroup))
                .rangeRound([yScale.bandwidth(), 0])
                .padding(0.1);

            const gr = data.map(getGroup);
            const group = uniq(gr);

            for(let i=0; i< group.length; i++){
                categoryColorMap[group[i]] = colorSchema[i];
            }

        }

        /**
         * @param  {HTMLElement} container DOM element that will work as the container of the graph
         * @private
         */
        function buildSVG(container) {
            containerRoot = container;
            if (!svg) {
                svg = d3Selection.select(container)
                    .append('svg')
                    .classed('britechart grouped-row', true);

                buildContainerGroups();
            }

            svg
                .attr('width', width)
                .attr('height', height);
        }

        /**
         * Cleaning data casting the values, groups, topic names and names to the proper type while keeping
         * the rest of properties on the data
         * @param  {GroupedRowChartData} originalData   Raw data from the container
         * @return {GroupedRowChartData}                Parsed data with values and dates
         * @private
         */
        function cleanData(originalData) {
            return originalData.reduce((acc, d) => {
                d.value = +d[valueLabel];
                d.group = d[groupLabel];
                // for tooltip
                d.topicName = getGroup(d);
                d.name = d[nameLabel];

                return [...acc, d];
            }, []);
        }

        /**
         * Utility function that wraps a text into the given width
         * @param  {D3Selection} text         Text to write
         * @param  {Number} containerWidth
         * @private
         */
        function wrapTextWithEllipses(text, containerWidth) {
            const yAxisLineWrapLimit = 2;
            const lineHeight = .8;
            textHelper.wrapTextWithEllipses(text, containerWidth, -10, yAxisLineWrapLimit, lineHeight);
        }

        /**
         * Draws the x and y axis on the svg object within their
         * respective groups
         * @private
         */
        function drawAxis() {
            svg.select('.x-axis-group .axis.x')
                .attr('transform', `translate( 0, ${chartHeight} )`)
                .call(xAxis);

            svg.select('.y-axis-group.axis')
                .attr('transform', `translate( ${-xAxisPadding.left}, 0)`)
                .call(yAxis);


            svg.selectAll( '.y-axis-group.axis .tick' )
                .call( addVisibilityToggle );

            svg.selectAll('.y-axis-group.axis .tick text')
                //.classed('print-mode', isPrintMode)
                .on( 'mouseover', function( d ) {
                    rowHoverOver(d);
                } )
                .on('mouseout', function(d) {
                    rowHoverOut(d);
                })
                // move text right so we have room for the eyeballs
                .call(wrapTextWithEllipses, margin.left - 50)
                .selectAll('tspan');

            if (yAxisLabel) {
                if (yAxisLabelEl) {
                    svg.selectAll('.y-axis-label-text').remove();
                }

                yAxisLabelEl = svg.select('.y-axis-label')
                    .append('text')
                    .classed('y-axis-label-text', true)
                    .attr('x', -chartHeight / 2)
                    .attr('y', yAxisLabelOffset)
                    .attr('text-anchor', 'middle')
                    .attr('transform', 'rotate(270 0 0)')
                    .text(yAxisLabel)
            }
        }


        function drawLegend() {
            if(!isPrintMode)
                return;
            const pos = Number.parseInt(chartWidth) + Number.parseInt(margin.right);

            tooltipTextContainer = svg.selectAll('.legend-group')
                .append('g')
                .attr('transform', 'translate(' + pos + ", -30)")
                .classed('tooltip-text', true);

            tooltipBody = tooltipTextContainer
                .append('g')
                .classed('tooltip-body', true)
                .style('transform', 'translateY(8px)')
                .style('fill', textFillColor);

            const keys = [ ...new Set( data.map( o => o.group ) ) ].reverse();
            keys.forEach(updateTopicContent);
        }

        /**
         * Draws the data entries inside the tooltip for a given topic
         * @param  {Object} topic Topic to extract data from
         * @return void
         * @private
         */
        function updateTopicContent(topic){
            let name = topic,
                tooltipLeftText,
                elementText;

            tooltipLeftText = topic;

            elementText = tooltipBody
                .append('text')
                .classed('tooltip-left-text', true)
                .attr('dy', '1em')
                .attr('x', ttTextX)
                .attr('y', ttTextY)
                .style('fill', tooltipTextColor)
                .text(tooltipLeftText)
                .call(textWrap, tooltipMaxTopicLength, initialTooltipTextXPosition);


            // IE11 give us sometimes a height of 0 when hovering on top of the vertical marker
            // This hack fixes it for some cases, but it doesn't work in multiline (they won't wrap)
            // Let's remove this once we stop supporting IE11
            textHeight = elementText.node().getBBox().height ? elementText.node().getBBox().height : textHeight;

            tooltipHeight += textHeight + tooltipTextLinePadding;
            // update the width if it exists because IE renders the elements
            // too slow and cant figure out the width?
            tooltipBody
                .append('circle')
                .classed('tooltip-circle', true)
                .attr('cx', 23 - tooltipWidth / 4)
                .attr('cy', (ttTextY + circleYOffset))
                .attr('r', 5)
                .style('fill', categoryColorMap[name])
                .style('stroke-width', 1);

            ttTextY += textHeight + 7;
        }

        /**
         * Wraps a text given the text, width, x position and textFormatter function
         * @param  {D3Selection} text  Selection with the text to wrap inside
         * @param  {Number} width Desired max width for that line
         * @param  {Number} xpos  Initial x position of the text
         * REF: http://bl.ocks.org/mbostock/7555321
         * More discussions on https://github.com/mbostock/d3/issues/1642
         * @private
         *
         */
        function textWrap(text, width, xpos = 0) {
            text.each(function() {
                var words,
                    word,
                    line,
                    lineNumber,
                    lineHeight,
                    y,
                    dy,
                    tspan;

                text = d3Selection.select(this);

                words = text.text().split(/\s+/).reverse();
                line = [];
                lineNumber = 0;
                lineHeight = 1.2;
                y = text.attr('y');
                dy = parseFloat(text.attr('dy'));
                tspan = text
                    .text(null)
                    .append('tspan')
                    .attr('x', xpos)
                    .attr('y', y)
                    .attr('dy', dy + 'em');

                while ((word = words.pop())) {
                    line.push(word);
                    tspan.text(line.join(' '));

                    // fixes for IE wrap text issue
                    const textWidth = textHelper.getTextWidth(line.join(' '), 16, 'Karla, sans-serif');

                    if (textWidth > width) {
                        line.pop();
                        tspan.text(line.join(' '));

                        if (lineNumber < entryLineLimit - 1) {
                            line = [word];
                            tspan = text.append('tspan')
                                .attr('x', xpos)
                                .attr('y', y)
                                .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                                .text(word);
                        }
                    }
                }
            });

        }


        /**
         * Draws a vertical line to extend y-axis till the edges
         * @return {void}
         */
        function drawVerticalExtendedLine() {
            baseLine = svg.select('.grid-lines-group')
                .selectAll('line.extended-y-line')
                .data([0])
                .enter()
                .append('line')
                .attr('class', 'extended-y-line')
                .attr('y1', (xAxisPadding.bottom))
                .attr('y2', chartHeight)
                .attr('x1', 0)
                .attr('x2', 0);
        }

        /**
         * Draws a vertical line on the right side
         * @return {void}
         */
        function drawVerticalEndLine() {
            let w = textHelper.getTextWidth('100%', 16);

            let label = svg.select('.grid-lines-group')
                .selectAll('line.start-label')
                .data([0])
                .enter()
                .append('text')
                .attr('class', 'start-label')
                .text('0%')
                .attr('y', 0)
                .attr('x', 0);

            label = svg.select('.grid-lines-group')
                .selectAll('line.end-label')
                .data([0])
                .enter()
                .append('text')
                .attr('class', 'end-label')
                .text('100%')
                .attr('y', 0)
                .attr('x', chartWidth - w - 10);

            baseLine = svg.select('.grid-lines-group')
                .selectAll('line.extended-end-line')
                .data([0])
                .enter()
                .append('line')
                .attr('class', 'extended-end-line')
                .attr('y1', -20)
                .attr('y2', chartHeight + 10)
                .attr('x1', chartWidth)
                .attr('x2', chartWidth);
        }

        /**
         * Draws grid lines on the background of the chart
         * @return void
         */
        function drawGridLines() {
            let scale = xScale;

            svg.select('.grid-lines-group')
                .selectAll('line')
                .remove();

            if (grid === 'horizontal' || grid === 'full') {
                svg.select('.grid-lines-group')
                    .selectAll('line.horizontal-grid-line')
                    .data(scale.ticks(yTicks).slice(1))
                    .enter()
                    .append('line')
                    .attr('class', 'horizontal-grid-line')
                    .attr('x1', (-xAxisPadding.left + 1))
                    .attr('x2', chartWidth)
                    .attr('y1', (d) => yScale(d))
                    .attr('y2', (d) => yScale(d));
            }

            if (grid === 'vertical' || grid === 'full') {
                svg.select('.grid-lines-group')
                    .selectAll('line.vertical-grid-line')
                    .data(scale.ticks(xTicks).slice(1))
                    .enter()
                    .append('line')
                    .attr('class', 'vertical-grid-line')
                    .attr('y1', 0)
                    .attr('y2', chartHeight)
                    .attr('x1', (d) => xScale(d))
                    .attr('x2', (d) => xScale(d));
            }

            drawVerticalExtendedLine();
            drawVerticalEndLine();
        }

        /**
         * Draws the bars along the x axis
         * @param  {D3Selection} layersSelection Selection of layers
         * @return {void}
         */
        function drawHorizontalBars(layersSelection) {
            let layerJoin = layersSelection
                .data(layers);

            layerElements = layerJoin
                .enter()
                .append('g')
                .attr('transform', ({key}) => `translate(0,${yScale(key)})`)
                .attr('class', (d, i)=>{
                    return 'layer layer-' + i;
                });

            let bgColor = layerElements
                .selectAll('.group-background')
                .data([0]);

            let bgJoin = layerElements
                .selectAll('.bg-hover')
                .data([0]);

            let barJoinOverall = layerElements
                .selectAll('.bar-overall')
                .data(({values}) => values);

            let barJoin = layerElements
                .selectAll('.bar')
                .data(({values}) => values);

            // only have ones with striped values render bars
            let barJoinStriped = layerElements
                .selectAll('.bar')
                .data(({values}) => values.filter(o=>o.striped));

            let barbgCol = bgColor
                .enter()
                .append('rect')
                .classed( 'group-background', true )
                .attr('x', 0)
                .attr('y', (d) => yScale2(getGroup(d)))
                .attr('height', yScale2.bandwidth() * groups.length + groups.length * 4)
                .attr('width', chartWidth);

            // Enter + Update
            let barsOverall = barJoinOverall
                .enter()
                .append('rect')
                .classed('bar-overall', true)
                .attr('x', 1)
                .attr('y', (d) => yScale2(getGroup(d)))
                .attr('height', yScale2.bandwidth())
                .attr('fill', (({group}) => categoryColorMap[group]))
                .attr('fill-opacity', .3);

            let bars = barJoin
                .enter()
                .append('rect')
                .classed('bar', true)
                .attr('x', 1)
                .attr('y', (d) => yScale2(getGroup(d)))
                .attr('height', yScale2.bandwidth())
                .attr('fill', (({group}) => categoryColorMap[group]));

            let format = d3Format.format('.2f');
            let labels = barJoin
                .enter()
                .append('text')
                .classed('percentage-label', true)
                .attr( 'x', ( d ) => {
                    let width = 0;
                    if ( isStacked ) {
                        width = xScale( getScaledValue( d ) ) + 5;
                    } else {
                        width = xScale( getValue( d ) ) + 5;
                    }
                    const textWidth = textHelper.getTextWidth(format(getValue(d)) + '%', 16);
                    if(width + textWidth > chartWidth){
                        return width - textWidth - 10;
                    }
                    return width;
                } )
                .attr('y', (d) => yScale2(getGroup(d)) + 16)
                .text((d)=> format(getValue(d)) + '%');

            let barsStriped = barJoinStriped
                .enter()
                .append('rect')
                .classed('striped', true)
                .attr('x', 1)
                .attr('y', (d) => yScale2(getGroup(d)))
                .attr('height', yScale2.bandwidth())
                .attr('fill', 'url(#diagonalHatch)');

            // Enter + Update
            let barbg = bgJoin
                .enter()
                .append('rect')
                .classed( 'bg-hover', true )
                .on( 'click', function( d ) {
                    handleCustomClick( this, d );
                } )
                .attr('x', -margin.left)
                .attr('y', (d) => yScale2(getGroup(d)))
                .attr('height', yScale2.bandwidth() * groups.length + groups.length * 4)
                .attr('width', chartWidth + margin.left)
                .attr('fill', backgroundHoverColor)
                .attr('fill-opacity', 0)
                .on( 'mouseover', rowHoverOver )
                .on('mouseout', rowHoverOut);


            if (isAnimated) {
                bars.style('opacity', barOpacity)
                    .transition()
                    .delay((_, i) => animationDelays[i])
                    .duration(animationDuration)
                    .ease(ease)
                    .tween('attr.width', horizontalBarsTween);

                if(isStacked) {
                    barsOverall.style( 'opacity', barOpacity )
                        .transition()
                        .delay( ( _, i ) => animationDelays[ i ] )
                        .duration( animationDuration )
                        .ease( ease )
                        .tween( 'attr.width', horizontalParentBarsTween );
                }

                barsStriped.style('opacity', barOpacity)
                    .transition()
                    .delay((_, i) => animationDelays[i])
                    .duration(animationDuration)
                    .ease(ease)
                    .tween('attr.width', horizontalBarsTween);
            } else {
                bars.attr( 'width', ( d ) => {
                    if(isStacked){
                        return xScale( getScaledValue(d) );
                    }
                    return xScale( getValue( d ) );
                } );

                if(isStacked) {
                    barsOverall.attr( 'width', ( d ) => xScale( getParentValue( d ) ) );
                }
                barsStriped.attr('width', (d) => {
                    if(isStacked) {
                        return xScale( getScaledValue( d ) );
                    }
                    return xScale( getValue( d ) );
                });
            }
        }

        /**
         * Draws the different areas into the chart-group element
         * @private
         */
        function drawGroupedRow() {
            // Not ideal, we need to figure out how to call exit for nested elements
            if (layerElements) {
                svg.selectAll('.layer').remove();
            }

            let series = svg.select('.chart-group').selectAll('.layer');

            animationDelays = d3Array.range(animationDelayStep, (layers.length + 1) * animationDelayStep, animationDelayStep)
            drawHorizontalBars(series);

            // Exit
            series.exit()
                .transition()
                .style('opacity', 0)
                .remove();
        }

        /**
         * Extract X position on the chart from a given mouse event
         * @param  {obj} event D3 mouse event
         * @return {Number}       Position on the x axis of the mouse
         * @private
         */
        function getMousePosition(event) {
            return d3Selection.mouse(event);
        }

        /**
         * Finds out the data entry that is closer to the given position on pixels
         * @param  {Number} mouseX X position of the mouse
         * @return {obj}        Data entry that is closer to that x axis position
         */
        function getNearestDataPoint2(mouseY) {
            let adjustedMouseY = mouseY - margin.bottom,
                epsilon = yScale.bandwidth(),
                nearest = [];

            layers.map(function (data) {
                let found = data.values.find((d2) => Math.abs(adjustedMouseY >= yScale(d2[nameLabel])) && Math.abs(adjustedMouseY - yScale(d2[nameLabel]) <= epsilon * 2));

                if (found) {
                    found.values = data.values;
                    found.key = found.name;
                    nearest.push(found)
                }
            });

            return nearest.length ? nearest[0] : undefined;
        }

        /**
         * Handles a mouseover event on top of a bar
         * @param  {obj} e the fired event
         * @param  {obj} d data of bar
         * @return {void}
         */
        function handleBarsMouseOver(e, d) {
            d3Selection.select(e)
                .attr('fill', () => d3Color.color(categoryColorMap[d.group]).darker());
        }

        /**
         * Handles a mouseout event out of a bar
         * @param  {obj} e the fired event
         * @param  {obj} d data of bar
         * @return {void}
         */
        function handleBarsMouseOut(e, d) {
            d3Selection.select(e)
                .attr('fill', () => categoryColorMap[d.group])
        }

        /**
         * MouseMove handler, calculates the nearest dataPoint to the cursor
         * and updates metadata related to it
         * @param  {obj} e the fired event
         * @private
         */
        function handleMouseMove(e) {
            let [mouseX, mouseY] = getMousePosition(e),
                dataPoint = getNearestDataPoint2(mouseY),
                x,
                y;

            if (dataPoint) {
                // Move verticalMarker to that datapoint
                x = mouseX - margin.left;
                y = yScale(dataPoint.key) + yScale.bandwidth() / 2;

                moveTooltipOriginXY(x, y);

                // Emit event with xPosition for tooltip or similar feature
                dispatcher.call('customMouseMove', e, dataPoint, categoryColorMap, x, y);
            }
        }

        /**
         * Click handler, shows data that was clicked and passes to the user
         * @private
         */
        function handleCustomClick (e, d) {
            let [mouseX, mouseY] = getMousePosition(e);
            let dataPoint = getNearestDataPoint2(mouseY);

            dispatcher.call('customClick', e, dataPoint, d3Selection.mouse(e));
        }

        /**
         * MouseOut handler, hides overlay and removes active class on verticalMarkerLine
         * It also resets the container of the vertical marker
         * @private
         */
        function handleMouseOut(e, d) {
            svg.select('.metadata-group').attr('transform', 'translate(9999, 0)');
            dispatcher.call('customMouseOut', e, d, d3Selection.mouse(e));
        }

        /**
         * Mouseover handler, shows overlay and adds active class to verticalMarkerLine
         * @private
         */
        function handleMouseOver(e, d) {
            dispatcher.call('customMouseOver', e, d, d3Selection.mouse(e));

            // eyeball fill-opacity
            rowHoverOver(d);
        }

        function rowHoverOver(d, i) {
            let ind = null;
            let layerName = '';
            if(this) {
                layerName = d3Selection.select( this.parentNode ).attr( 'class' );
                ind = layerName.replace('layer layer-', '');
            }

            if(ind === null) {
                ind = getIndex(d);
            }
            if(parseInt(ind) > -1) {
                d3Selection.select( containerRoot ).select( '.tick svg.visibility-' + ind ).attr( 'opacity', 1 );
                d3Selection.select( containerRoot ).select( 'g .layer-' + ind + ' .bg-hover' ).attr( 'fill-opacity', .3 );
            }
        }

        function rowHoverOut(d, i) {
            // eyeball fill-opacity 0
            // we should find the index of the currently hovered over row
            let ind = null;
            let layerName = '';
            if(this) {
                layerName = d3Selection.select( this.parentNode ).attr( 'class' );
                ind = layerName.replace('layer layer-', '');
            }

            if(ind === null) {
                ind = getIndex(d);
            }
            if(parseInt(ind) > -1) {
                d3Selection.select( containerRoot ).select( '.tick svg.visibility-' + ind ).attr( 'opacity', 0 );
                d3Selection.select( containerRoot ).select( 'g .layer-' + ind + ' .bg-hover' ).attr( 'fill-opacity', 0 );
            }
        }

        /**
         * Animation tween of horizontal bars
         * @param  {obj} d data of bar
         * @return {void}
         */
        function horizontalBarsTween(d) {
            let node = d3Selection.select(this),
                j = d3Interpolate.interpolateNumber(0, 1);

            let i = isStacked ? d3Interpolate.interpolateRound( 0, xScale( getScaledValue( d ) ) )
                : d3Interpolate.interpolateRound(0, xScale(getValue(d)));
            return function (t) {
                node.attr('width', i(t))
                    .style('opacity', j(t));
            }
        }

        /**
         * Animation tween of horizontal overall bars
         * @param  {obj} d data of bar
         * @return {void}
         */
        function horizontalParentBarsTween(d) {
            let node = d3Selection.select(this),
                i = d3Interpolate.interpolateRound(0, xScale(getParentValue(d))),
                j = d3Interpolate.interpolateNumber(0, 1);

            return function (t) {
                node.attr('width', i(t))
                    .style('opacity', j(t));
            }
        }


        /**
         * Helper method to update the x position of the vertical marker
         * @param  {obj} dataPoint Data entry to extract info
         * @return void
         */
        function moveTooltipOriginXY(originXPosition, originYPosition) {
            svg.select('.metadata-group')
                .attr('transform', `translate(${originXPosition},${originYPosition})`);
        }

        /**
         * Prepare data for create chart.
         * @private
         */
        function prepareData(data) {
            groups = uniq(data.map((d) => getGroup(d)));
            names = uniq(data.map((d) => getName(d)));
            transformedData = d3Collection.nest()
                .key(getName)
                .rollup(function (values) {
                    let ret = {};

                    values.forEach((entry) => {
                        if (entry && entry[groupLabel]) {
                            ret[entry[groupLabel]] = getValue(entry);
                        }
                    });
                    //for tooltip
                    ret.values = values;
                    return ret;
                })
                .entries(data)
                .map(function (data) {
                    return assign({}, {
                        total: d3Array.sum(d3Array.permute(data.value, groups)),
                        key: data.key
                    }, data.value);
                });
        }

        /**
         * Determines if we should add the tooltip related logic depending on the
         * size of the chart and the tooltipThreshold variable value
         * @return {boolean} Should we build the tooltip?
         * @private
         */
        function shouldShowTooltip() {
            return width > tooltipThreshold;
        }

        // eyeball
        function addVisibilityToggle(elem){
            elem.each( function() {
                elem = d3Selection.select( this );
                let textHgt = elem.node().getBBox().height/2;
                let group = elem.append('svg')
                    .attr('class', (d) => {
                        return 'visibility visibility-' + getIndex(d);
                    })
                    .attr('x', -(margin.left-5))
                    .attr('y', -textHgt)
                    .attr('width', '300')
                    .attr('height', '300')
                    .attr('viewBox', '0 0 600 600')
                    .attr('fill', 'none')
                    .attr('opacity', 0);

                group.append( 'rect' )
                    .attr('x', -10)
                    .attr('y', -10)
                    .attr('height', '50')
                    .attr('width', '50')
                    .attr('fill', backgroundHoverColor)
                    .on( 'mouseover', function( d ) {
                        rowHoverOver(d);
                    } )
                    .on('mouseout', function(d) {
                        rowHoverOut(d);
                    })
                    .attr('opacity', 0);

                group.append( 'path' )
                    .attr('d', 'M 10,10 L 30,30 M 30,10 L 10,30')
                    .attr('stroke', '#0072ce')
                    .attr('stroke-width', '2')
                    .on( 'mouseover', function( d ) {
                        rowHoverOver(d);
                    } )
                    .on('mouseout', function(d) {
                        rowHoverOut(d);
                    });

            } );
        }


        function getIndex(name){
            return names.indexOf(name);
        }
        // API

        /**
         * Gets or Sets the aspect ratio of the chart
         * @param  {Number} _x Desired aspect ratio for the graph
         * @return { (Number | Module) } Current aspect ratio or Area Chart module to chain calls
         * @public
         */
        exports.aspectRatio = function (_x) {
            if (!arguments.length) {
                return aspectRatio;
            }
            aspectRatio = _x;

            return this;
        };

        /**
         * Gets or Sets the colorSchema of the chart
         * @param  {String[]} _x Desired colorSchema for the graph
         * @return { colorSchema | module} Current colorSchema or Chart module to chain calls
         * @public
         */
        exports.colorSchema = function (_x) {
            if (!arguments.length) {
                return colorSchema;
            }
            colorSchema = _x;

            return this;
        };

        /**
         * Chart exported to png and a download action is fired
         * @param {String} filename     File title for the resulting picture
         * @param {String} title        Title to add at the top of the exported picture
         * @public
         */
        exports.exportChart = function (filename, title) {
            exportChart.call(exports, svg, filename, title);
        };

        /**
         * Gets or Sets the groupLabel of the chart
         * @param  {String} _x Desired groupLabel for the graph
         * @return { groupLabel | module} Current groupLabel or Chart module to chain calls
         * @public
         */
        exports.groupLabel = function (_x) {
            if (!arguments.length) {
                return groupLabel;
            }
            groupLabel = _x;

            return this;
        };

        /**
         * Gets or Sets the grid mode.
         *
         * @param  {String} _x Desired mode for the grid ('vertical'|'horizontal'|'full')
         * @return { String | module} Current mode of the grid or Area Chart module to chain calls
         * @public
         */
        exports.grid = function (_x) {
            if (!arguments.length) {
                return grid;
            }
            grid = _x;

            return this;
        };

        /**
         * Gets or Sets the height of the chart
         * @param  {Number} _x Desired width for the graph
         * @return { height | module} Current height or Area Chart module to chain calls
         * @public
         */
        exports.height = function (_x) {
            if (!arguments.length) {
                return height;
            }
            if (aspectRatio) {
                width = Math.ceil(_x / aspectRatio);
            }
            height = _x;

            return this;
        };

        /**
         * Gets or Sets the horizontal direction of the chart
         * @param  {number} _x Desired horizontal direction for the graph
         * @return { isHorizontal | module} If it is horizontal or Bar Chart module to chain calls
         * @public
         */
        exports.isHorizontal = function (_x) {
            if (!arguments.length) {
                return isHorizontal;
            }
            isHorizontal = _x;

            return this;
        };


        /**
         * Gets or Sets whether the chart should show the expand toggles/eyeball
         * @param  {boolean} _x Should we show the expand toggles?
         * @return {boolean | module} do we expand toggles
         * @public
         */
        exports.isPrintMode = function(_x) {
            if (!arguments.length) {
                return isPrintMode;
            }
            isPrintMode = _x;

            return this;
        };

        /**
         * Is this a stacked bar chart
         * @param  {number} _x Desired horizontal direction for the graph
         * @return { isStacked | module} If it is horizontal or Bar Chart module to chain calls
         * @public
         */
        exports.isStacked = function (_x) {
            if (!arguments.length) {
                return isStacked;
            }
            isStacked = _x;

            return this;
        };

        /**
         * Gets or Sets the isAnimated property of the chart, making it to animate when render.
         * By default this is 'false'
         *
         * @param  {Boolean} _x Desired animation flag
         * @return { isAnimated | module} Current isAnimated flag or Chart module
         * @public
         */
        exports.isAnimated = function (_x) {
            if (!arguments.length) {
                return isAnimated;
            }
            isAnimated = _x;

            return this;
        };

        /**
         * Gets or Sets the loading state of the chart
         * @param  {string} markup Desired markup to show when null data
         * @return { loadingState | module} Current loading state markup or Chart module to chain calls
         * @public
         */
        exports.loadingState = function(_markup) {
            if (!arguments.length) {
                return loadingState;
            }
            loadingState = _markup;

            return this;
        };

        /**
         * Gets or Sets the margin of the chart
         * @param  {Object} _x Margin object to get/set
         * @return { margin | module} Current margin or Area Chart module to chain calls
         * @public
         */
        exports.margin = function (_x) {
            if (!arguments.length) {
                return margin;
            }
            margin = {
                ...margin,
                ..._x
            };

            return this;
        };

        /**
         * Gets or Sets the nameLabel of the chart
         * @param  {Number} _x Desired dateLabel for the graph
         * @return { nameLabel | module} Current nameLabel or Chart module to chain calls
         * @public
         */
        exports.nameLabel = function (_x) {
            if (!arguments.length) {
                return nameLabel;
            }
            nameLabel = _x;

            return this;
        };

        /**
         * Gets or Sets the number of ticks of the y axis on the chart
         * @param  {Number} _x          Desired vertical ticks
         * @return {Number | module}    Current yTicks or Chart module to chain calls
         * @public
         */
        exports.yTicks = function (_x) {
            if (!arguments.length) {
                return yTicks;
            }
            yTicks = _x;

            return this;
        };

        /**
         * Exposes an 'on' method that acts as a bridge with the event dispatcher
         * We are going to expose this events:
         * customMouseOver, customMouseMove, customMouseOut, and customClick
         *
         * @return {module} Bar Chart
         * @public
         */
        exports.on = function () {
            let value = dispatcher.on.apply(dispatcher, arguments);

            return value === dispatcher ? exports : value;
        };


        /**
         * Configurable extension of the x axis
         * if your max point was 50% you might want to show x axis to 60%, pass 1.2
         * @param  {number} _x ratio to max data point to add to the x axis
         * @return {ratio | module} Current ratio or Chart module to chain calls
         * @public
         */
        exports.percentageAxisToMaxRatio = function(_x) {
            if (!arguments.length) {
                return percentageAxisToMaxRatio;
            }
            percentageAxisToMaxRatio = _x;

            return this;
        }

        /**
         * Gets or Sets the minimum width of the graph in order to show the tooltip
         * NOTE: This could also depend on the aspect ratio
         *
         * @param  {Number} [_x=480] Minimum width of chart to show the tooltip
         * @return {Number | module} Current tooltipThreshold or Area Chart module to chain calls
         * @public
         */
        exports.tooltipThreshold = function (_x) {
            if (!arguments.length) {
                return tooltipThreshold;
            }
            tooltipThreshold = _x;

            return this;
        };

        /**
         * Gets or Sets the valueLabel of the chart
         * @param  {Number} _x Desired valueLabel for the graph
         * @return {Number | module} Current valueLabel or Chart module to chain calls
         * @public
         */
        exports.valueLabel = function (_x) {
            if (!arguments.length) {
                return valueLabel;
            }
            valueLabel = _x;

            return this;
        };

        /**
         * Gets or Sets the valueLabelFormat of the chart
         * @param  {String[]} _x Desired valueLabelFormat for the graph
         * @return {String[] | module} Current valueLabelFormat or Chart module to chain calls
         * @public
         */
        exports.valueLabelFormat = function (_x) {
            if (!arguments.length) {
                return valueLabelFormat;
            }
            valueLabelFormat = _x;

            return this;
        };

        /**
         * Gets or Sets the width of the chart
         * @param  {Number} _x Desired width for the graph
         * @return {Number | module} Current width or Area Chart module to chain calls
         * @public
         */
        exports.width = function (_x) {
            if (!arguments.length) {
                return width;
            }
            if (aspectRatio) {
                height = Math.ceil(_x * aspectRatio);
            }
            width = _x;

            return this;
        };

        /**
         * Gets or Sets the number of ticks of the x axis on the chart
         * @param  {Number} _x Desired xTicks
         * @return {Number | module} Current xTicks or Chart module to chain calls
         * @public
         */
        exports.xTicks = function (_x) {
            if (!arguments.length) {
                return xTicks;
            }
            xTicks = _x;

            return this;
        };

        /**
         * Gets or Sets the y-axis label of the chart
         * @param  {String} _x Desired label string
         * @return {String | module} Current yAxisLabel or Chart module to chain calls
         * @public
         * @example groupedRow.yAxisLabel('Ticket Sales')
         */
        exports.yAxisLabel = function (_x) {
            if (!arguments.length) {
                return yAxisLabel;
            }
            yAxisLabel = _x;

            return this;
        };

        /**
         * Gets or Sets the offset of the yAxisLabel of the chart.
         * The method accepts both positive and negative values.
         * The default value is -60
         * @param  {Number} _x Desired offset for the label
         * @return {Number | module} Current yAxisLabelOffset or Chart module to chain calls
         * @public
         * @example groupedRow.yAxisLabelOffset(-55)
         */
        exports.yAxisLabelOffset = function (_x) {
            if (!arguments.length) {
                return yAxisLabelOffset;
            }
            yAxisLabelOffset = _x;

            return this;
        }

        /**
         * Gets or Sets the x and y offset of ticks of the y axis on the chart
         * @param  {Object} _x Desired offset
         * @return {Object | module} Current offset or Chart module to chain calls
         * @public
         */
        exports.yTickTextOffset = function (_x) {
            if (!arguments.length) {
                return yTickTextOffset;
            }
            yTickTextOffset = _x;

            return this;
        };

        return exports;
    };
});

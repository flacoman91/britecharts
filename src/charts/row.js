define(function(require) {
    'use strict';

    const d3 = require('d3');
    const d3Array = require('d3-array');
    const d3Ease = require('d3-ease');
    const d3Axis = require('d3-axis');
    const d3Color = require('d3-color');
    const d3Dispatch = require('d3-dispatch');
    const d3Format = require('d3-format');
    const d3Scale = require('d3-scale');
    const d3Selection = require('d3-selection');
    const d3Shape = require('d3-shape');
    const d3Transition = require('d3-transition');

    const textHelper = require('./helpers/text');
    const {exportChart} = require('./helpers/export');
    const colorHelper = require('./helpers/color');
    const {row} = require('./helpers/load');
    const {uniqueId} = require('./helpers/number');

    const PERCENTAGE_FORMAT = '%';
    const NUMBER_FORMAT = ',f';


    /**
     * @typedef RowChartData
     * @type {Object[]}
     * @property {Number} value        Value of the group (required)
     * @property {String} name         Name of the group (required)
     *
     * @example
     * [
     *     {
     *         value: 1,
     *         name: 'foorow',
     *         pctChange: 23
     *     },
     *     {
     *         value: 1,
     *         name: 'luminous',
     *         pctChange: 20
     *     }
     * ]
     */

    /**
     * Row Chart reusable API class that renders a
     * simple and configurable row chart.
     *
     * @module Row
     * @tutorial row
     * @requires d3-array, d3-axis, d3-dispatch, d3-scale, d3-selection
     *
     * @example
     * var rowChart = row();
     *
     * rowChart
     *     .height(500)
     *     .width(800);
     *
     * d3Selection.select('.css-selector')
     *     .datum(dataset)
     *     .call(rowChart);
     *
     */
    return function module() {

        let margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 40
            },
            containerRoot,
            width = 960,
            height = 500,
            loadingState = row,
            data,
            dataZeroed,
            chartWidth, chartHeight,
            xScale, yScale,
            colorSchema = colorHelper.singleColors.aloeGreen,
            colorList,
            colorMap,
            chartGradientColors = null,
            chartGradient = null,
            chartGradientEl,
            chartGradientId = uniqueId('row-gradient'),
            yTicks = 5,
            xTicks = 5,
            percentageAxisToMaxRatio = 1,
            numberFormat = NUMBER_FORMAT,
            enableLabels = false,
            enableGridLines = false,
            enableYAxisRight = false,
            labelsMargin = 7,
            labelsNumberFormat = NUMBER_FORMAT,
            labelsSuffix = '',
            labelsSize = 16,
            labelsSizeChild = 12,
            parentFocusColor = '#e7e8e9',
            pctChangeLabelSize = 10,
            padding = 0.1,
            outerPadding = .3,
            xAxis, yAxis,
            xAxisPadding = {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            },
            yAxisPaddingBetweenChart = 20,
            yAxisLineWrapLimit = 1,
            svg,

            hasSingleRowHighlight = true,
            isAnimated = false,
            ease = d3Ease.easeQuadInOut,
            animationDuration = 800,
            animationStepRatio = 70,
            backgroundColor = '#bebebe',
            backgroundHoverColor = '#d6e8fa',
            backgroundWidth = 70,
            downArrowColor = '#20AA3F',
            upArrowColor = '#D14124',
            interRowDelay = (d, i) => animationStepRatio * i,

            highlightRowFunction = (rowSelection) => rowSelection.attr('fill', ({name}) => d3Color.color(colorMap(name)).darker()),
            orderingFunction,
            labelsFocusTitle = '',
            labelsTotalText = 'Total complaints',
            labelsTotalCount = '',
            labelsInterval = '',
            valueLabel = 'value',
            nameLabel = 'name',
            pctChangeLabel = 'pctChange',
            //pctOfSet = '',
            pctOfSetLabel = 'pctOfSet',
            baseLine,
            maskGridLines,
            shouldReverseColorList = true,
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


            // Dispatcher object to broadcast the mouse events
            // Ref: https://github.com/mbostock/d3/wiki/Internals#d3_dispatch
            dispatcher = d3Dispatch.dispatch(
                'customMouseOver',
                'customMouseOut',
                'customMouseMove',
                'customClick'
            ),

            // extractors
            getName = ({name}) => name,
            getPctChange = ({pctChange}) => pctChange,
            getValue = ({value}) => value,

            _labelsFormatValue = ( d, bgWidth ) => {

                const { isNotFilter, pctOfSet, parent, value, isParent } = d;
                let pctLabel = '';

                // exclude this on NOT filters
                if ( isNotFilter )
                    return '';

                // don't include this label on child elements (hasparent)
                // elements
                if ( pctOfSet && !parent ) {
                    pctLabel = '  | ' + pctOfSet + '%';
                }

                if(Number(value) === 1) {
                    // localize, remove the s
                    // (complaint vs complaints)
                    labelsSuffix = labelsSuffix.replace( /s$/, '' );
                }

                const t = d3Format.format( labelsNumberFormat )( value ) + ' ' + labelsSuffix + pctLabel;
                const textSize = isParent ? labelsSize : labelsSizeChild;
                const w = textHelper.getTextWidth(t, textSize, 'sans-serif') + 10;
                const barWidth = xScale( value );

                if (w > barWidth && w > bgWidth - barWidth) {
                    // only return the number if it won't fit.
                    return d3Format.format( labelsNumberFormat )( value );
                }

                return t;

            },

            _labelsFormatPct = ({pctChange}) => {
                if (isNaN(pctChange))
                    return '----';

                if (Math.abs(pctChange) === 999999)
                    return '';

                const prepend = pctChange > 0 ? '+': '';

                return prepend + d3Format.format(labelsNumberFormat)(pctChange) + '%';
            },

            // labels per row, aka XX Complaints
            _labelsHorizontalX = ({parentCount, value}) => {
                    return parentCount ? xScale(parentCount) + labelsMargin :
                        xScale(value) + labelsMargin;
            },
            _labelsHorizontalY= ({name}) => { return yScale(name) + (labelsSize * (3/8)); };

        /**
         * This function creates the graph using the selection as container
         * @param  {D3Selection} _selection A d3 selection that represents
         *                                  the container(s) where the chart(s) will be rendered
         * @param {RowChartData} _data The data to attach and generate the chart
         */
        function exports(_selection) {
            _selection.each(function(_data) {
                const printWidth = isPrintMode ? 200 : 0;
                chartWidth = width - margin.left - margin.right - (yAxisPaddingBetweenChart * 1.2) - 50 - printWidth;
                chartHeight = height - margin.top - margin.bottom;
                ({data, dataZeroed} = sortData(cleanData(_data)));
                buildScales();
                buildAxis();
                buildSVG(this);
                buildGradient();
                drawGridLines();
                drawChartTitleLabels();
                drawRows();
                drawAxis();
                drawLegend();
                updateChartHeight();
            });
        }

        /**
         * Creates the d3 x and y axis, setting orientations
         * @private
         */
        function buildAxis() {
            xAxis = d3Axis.axisBottom(xScale)
                .ticks(xTicks, numberFormat)
                .tickSizeInner([-chartHeight]);

            yAxis = d3Axis.axisLeft(yScale);
        }

        /**
         * Builds containers for the chart, the axis and a wrapper for all of them
         * Also applies the Margin convention
         * @private
         */
        function buildContainerGroups() {
            let container = svg
                .append('g')
                  .classed('container-group', true)
                  .attr('transform', `translate(${margin.left + yAxisPaddingBetweenChart}, ${margin.top})`);

            container
                .append('g').classed('grid-lines-group', true);

            container
                .append('g').classed('chart-group', true);

            if(isPrintMode) {
                container
                    .append( 'g' ).classed( 'legend-group', true );
            }

            container
                .append('g').classed('title-group', true);

            // labels on the bottom
            container
                .append('g').classed('x-axis-group axis', true);

            // this is the labels on the left, and the line
            container
                .append('g')
                .attr('transform', `translate(${-1 * (yAxisPaddingBetweenChart)}, 0)`)
                .classed('y-axis-group axis', true);


            // the tooltip and also labels on the right
            container
                .append('g').classed('metadata-group', true);
        }

        /**
         * Builds the gradient element to be used later
         * @return {void}
         * @private
         */
        function buildGradient() {
            if (!chartGradientEl && chartGradientColors) {
                chartGradientEl = svg.select('.metadata-group')
                  .append('linearGradient')
                    .attr('id', chartGradientId)
                    .attr('x1', '0%')
                    .attr('y1', '0%')
                    .attr('x2', '100%')
                    .attr('y2', '100%')
                    .attr('gradientUnits', 'userSpaceOnUse')
                    .selectAll('stop')
                     .data([
                        {offset:'0%', color: chartGradientColors[0]},
                        {offset:'50%', color: chartGradientColors[1]}
                    ])
                    .enter()
                      .append('stop')
                        .attr('offset', ({offset}) => offset)
                        .attr('stop-color', ({color}) => color)
            }
        }

        function v(d) {
            return +d.width;
        }

        function ww(d) {
            return +d.value;
        }

        //scale factor between value and bar width
        function alpha(values, value) {
            var n = values.length,
                total = d3.sum(values, value);

            const exGroups = getExpandedGroups(values);
            const retAlpha = (chartHeight - (n - 1) * padding * chartHeight / n - 2 * outerPadding * chartHeight / n) / total;

            if(exGroups.length === 0)
                return retAlpha;

            const squishScale = d3Scale.scalePow()
                .exponent( 1/exGroups.length )
                .domain( [ 0, 100 ] )
                .range( [ 0, exGroups.length * 10 ] );

            const scale = squishScale(n);
            const diff = isPrintMode ? scale * 2 : scale;
            return retAlpha - diff;
        }

        //width of bar i
        function Wi(values, value, alpha) {
            return function (i) {
                return value(values[i]) * alpha
            }
        }

        //mid-point displacement of bar i
        function Midi(values, value, alpha) {
            var w = Wi(values, value, alpha),
                n = values.length;
            const expandedGroups = getExpandedGroups(values);
            const groupIndices = getGroupIndices(expandedGroups, values);

            return function (_, i) {
                var op = outerPadding * chartHeight / n,
                    p = padding * chartHeight / n;
                let retVal = op + d3.sum(values.slice(0, i), value) * alpha + i * p + w(i) / 2;
                groupIndices.forEach(g=>{
                    // space above group
                    if ( g[ 0 ] > 1 &&i >= g[ 0 ] ) {
                        retVal += isPrintMode ? 20 : 10;
                    }
                    //space below group
                    if ( i > g[ g.length - 1 ] ) {
                        retVal += isPrintMode ? 20 : 10;
                    }
                });

                return retVal + margin.top;
            }
        }
        let a, mid, w;

        function isExpandable(data, d){
            // lets us know it's a parent element
            return data.find( ( o ) => {
                return o.name === d;
            } ).hasChildren;
        }

        /**
         * helper function to return list of groups that are expanded
         * @param data
         * @returns {any[]}
         */
        function getExpandedGroups(data){
            return [... new Set(data.filter( o => {
                return o.parent && o.isParent === false;
            }).map(o=>{
                return o.parent;
            }))];
        }

        function getGroupIndices(parents, data){
            let groups = [];
            parents.forEach(name=>{
                const points = data.map((o, i)=>{
                    return o.name === name || o.parent === name ? i : null
                }).filter(o=> {return o;});
                groups.push(points);
            });
            return groups;
        }

        /**
         * Creates the x and y scales of the graph
         * @private
         */
        function buildScales() {
            a = alpha(data, v),	  //scale factor between value and bar width
                mid = Midi(data, v, a),	//mid-point displacement of bar i
                w = Wi(data, v, a);		  //width of bar i

            let percentageAxis = Math.min(percentageAxisToMaxRatio * d3Array.max(data, getValue))

            xScale = d3Scale.scaleLinear()
                .domain([0, percentageAxis])
                .rangeRound([0, chartWidth]);

            // we already found the midpoints
            let vals = data.map( mid );

            yScale = d3Scale.scaleOrdinal()
                .domain(data.map(getName))
                .range(vals); //force irregular intervals based on value

            if (shouldReverseColorList) {
                colorList = data.map(d => d)
                                .reverse()
                                .map(({name}, i) => ({
                                        name,
                                        color: colorSchema[i % colorSchema.length]}
                                    ));
            } else {
                colorList = data.map(d => d)
                                .map(({name}, i) => ({
                                        name,
                                        color: colorSchema[i % colorSchema.length]}
                                    ));
            }

            colorMap = (item) => colorList.filter(({name}) => name === item)[0].color;
        }

        /**
         * Builds the SVG element that will contain the chart
         * @param  {HTMLElement} container DOM element that will work as the container of the graph
         * @private
         */
        function buildSVG(container) {
            containerRoot = container;
            if (!svg) {
                svg = d3Selection.select(container)
                    .append('svg')
                      .classed('britechart row-chart', true);

                svg.append('rect')
                    .classed('export-wrapper', true)
                    .attr('width', width)
                    .attr('height', height)
                    .attr('fill', 'white');

                buildContainerGroups();
            }

            svg
                .attr('width', width)
                .attr('height', height);
        }

        /**
         * Cleaning data casting the values and names to the proper type while keeping
         * the rest of properties on the data
         * It also creates a set of zeroed data (for animation purposes)
         * @param  {RowChartData} originalData  Raw data as passed to the container
         * @return  {RowChartData}              Clean data
         * @private
         */
        function cleanData(originalData) {
            let data = originalData.reduce((acc, d) => {
                d.name = String(d[nameLabel]);
                d.pctOfSet = +d[pctOfSetLabel];
                d.pctChange = +d[pctChangeLabel];
                d.value = +d[valueLabel];
                d.width = +d.width;

                return [...acc, d];
            }, []);

            const dataZeroed = data.slice();

            return { data, dataZeroed };
        }

        /**
         * A utility function that checks if custom gradient
         * color map should be applied if specified by the user
         * @param {String} name - row's data point name
         * @return {void}
         * @private
         */
        function computeColor(name) {
            return chartGradientColors ? `url(#${chartGradientId})` : colorMap(name);
        }

        /**
         * Sorts data if orderingFunction is specified
         * @param  {RowChartData}     clean unordered data
         * @return  {RowChartData}    clean ordered data
         * @private
         */
        function sortData(unorderedData) {
            let {data, dataZeroed} = unorderedData;

            if (orderingFunction) {
                data.sort(orderingFunction);
                dataZeroed.sort(orderingFunction)
            }

            return { data, dataZeroed };
        }


        /**
         * utility function if we are a Root Row, big font, etc
         * @param d
         * @returns {*}
         */
        function isParent(d){
            return data.find((o) => {
                return (o.name === d.name || o.name === d) && o.isParent;
            })
        }

        function positionPercentageLabel(d){

        }
        /**
         * utility function to get font size for a row
         * @param d
         * @returns {string}
         */
        function getFontSize(d){
            const e = isParent(d);
            return e ? `${labelsSize}px` : `${labelsSizeChild}px`;
        }

        /**
         * Utility function that wraps a text into the given width
         * @param  {D3Selection} text         Text to write
         * @param  {Number} containerWidth
         * @private
         */
        function wrapText(text, containerWidth) {
            const lineHeight = yAxisLineWrapLimit > 1 ? .8 : 1.2;
            let fontSize = 12;

            textHelper.wrapText.call(null, 0, fontSize, containerWidth, text.node());
            //textHelper.wrapText(text, containerWidth, 0,
            // yAxisLineWrapLimit, lineHeight);
        }

        /**
         * Utility function that wraps a text into the given width
         * @param  {D3Selection} text         Text to write
         * @param  {Number} containerWidth
         * @private
         */
        function wrapTextWithEllipses(text, containerWidth) {
            const lineHeight = yAxisLineWrapLimit > 1 ? .8 : 1.2;
            textHelper.wrapTextWithEllipses(text, containerWidth, 0, yAxisLineWrapLimit, lineHeight);
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
                    });

                group.append( 'path' )
                    .attr('d', 'M 10,10 L 30,30 M 30,10 L 10,30')
                    .attr('stroke', '#0072ce')
                    .attr('stroke-width', '2');

            } );
        }

        function addExpandToggle(elem){
            elem.each( function() {
                d3Selection.select( this ).selectAll('polygon').remove();
                elem = d3Selection.select( this );
                elem.append( 'polygon' )
                    .attr( 'transform', ( d ) => {
                        // determine if it is open
                        // if there are no children we rotate it
                        const e = data.find((o)=>{
                            return o.parent === d
                        });
                        return e ? `translate(${yAxisPaddingBetweenChart-5}, 2.5) rotate(180)` : `translate(${yAxisPaddingBetweenChart-15}, -2.5)`;
                    } )
                    .attr( 'points', function( d ) {
                        return '0,0 10,0 5,5';
                    } )
                    .style( 'fill', ( d ) => {
                        return '#0072ce';
                    } )
                    .style( 'fill-opacity', ( d ) => {
                        // if there are no children, make this transparent
                        const e = data.find((o)=>{
                            return o.name === d && o.hasChildren
                        });
                        return e ? 1 : 0;
                    } );
            } );
        }

        function updateChartHeight(){
            const bars = svg.selectAll('.row-wrapper');
            const num = Number(bars.size()) - 1;
            const lastBar = svg.select('.row_' + num).select('.bg-hover');
            if(lastBar._groups[0] && lastBar._groups[0][0]) {
                const pos = Number( lastBar.attr( 'y' ) );
                const height = pos + Number( lastBar.attr( 'height' ) ) + 40;
                svg.select( 'line.pct-separator' ).attr( 'y2', height );
                svg.select( '.export-wrapper' ).attr( 'height', height );
                svg.attr( 'height', height );
            }
        }

        /**
         * Draws the x and y axis on the svg object within their
         * respective groups
         * @private
         */
        function drawAxis() {
            let labelsBoxWidth = margin.left;
            svg.select('.x-axis-group.axis')
                .attr('transform', `translate(0, ${chartHeight})`)
                .call(xAxis);

            svg.select('.y-axis-group.axis')
                .call(yAxis);

            // adding the eyeball
            if(!isPrintMode) {
                svg.selectAll( '.y-axis-group.axis .tick' )
                    .call( addVisibilityToggle );
                labelsBoxWidth = margin.left - yAxisPaddingBetweenChart - 30;
            }

            svg.selectAll('.y-axis-group.axis .tick text')
                .classed('child', function(d) {
                    // lets us know it's a child element
                    return data.find((o) => {
                        return o.name === d;
                    }).parent;
                })
                .classed('print-mode', isPrintMode)
                .on( 'mouseover', function( d ) {
                    rowHoverOver(d);
                } )
                .on('mouseout', function(d) {
                    rowHoverOut(d);
                })
                // move text right so we have room for the eyeballs
                .call(wrapTextWithEllipses, labelsBoxWidth)
                .selectAll('tspan')
                .attr('font-size', getFontSize);

            // adding the down arrow for parent elements
            if(!isPrintMode) {
                svg.selectAll( '.y-axis-group.axis .tick' )
                    .classed( 'expandable', function( d ) {
                        return isExpandable(data, d);
                    } )
                    .call( addExpandToggle );
            }
        }

        /**
         * Draws the rows along the x axis
         * @param  {D3Selection} rows Selection of rows
         * @return {void}
         */
        function drawHorizontalRows(rows) {
            // Enter + Update
            // add background bars first
            const bargroups = rows.enter()
                .append('g')
                .attr( 'class', function(d, i){
                    return `row_${i} row-wrapper`;
                } );

            bargroups.append( 'rect' )
                .classed( 'bg', true )
                .attr( 'y', chartHeight )
                .attr( 'x', 0 )
                .on( 'click', function( d ) {
                    handleClick( this, d, chartWidth, chartHeight );
                } )
                .merge( rows )
                .attr( 'x', 0 )
                .attr( 'y', function (d, i) {
                    return yScale(d.name) - a * d.width/2;	//center the bar on the tick
                })
                .attr( 'height', function (d) {
                    return a * d.width;	//`a` already accounts for both types of padding
                } )
                .attr( 'width', chartWidth )
                .attr( 'fill', backgroundColor);

            bargroups.append( 'rect' )
                .classed( 'bg-hover', true )
                .attr( 'y', chartHeight )
                .attr( 'x', 0 )
                .merge( rows )
                .attr( 'x',  -margin.left - 30)
                .attr( 'y', function (d, i) {
                    return yScale(d.name) - a * d.width/2;	//center the bar on the tick
                })
                .attr( 'height', function (d) {
                    return a * d.width;	//`a` already accounts for both types of padding
                } )
                .on( 'mouseover', rowHoverOver )
                .on('mouseout', rowHoverOut)
                .attr( 'width', width )
                .attr( 'fill', backgroundHoverColor )
                .attr( 'fill-opacity', 0);
//                .attr('stroke', 'red');

            // now add the actual bars to what we got
            bargroups
                .append( 'rect' )
                .attr( 'class', function( d ) {
                    return 'focus-bar';
                } )
                .attr( 'y', chartHeight )
                .attr( 'x', 0 )
                .attr( 'height', function( d ) {
                    return a * d.width;	//`a` already accounts for both types of padding
                } )
                .attr( 'width', ( { value } ) => xScale( value ) )
                .merge( rows )
                .attr( 'x', 0 )
                .attr( 'y', function( d, i ) {
                    return yScale( d.name ) - a * d.width / 2;
                    //center the bar on the tick
                } )
                .attr( 'height', function( d ) {
                    return a * d.width;	//`a` already accounts for both types of padding
                } )
                .attr( 'width', ( { parentCount } ) => {
                    return parentCount ? xScale( parentCount ) : 0;
                } )
                .attr( 'fill', parentFocusColor )
                .attr( 'fill-opacity', ( d ) => {
                    return d.parent ? 0.5 : 1;
                } );

            // now add the actual bars to what we got
            bargroups
                .append( 'rect' )
                .attr( 'class', function(d){
                    return 'pct';
                } )
                .attr( 'y', chartHeight )
                .attr( 'x', 0 )
                .attr( 'height', function (d) {
                    return a * d.width;	//`a` already accounts for both types of padding
                } )
                .attr( 'width', ( { value } ) => xScale( value ) )
                .on( 'mouseover', function( d, index, rowList ) {
                    handleMouseOver( this, d, rowList, chartWidth, chartHeight );
                } )
                .on( 'mousemove', function( d ) {
                    handleMouseMove( this, d, chartWidth, chartHeight );
                } )
                .on( 'mouseout', function( d, index, rowList ) {
                    handleMouseOut( this, d, rowList, chartWidth, chartHeight );
                } )
                .on( 'click', function( d ) {
                    handleClick( this, d, chartWidth, chartHeight );
                } )
                .merge( rows )
                .attr( 'x', 0 )
                .attr( 'y', function (d, i) {
                    return yScale(d.name) - a * d.width/2;
                    //center the bar on the tick
                })
                .attr( 'height',function (d) {
                    return a * d.width;	//`a` already accounts for both types of padding
                } )
                .attr( 'width', ( { value } ) => xScale( value ) )
                .attr( 'fill', ( d ) => {
                    return computeColor( d.name );
                } )
                .attr('fill-opacity', (d)=>{
                    return d.parent ? 0.5 : 1;
                });

            const backgroundRows = d3Selection.select( '.chart-group .bg' );
            if(enableLabels && backgroundRows.node()) {
                const bgWidth = backgroundRows.node().getBBox().x || backgroundRows.node().getBoundingClientRect().width;

                bargroups.append( 'text' )
                    .classed( 'percentage-label', true )
                    .classed( 'child', ( d ) => !isParent( d ) )
                    .attr( 'x', _labelsHorizontalX )
                    .attr( 'y', _labelsHorizontalY )
                    .text( (d)=>{
                        return _labelsFormatValue(d, bgWidth);
                    } )
                    .attr( 'font-size', getFontSize )
                    .attr( 'fill', ( d, i ) => {
                        const barWidth = xScale( d.value );
                        const labels = bargroups.selectAll( 'text' );
                        const textWidth = labels._groups[ i ][ 0 ].getComputedTextLength() + 10;
                        return ( bgWidth > 0 && bgWidth - barWidth < textWidth ) ? '#FFF' : '#000';
                    } )
                    .attr( 'transform', ( d, i ) => {
                        const barWidth = d.parentCount ? xScale( d.parentCount ) : xScale( d.value );
                        const labels = bargroups.selectAll( 'text' );
                        const textWidth = labels._groups[ i ][ 0 ].getComputedTextLength() + 10;
                        if ( bgWidth > 0 && bgWidth - barWidth < textWidth ) {
                            return `translate(-${textWidth}, 0)`;
                        }
                    } )
                    .on( 'mouseover', rowHoverOver )
                    .on('mouseout', rowHoverOut );
            }

            if(enableYAxisRight && enableLabels) {
                const gunit  = bargroups
                    .append( 'g' )
                    .attr( 'transform', `translate(${chartWidth + 10}, 0)` )
                    .classed( 'change-label-group', true );

                // each group should contain the labels and rows
                gunit.append( 'text' )
                    .attr( 'y', _labelsHorizontalY )
                    .attr('font-size', getFontSize)
                    .attr('font-weight', '600')
                    .style( 'fill', ( d ) => {
                        if(d.pctChange === 0 || isNaN(d.pctChange)) {
                            return '#919395';
                        }
                        return d.pctChange > 0 ? upArrowColor : downArrowColor;
                    } )
                    .text( _labelsFormatPct );

                // arrows up and down to show percent change.
                gunit.append( 'polygon' )
                    .attr( 'transform', ( d ) => {
                        const yPos = _labelsHorizontalY( d );
                        if(isParent(d)) {
                            return d.pctChange < 0 ? `translate(65, ${yPos+5}) rotate(180) scale(1.5)` :
                                `translate(50, ${yPos - 15}) scale(1.5)`;
                        }
                        return d.pctChange < 0 ? `translate(50, ${yPos+5}) rotate(180)` : `translate(40, ${yPos - 10})`;
                    } )
                    .attr( 'points', function( d ) {
                        return '2,8 2,13 8,13 8,8 10,8 5,0 0,8';
                    } )
                    .style( 'fill', ( d ) => {
                        return d.pctChange > 0 ? upArrowColor : downArrowColor;
                    } )
                    .attr( 'class', function( d ) {
                        return d.pctChange < 0 ? 'down' : 'up';
                    } )
                    // just hide the percentages if the number is bogus
                    .attr( 'fill-opacity', function( d ) {
                        const pctChange = d.pctChange;
                        return ( isNaN( pctChange ) || pctChange === 0 ) ? 0.0 : 1.0;
                    } );
            }
        }

        /**
         * Draws and animates the rows along the x axis
         * @param  {D3Selection} rows Selection of rows
         * @return {void}
         */
        function drawAnimatedHorizontalRows(rows) {
            rows
                .attr( 'x', 0 )
                .attr( 'y', function (d, i) {
                    return yScale(d.name) - a * d.width/2;
                    //center the bar on the tick
                })
                .attr( 'height', function (d) {
                    return a * d.width;	//`a` already accounts for both types of padding
                })
                // .attr( 'fill', ( { name } ) => computeColor( name ) )
                .attr( 'fill', ( d ) => {
                    return computeColor( d.name );
                } )
                .attr('width', 0)
                .transition()
                .duration( animationDuration )
                .ease( ease )
                .attr( 'width', ( { value } ) => xScale( value ) );
        }

        function drawLegend() {
            if(!isPrintMode)
                return;
            const pos = Number.parseInt(chartWidth) + Number.parseInt(margin.right);

            tooltipTextContainer = svg.selectAll('.legend-group')
                .append('g')
                .attr('transform', 'translate(' + pos + ", 0)")
                .classed('tooltip-text', true);

            tooltipBody = tooltipTextContainer
                .append('g')
                .classed('tooltip-body', true)
                .style('transform', 'translateY(8px)')
                .style('fill', textFillColor);

            const keys = data.filter(o=>o.isParent);
            keys.forEach(updateTopicContent);
        }

        /**
         * Draws the data entries inside the tooltip for a given topic
         * @param  {Object} topic Topic to extract data from
         * @return void
         * @private
         */
        function updateTopicContent(topic){
            let name = topic.name,
                tooltipRight,
                tooltipLeftText,
                tooltipRightText,
                elementText;

            tooltipLeftText = topic.topicName || name;
            tooltipRightText = topic.value;

            elementText = tooltipBody
                .append('text')
                .classed('tooltip-left-text', true)
                .attr('dy', '1em')
                .attr('x', ttTextX)
                .attr('y', ttTextY)
                .style('fill', tooltipTextColor)
                .text(tooltipLeftText)
                .call(textWrap, tooltipMaxTopicLength, initialTooltipTextXPosition);

            // tooltipRight = tooltipBody
            //     .append('text')
            //     .classed('tooltip-right-text', true)
            //     .attr('dy', '1em')
            //     .attr('x', ttTextX)
            //     .attr('y', ttTextY)
            //     .style('fill', tooltipTextColor)
            //     .text(tooltipRightText);

            // IE11 give us sometimes a height of 0 when hovering on top of the vertical marker
            // This hack fixes it for some cases, but it doesn't work in multiline (they won't wrap)
            // Let's remove this once we stop supporting IE11
            textHeight = elementText.node().getBBox().height ? elementText.node().getBBox().height : textHeight;

            tooltipHeight += textHeight + tooltipTextLinePadding;
            // update the width if it exists because IE renders the elements
            // too slow and cant figure out the width?
            // tooltipRightWidth = tooltipRight.node().getBBox().width ? tooltipRight.node().getBBox().width : tooltipRightWidth;
            // tooltipRight.attr( 'x', tooltipWidth - tooltipRightWidth - 10 - tooltipWidth / 4 );

            tooltipBody
                .append('circle')
                .classed('tooltip-circle', true)
                .attr('cx', 23 - tooltipWidth / 4)
                .attr('cy', (ttTextY + circleYOffset))
                .attr('r', 5)
                .style('fill', colorMap(name))
                .style('stroke-width', 1);

            ttTextY += textHeight + 7;
        }

        /**
         * Draws the row elements within the chart group
         * @private
         */
        function drawRows() {
            let rows;

            if (isAnimated) {
                rows = svg.select('.chart-group').selectAll('.row')
                    .data(dataZeroed);

                drawHorizontalRows(rows);

                if(data && data[0] && data[0].parentCount){
                    svg.select('.chart-group').append('line')
                        .classed('focus-separator', true)
                        .attr('y1', -10)
                        .attr('x1', xScale(data[0].parentCount))
                        .attr('y2', chartHeight + margin.top + margin.bottom)
                        .attr('x2', xScale(data[0].parentCount))
                        .style('stroke', parentFocusColor)
                        .style('stroke-width', 1);
                }

                // adding separator line
                svg.select('.chart-group').append('line')
                    .classed('pct-separator', true)
                    .attr('y1', -10)
                    .attr('x1', chartWidth)
                    .attr('y2', chartHeight)
                    .attr('x2', chartWidth)
                    .style('stroke', '#000')
                    .style('stroke-width', 1);

                rows = svg.select('.chart-group').selectAll('.row rect.pct')
                    .data(data);

                    drawAnimatedHorizontalRows(rows);
            } else {
                rows = svg.select('.chart-group').selectAll('rect')
                    .data(data);

                drawHorizontalRows(rows);
            }

            // Exit
            rows.exit()
                .transition()
                .style('opacity', 0)
                .remove();
        }

        function drawChartTitleLabels() {
            // chart group
            // adding separator line
            if(!(data && data[0]))
                return;

            let focusWidth = data[0].parentCount ? xScale(data[0].parentCount) : 1;
            focusWidth = focusWidth > 0 ? focusWidth : 1;
            const focusCount = data[0].parentCount;
            svg.select('.title-group').selectAll('g').remove();
            svg.select('.title-group').selectAll('text').remove();

            const ua = window.navigator.userAgent;
            const isIE = ua.indexOf( 'Edge' ) > -1 || ua.indexOf( 'MSIE' ) > -1;
            // for EXPORT ONLY!
            const xPatch = isIE && isPrintMode ? 0 : 0;
            const titleMarginTop = 10;
            if(labelsFocusTitle && focusCount) {
                let focusTitle = `${labelsFocusTitle} ${focusCount.toLocaleString()}`;
                let w = textHelper.getTextWidth( focusTitle, labelsSizeChild, 'sans-serif' );
                const moPadding = isPrintMode ? 100 : 40;
                const availfocusTitleAreaWidth = margin.left + focusWidth - moPadding - xPatch;
                let wasTrimmed = false;
                while(w > availfocusTitleAreaWidth){
                    labelsFocusTitle = labelsFocusTitle.slice(0, -1);
                    wasTrimmed = true;
                    focusTitle = `${labelsFocusTitle}... ${focusCount.toLocaleString()}`;
                    w = textHelper.getTextWidth( focusTitle, labelsSizeChild, 'sans-serif' );
                }

                const focusTitleGroup = svg.select( '.title-group' ).append( 'text' )
                    .text(null)
                    .attr( 'y', titleMarginTop );

                labelsFocusTitle = wasTrimmed ? labelsFocusTitle + '...' : labelsFocusTitle;
                const span1 = focusTitleGroup.append('tspan')
                    .text( labelsFocusTitle )
                    .attr('font-size', labelsSizeChild);

                focusTitleGroup.append('tspan')
                    .text( focusCount.toLocaleString() )
                    .classed('count', true)
                    .attr('dx', 5)
                    .attr('font-size', labelsSizeChild)
                    .attr( 'font-weight', 600 );

                let w1 = span1.node().getBoundingClientRect().width + 10;
                if ( isPrintMode && isIE ) {
                    // wasTrimmed
                    w1 += 40;
                }

                let shiftFocus = focusWidth - w1 - 5;

                focusTitleGroup.attr( 'x', shiftFocus );

            }

            if(labelsTotalCount) {
                const compCountTxt = labelsTotalText + ' ' + labelsTotalCount;
                let cw = textHelper.getTextWidth( compCountTxt, labelsSizeChild, 'sans-serif' );
                let printPadding = isPrintMode && isIE ? 10 : 0;

                const ieTweak = isIE ? 5 :0;
                const complaintTotalGroup = svg.select( '.title-group' ).append( 'text' )
                    .text( null )
                    .attr( 'x', chartWidth - cw - printPadding - 10 - ieTweak - 5)
                    .attr( 'y', titleMarginTop );

                complaintTotalGroup.append('tspan')
                    .text(labelsTotalText)
                    .attr( 'font-size', labelsSizeChild );

                complaintTotalGroup.append('tspan')
                    .text( labelsTotalCount )
                    .classed('count', true)
                    .attr('dx', 5)
                    .attr( 'font-size', labelsSizeChild )
                    .attr( 'font-weight', 600 );

                complaintTotalGroup.attr('x', chartWidth - complaintTotalGroup.node().getBoundingClientRect().width - 10 - printPadding)

            }

            if(labelsInterval) {
                svg.select( '.title-group' )
                    .append( 'text' )
                    .text( `Change in past ${labelsInterval}` )
                    .attr( 'font-size', labelsSizeChild )
                    .attr( 'x', chartWidth + 5 )
                    .attr( 'y', titleMarginTop );

            }
        }

        /**
         * Draws grid lines on the background of the chart
         * @return void
         */
        function drawGridLines() {
            if(enableGridLines){
                svg.select('.grid-lines-group')
                    .selectAll('line')
                    .remove();

                    drawHorizontalGridLines();
            }
        }

        /**
         * Draws the grid lines for an horizontal row chart
         * @return {void}
         */
        function drawHorizontalGridLines() {
            maskGridLines = svg.select('.grid-lines-group')
                .selectAll('line.vertical-grid-line')
                .data(xScale.ticks(4))
                .enter()
                  .append('line')
                    .attr('class', 'vertical-grid-line')
                    .attr('y1', margin.top + 20)
                    .attr('x1', (d) => xScale(d))
                    .attr('y2', chartHeight)
                    .attr('x2', (d) => xScale(d));

            drawVerticalExtendedLine();
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
                    .attr('y1', margin.top + 20)
                    .attr('x1', 0)
                    .attr('y2', chartHeight)
                    .attr('x2', 0);
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
         * Custom OnMouseOver event handler
         * @return {void}
         * @private
         */
        function handleMouseOver(e, d, rowList, chartWidth, chartHeight) {
            dispatcher.call('customMouseOver', e, d, d3Selection.mouse(e), [chartWidth, chartHeight]);
            highlightRowFunction = highlightRowFunction || function() {};

            // eyeball fill-opacity
            rowHoverOver(d);

            if (hasSingleRowHighlight) {
                highlightRowFunction(d3Selection.select(e));
                return;
            }

            rowList.forEach(rowRect => {
                if (rowRect === e) {
                    return;
                }
                highlightRowFunction(d3Selection.select(rowRect));
            });
        }

        function rowHoverOver(d, i) {
            // eyeball fill-opacity 1
            // we should find the index of the currently hovered over row
            let ind = i;
            if(typeof d.name === "string" || typeof d === "string") {
                ind = d.name ? getIndex( d.name ) : getIndex( d );
            }

            d3Selection.select(containerRoot).select('.tick svg.visibility-' + ind).attr('opacity', 1);
            d3Selection.select(containerRoot).select('g.row_' + ind + ' .bg-hover').attr('fill-opacity', 1);
        }

        function rowHoverOut(d, i) {
            // eyeball fill-opacity 0
            // we should find the index of the currently hovered over row
            let ind = i;
            if(typeof d.name === "string" || typeof d === "string") {
                ind = d.name ? getIndex( d.name ) : getIndex( d );
            }

            d3Selection.select(containerRoot).select('.tick svg.visibility-' + ind).attr('opacity', 0);
            d3Selection.select(containerRoot).select('g.row_' + ind + ' .bg-hover').attr('fill-opacity', 0);
        }

        function getIndex(name){
            return data.findIndex((o)=>{
                return o.name === name;
            });
        }
        /**
         * Custom OnMouseMove event handler
         * @return {void}
         * @private
         */
        function handleMouseMove(e, d, chartWidth, chartHeight) {
            dispatcher.call('customMouseMove', e, d, d3Selection.mouse(e), [chartWidth, chartHeight]);
        }

        /**
         * Custom OnMouseOver event handler
         * @return {void}
         * @private
         */
        function handleMouseOut(e, d, rowList, chartWidth, chartHeight) {
            dispatcher.call('customMouseOut', e, d, d3Selection.mouse(e), [chartWidth, chartHeight]);

            // eyeball fill-opacity 0
            rowHoverOut(d);

            rowList.forEach((rowRect) => {
                d3Selection.select(rowRect).attr('fill', ({name}) => colorMap(name));
            });
        }

        /**
         * Custom onClick event handler
         * @return {void}
         * @private
         */
        function handleClick(e, d, chartWidth, chartHeight) {
            dispatcher.call('customClick', e, d, d3Selection.mouse(e), [chartWidth, chartHeight]);
        }

        // API

        /**
         * Gets or Sets the background color of a row in the chart
         * @param  {string} _x desired color of the bar bg in hex
         * @return {string} current color
         * @public
         */
        exports.backgroundColor = function(_x) {
            if (!arguments.length) {
                return backgroundColor;
            }
            backgroundColor = _x;

            return this;
        }

        /**
         * Gets or Sets the up arrow color of a row in the chart
         * @param  {string} _x desired color of the bar bg in hex
         * @return {string} current color
         * @public
         */
        exports.upArrowColor = function(_x) {
            if (!arguments.length) {
                return upArrowColor;
            }
            upArrowColor = _x;

            return this;
        }

        /**
         * Gets or Sets the down arrow color of a row in the chart
         * @param  {string} _x desired color of the bar bg in hex
         * @return {string} current color
         * @public
         */
        exports.downArrowColor = function(_x) {
            if (!arguments.length) {
                return downArrowColor;
            }
            downArrowColor = _x;

            return this;
        }


        /**
         * Gets or Sets the background width of a row in the chart, num in
         * percentage
         * @param  {integer} _x desired width percentage
         * @return {integer} current percentage
         * @public
         */
        exports.backgroundWidth = function(_x) {
            if (!arguments.length) {
                return backgroundWidth;
            }
            backgroundWidth = _x;

            return this;
        }

        /**
         * Gets or Sets the gradient colors of a row in the chart
         * @param  {String[]} _x Desired color gradient for the line (array of two hexadecimal numbers)
         * @return {String[] | module} Current color gradient or Line Chart module to chain calls
         * @public
         */
        exports.chartGradient = function(_x) {
            if (!arguments.length) {
                return chartGradientColors;
            }
            chartGradientColors = _x;

            return this;
        }

        /**
         * Gets or Sets the colorSchema of the chart
         * @param  {String[]} _x Desired colorSchema for the graph
         * @return { colorSchema | module} Current colorSchema or Chart module to chain calls
         * @public
         */
        exports.colorSchema = function(_x) {
            if (!arguments.length) {
                return colorSchema;
            }
            colorSchema = _x;

            return this;
        };

        /**
         * If true, adds gridlines to row chart
         * @param  {Boolean} [_x=false]
         * @return {Boolean | module} Current value of enableGridLines or Chart module to chain calls
         * @public
         */
        exports.enableGridLines = function(_x) {
            if (!arguments.length) {
                return enableGridLines;
            }
            enableGridLines = _x;

            return this;
        };


        /**
         * If true, adds labels at the end of the rows
         * @param  {Boolean} [_x=false]
         * @return {Boolean | module}    Current value of enableLabels or Chart module to chain calls
         * @public
         */
        exports.enableLabels = function(_x) {
            if (!arguments.length) {
                return enableLabels;
            }
            enableLabels = _x;

            return this;
        };

        /**
         * If true, adds right axis with the delta change
         * @param  {Boolean} [_x=false]
         * @return {Boolean | module}    Current value of enableYAxisRight or Chart module to chain calls
         * @public
         */
        exports.enableYAxisRight = function(_x) {
            if (!arguments.length) {
                return enableYAxisRight;
            }
            enableYAxisRight = _x;

            return this;
        };

        /**
         * Chart exported to png and a download action is fired
         * @param {String} filename     File title for the resulting picture
         * @param {String} title        Title to add at the top of the exported picture
         * @public
         */
        exports.exportChart = function(filename, title) {
            exportChart.call(exports, svg, filename, title);
        };

        /**
         * Gets or Sets the hasPercentage status
         * @param  {boolean} _x     Should use percentage as value format
         * @return {boolean | module} Is percentage used or Chart module to chain calls
         * @public
         */
        exports.hasPercentage = function(_x) {
            if (!arguments.length) {
                return numberFormat === PERCENTAGE_FORMAT;
            }
            if (_x) {
                numberFormat = PERCENTAGE_FORMAT;
            } else {
                numberFormat = NUMBER_FORMAT;
            }

            return this;
        };

        /**
         * Gets or Sets the hasSingleRowHighlight status.
         * If the value is true (default), only the hovered row is considered to
         * be highlighted and will be darkened by default. If the value is false,
         * all the rows but the hovered row are considered to be highlighted
         * and will be darkened (by default). To customize the row highlight or
         * remove it completely, use highlightRowFunction instead.
         * @param  {boolean} _x        Should highlight the hovered row
         * @return {boolean | module} Is hasSingleRowHighlight used or Chart module to chain calls
         * @public
         */
        exports.hasSingleRowHighlight = function(_x) {
            if (!arguments.length) {
                return hasSingleRowHighlight;
            }
            hasSingleRowHighlight = _x;

            return this;
        }

        /**
         * Gets or Sets the height of the chart
         * @param  {number} _x Desired width for the graph
         * @return {height | module} Current height or Chart module to chain calls
         * @public
         */
        exports.height = function(_x) {
            if (!arguments.length) {
                return height;
            }
            height = _x;

            return this;
        };

        /**
         * Gets or Sets the highlightRowFunction function. The callback passed to
         * this function returns a row selection from the row chart. Use this function
         * if you want to apply a custom behavior to the highlighted row on hover.
         * When hasSingleRowHighlight is true the highlighted row will be the
         * one that was hovered by the user. When hasSingleRowHighlight is false
         * the highlighted rows are all the rows but the hovered one. The default
         * highlight effect on a row is darkening the highlighted row(s) color.
         * @param  {Function} _x        Desired operation operation on a hovered row passed through callback
         * @return {highlightRowFunction | module} Is highlightRowFunction used or Chart module to chain calls
         * @public
         * @example rowChart.highlightRowFunction(row => row.attr('fill', 'blue'))
         * rowChart.highlightRowFunction(null) // will disable the default highlight effect
         */
        exports.highlightRowFunction = function(_x) {
            if (!arguments.length) {
                return highlightRowFunction;
            }
            highlightRowFunction = _x;

            return this;
        }

        /**
         * Gets or Sets the isAnimated property of the chart, making it to animate when render.
         * By default this is 'false'
         *
         * @param  {Boolean} _x Desired animation flag
         * @return {isAnimated | module} Current isAnimated flag or Chart module
         * @public
         */
        exports.isAnimated = function(_x) {
            if (!arguments.length) {
                return isAnimated;
            }
            isAnimated = _x;

            return this;
        };

        /**
         * Offset between end of row and start of the percentage rows
         * @param  {number} [_x=7] margin offset from end of row
         * @return {number | module}    Current offset or Chart module to chain calls
         * @public
         */
        exports.labelsMargin = function(_x) {
            if (!arguments.length) {
                return labelsMargin;
            }
            labelsMargin = _x;

            return this;
        }

        /**
         * Gets or Sets the labels number format
         * @param  {string} [_x=",f"] desired label number format for the row chart
         * @return {string | module} Current labelsNumberFormat or Chart module to chain calls
         * @public
         */
        exports.labelsNumberFormat = function(_x) {

            if (!arguments.length) {
                return labelsNumberFormat;
            }
            labelsNumberFormat = _x;

            return this;
        }

        exports.labelsSuffix = function(_x) {

            if (!arguments.length) {
                return labelsSuffix;
            }
            labelsSuffix = _x;

            return this;
        }

        /**
         * Get or Sets the labels text size
         * @param  {number} [_x=12] label font size
         * @return {number | module}    Current text size or Chart module to chain calls
         * @public
         */
        exports.labelsSize = function(_x) {
            if (!arguments.length) {
                return labelsSize;
            }
            labelsSize = _x;

            return this;
        };

        /**
         * Get or Sets the labels text size for child rows
         * @param  {number} [_x=12] label font size
         * @return {number | module} Current text size or Chart module to chain calls
         * @public
         */
        exports.labelsSizeChild = function(_x) {
            if (!arguments.length) {
                return labelsSizeChild;
            }
            labelsSizeChild = _x;

            return this;
        };


        /**
         * Get or Sets the labels text size for the percentages
         * @param  {number} [_x=12] label font size
         * @return {number | module}    Current text size or Chart module to chain calls
         * @public
         */
        exports.pctChangeLabelSize = function(_x) {
            if (!arguments.length) {
                return pctChangeLabelSize;
            }
            pctChangeLabelSize
                = _x;

            return this;
        };

        /**
         * Gets or Sets the loading state of the chart
         * @param  {string} markup Desired markup to show when null data
         * @return {loadingState | module} Current loading state markup or Chart module to chain calls
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
         * @param  {object} _x Margin object to get/set
         * @return {margin | module} Current margin or Chart module to chain calls
         * @public
         */
        exports.margin = function(_x) {
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
         * @param  {Number} _x Desired nameLabel for the graph
         * @return {nameLabel | module} Current nameLabel or Chart module to chain calls
         * @public
         */
        exports.nameLabel = function(_x) {
            if (!arguments.length) {
                return nameLabel;
            }
            nameLabel = _x;

            return this;
        };

        /**
         * Gets or Sets the number format of the row chart
         * @param  {string} _x Desired number format for the row chart
         * @return {numberFormat | module} Current numberFormat or Chart module to chain calls
         * @public
         */
        exports.numberFormat = function(_x) {
            if (!arguments.length) {
                return numberFormat;
            }
            numberFormat = _x;

            return this;
        }

        /**
         * Exposes an 'on' method that acts as a bridge with the event dispatcher
         * We are going to expose this events:
         * customMouseOver, customMouseMove, customMouseOut, and customClick
         *
         * @return {module} Row Chart
         * @public
         */
        exports.on = function() {
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
         * Gets or Sets whether the color list should be reversed or not
         * @param  {boolean} _x     Should reverse the color list
         * @return {boolean | module} Is color list being reversed or Chart module to chain calls
         * @public
         */
        exports.shouldReverseColorList = function(_x) {
            if (!arguments.length) {
                return shouldReverseColorList;
            }
            shouldReverseColorList = _x;

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
         * Changes the order of items given the custom function
         * @param  {Function} _x             A custom function that sets logic for ordering
         * @return {(Function | Module)}   A custom ordering function or Chart module to chain calls
         * @public
         */
        exports.orderingFunction = function(_x) {
            if (!arguments.length) {
                return orderingFunction;
            }
            orderingFunction = _x;

            return this;
        };

        /**
         * Gets or Sets the outerPadding of the chart
         * @param  {Number} _x Desired pctChangeLabel for the graph
         * @return { valueLabel | module} Current pctChangeLabel or Chart module to chain calls
         * @public
         */
        exports.outerPadding = function(_x) {
            if (!arguments.length) {
                return outerPadding;
            }
            outerPadding = _x;

            return this;
        };

        /**
         * Gets or Sets the padding of the chart
         * @param  {Number} _x Desired pctChangeLabel for the graph
         * @return { valueLabel | module} Current pctChangeLabel or Chart module to chain calls
         * @public
         */
        exports.padding = function(_x) {
            if (!arguments.length) {
                return padding;
            }
            padding = _x;

            return this;
        };

        /**
         * Gets or Sets the pctChangeLabel of the chart
         * @param  {String} _x Desired pctChangeLabel for the graph
         * @return { String | module} Current pctChangeLabel or Chart module to chain calls
         * @public
         */
        exports.pctChangeLabel = function(_x) {
            if (!arguments.length) {
                return pctChangeLabel;
            }
            pctChangeLabel = _x;

            return this;
        };


        /**
         * Gets or Sets the pctOfSet of the chart
         * @param  {String} _x Desired pctOfSet for the graph
         * @return { String | module} Current pctOfSet or Chart module to chain
         * calls
         * @public
         */
        exports.pctOfSet = function(_x) {
            if (!arguments.length) {
                return pctOfSet;
            }
            pctOfSet = _x;

            return this;
        };

        /**
         * Gets or Sets the yAxisLineWrapLimit of the chart, default 2
         * @param  {Number} _x Desired yAxisLineWrapLimit for the graph
         * @return { Number | module} Current valueLabel or Chart module to
         * chain calls
         * @public
         */
        exports.yAxisLineWrapLimit = function(_x) {
            if (!arguments.length) {
                return yAxisLineWrapLimit;
            }
            yAxisLineWrapLimit = _x;

            return this;
        };

        /**
         * Gets or Sets the labelsFocusTitle of the chart
         * @param {String} _x Desired labelsFocusTitle for the graph
         * @return { String | module} Current labelsFocusTitle or Chart
         * module to chain calls
         * @public
         */
        exports.labelsFocusTitle = function(_x) {
            if (!arguments.length) {
                return labelsFocusTitle;
            }
            labelsFocusTitle = _x;

            return this;
        };

        /**
         * Gets or Sets the labelsTotalCount of the chart
         * @param {String} _x Desired labelsTotalCount for the graph
         * @return { String | module} Current labelsTotalCount or Chart
         * module to chain calls
         * @public
         */
        exports.labelsTotalCount = function(_x) {
            if (!arguments.length) {
                return labelsTotalCount;
            }
            labelsTotalCount = _x;

            return this;
        };

        /**
         * Gets or Sets the labelsTotalText of the chart. Companion text for
         * the count.  Total complaints XXXXXX
         * @param {String} _x Desired labelsTotalText for the graph
         * @return { String | module} Current labelsTotalText or Chart
         * module to chain calls
         * @public
         */
        exports.labelsTotalText = function(_x) {
            if (!arguments.length) {
                return labelsTotalText;
            }
            labelsTotalText = _x;

            return this;
        };


        /**
         * Gets or Sets the labelsInterval of the chart
         * @param  {String} _x Desired labelsInterval for the graph
         * @return { labelsInterval | module} Current labelsInterval or Chart module to chain calls
         * @public
         */
        exports.labelsInterval = function(_x) {
            if (!arguments.length) {
                return labelsInterval;
            }
            labelsInterval = _x;

            return this;
        };

        /**
         * Gets or Sets the valueLabel of the chart
         * @param  {Number} _x Desired valueLabel for the graph
         * @return { valueLabel | module} Current valueLabel or Chart module to chain calls
         * @public
         */
        exports.valueLabel = function(_x) {
            if (!arguments.length) {
                return valueLabel;
            }
            valueLabel = _x;

            return this;
        };

        /**
         * Gets or Sets the width of the chart
         * @param  {number} _x Desired width for the graph
         * @return {width | module} Current width or Chart module to chain calls
         * @public
         */
        exports.width = function(_x) {
            if (!arguments.length) {
                return width;
            }
            width = _x;

            return this;
        };

        /**
         * Gets or Sets the number of ticks of the x axis on the chart
         * (Default is 5)
         * @param  {Number} _x          Desired horizontal ticks
         * @return {Number | module}    Current xTicks or Chart module to chain calls
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
         * Space between y axis and chart
         * (Default 10)
         * @param  {Number} _x          Space between y axis and chart
         * @return {Number| module}     Current value of yAxisPaddingBetweenChart or Chart module to chain calls
         * @public
         */
        exports.yAxisPaddingBetweenChart = function(_x) {
            if (!arguments.length) {
                return yAxisPaddingBetweenChart;
            }
            yAxisPaddingBetweenChart = _x;

            return this;
        };

        /**
         * Gets or Sets the number of vertical ticks on the chart
         * (Default is 6)
         * @param  {Number} _x          Desired number of vertical ticks for the graph
         * @return {Number | module}    Current yTicks or Chart module to chain calls
         * @public
         */
        exports.yTicks = function(_x) {
            if (!arguments.length) {
                return yTicks;
            }
            yTicks = _x;

            return this;
        };

        return exports;
    };

});

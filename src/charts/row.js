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
            width = 960,
            height = 500,
            loadingState = row,
            data,
            dataZeroed,
            chartWidth, chartHeight,
            xScale, yScale, yScale2,
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
            enableYAxisRight = false,
            labelsMargin = 7,
            labelsNumberFormat = NUMBER_FORMAT,
            labelsSuffix = '',
            labelsSize = 12,
            betweenRowsPadding = 0.1,
            xAxis, yAxis, yAxis2,
            xAxisPadding = {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            },
            yAxisPaddingBetweenChart = 10,
            yAxisLineWrapLimit = 1,
            isHorizontal = false,
            svg,

            hasSingleRowHighlight = true,
            isAnimated = false,
            ease = d3Ease.easeQuadInOut,
            animationDuration = 800,
            animationStepRatio = 70,
            backgroundColor = '#bebebe',
            backgroundWidth = 70,
            interRowDelay = (d, i) => animationStepRatio * i,

            highlightRowFunction = (rowSelection) => rowSelection.attr('fill', ({name}) => d3Color.color(colorMap(name)).darker()),
            orderingFunction,

            valueLabel = 'value',
            nameLabel = 'name',
            pctChangeLabel = 'pctChange',
            pctOfSetLabel = 'pctOfSet',
            labelEl,

            baseLine,
            maskGridLines,
            shouldReverseColorList = true,

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

            _labelsFormatValue = ( { value, pctOfSet } ) => {
                let pctLabel = '';
                if(pctOfSet){
                    pctLabel = "  | " + pctOfSet + '%';
                }
                return d3Format.format( labelsNumberFormat )( value ) + ' ' + labelsSuffix + pctLabel;
            },
             _labelsFormatPct = ({pctChange}) => d3Format.format(labelsNumberFormat)(pctChange) + ' ' + labelsSuffix,


            // labels per row, aka XX Complaints
            _labelsHorizontalX = ({value}) => xScale(value) + labelsMargin,
            _labelsHorizontalY= ({name}) => yScale(name) + (yScale.bandwidth() / 2) + (labelsSize * (3/8)),

            // vertical axis labels
            _labelsVerticalX = ({name}) => xScale(name),
            _labelsVerticalY = ({value}) => yScale(value) - labelsMargin,
            _labelsVerticalY1 = ({pctChange}) => yScale2(pctChange) - labelsMargin;
        /**
         * This function creates the graph using the selection as container
         * @param  {D3Selection} _selection A d3 selection that represents
         *                                  the container(s) where the chart(s) will be rendered
         * @param {RowChartData} _data The data to attach and generate the chart
         */
        function exports(_selection) {
            _selection.each(function(_data) {
                chartWidth = width - margin.left - margin.right - (yAxisPaddingBetweenChart * 1.2);
                chartHeight = height - margin.top - margin.bottom;
                ({data, dataZeroed} = sortData(cleanData(_data)));
                buildScales();
                buildAxis();
                buildSVG(this);
                buildGradient();
                drawGridLines();
                drawRows();
                drawAxis();
                if (enableLabels) {
                    drawLabels();
                }
            });
        }

        /**
         * Creates the d3 x and y axis, setting orientations
         * @private
         */
        function buildAxis() {
            if (isHorizontal) {
                xAxis = d3Axis.axisBottom(xScale)
                    .ticks(xTicks, numberFormat)
                    .tickSizeInner([-chartHeight]);

                yAxis = d3Axis.axisLeft(yScale);

                //uncomment to show the right labels with arrows
                if(enableYAxisRight) {
                    yAxis2 = d3Axis.axisRight(yScale2)
                        .ticks(yTicks, numberFormat)
                        .tickFormat(function(d, i) {
                            return d + '%';
                        })
                        .tickSizeOuter(0);
                }
            } else {
                xAxis = d3Axis.axisBottom(xScale);

                yAxis = d3Axis.axisLeft(yScale)
                    .ticks(yTicks, numberFormat)
            }
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
                  .attr('transform', `translate(${margin.left + yAxisPaddingBetweenChart}, ${margin.top-2})`);

            container
                .append('g').classed('grid-lines-group', true);

            container
                .append('g').classed('chart-group-background', true);

            container
                .append('g').classed('chart-group', true);

            // labels on the bottom
            container
                .append('g').classed('x-axis-group axis', true);

            // this is the labels on the left, and the line
            container
                .append('g')
                .attr('transform', `translate(${-1 * (yAxisPaddingBetweenChart)}, 0)`)
                .classed('y-axis-group axis', true);

            // labels on the right side
            container
                .append('g')
                .attr('transform', `translate(${10 * (yAxisPaddingBetweenChart)}, 0)`)
                .classed('y-axis-group axis-right', true);


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

        /**
         * Creates the x and y scales of the graph
         * @private
         */
        function buildScales() {
            let percentageAxis = Math.min(percentageAxisToMaxRatio * d3Array.max(data, getValue))

            if (isHorizontal) {
                xScale = d3Scale.scaleLinear()
                    .domain([0, percentageAxis])
                    .rangeRound([0, chartWidth]);

                yScale = d3Scale.scaleBand()
                    .domain(data.map(getName))
                    .rangeRound([chartHeight, 0])
                    .padding(betweenRowsPadding);

                yScale2 = d3Scale.scaleBand()
                    .domain(data.map(getPctChange))
                    .rangeRound([chartHeight, 0])
                    .padding(betweenRowsPadding);
            } else {
                xScale = d3Scale.scaleBand()
                    .domain(data.map(getName))
                    .rangeRound([0, chartWidth])
                    .padding(betweenRowsPadding);

                yScale = d3Scale.scaleLinear()
                    .domain([0, percentageAxis])
                    .rangeRound([chartHeight, 0]);
            }

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
            if (!svg) {
                svg = d3Selection.select(container)
                    .append('svg')
                      .classed('britechart row-chart', true);

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
                d.pctOfSet = +d[pctOfSetLabel];
                d.pctChange = +d[pctChangeLabel];
                d.value = +d[valueLabel];
                d.name = String(d[nameLabel]);

                return [...acc, d];
            }, []);

            let dataZeroed = data.map((d) => ({
                pctChange: 0,
                value: 0,
                name: String(d[nameLabel])
            }));

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
         * Utility function that wraps a text into the given width
         * @param  {D3Selection} text         Text to write
         * @param  {Number} containerWidth
         * @private
         */
        function wrapText(text, containerWidth) {
            textHelper.wrapTextWithEllipses(text, containerWidth, 0, yAxisLineWrapLimit)
        }

        /**
         * Draws the x and y axis on the svg object within their
         * respective groups
         * @private
         */
        function drawAxis() {
            svg.select('.x-axis-group.axis')
                .attr('transform', `translate(0, ${chartHeight})`)
                .call(xAxis);

            svg.select('.y-axis-group.axis')
                .call(yAxis);

            if (isHorizontal && enableYAxisRight) {
                // adding the right Y axis labels,
                svg.select( '.y-axis-group.axis-right' )
                    .attr('transform', `translate(${chartWidth}, 0)`)
                    .call( yAxis2 );

                // shift the labels over to the right a bit
                // UNCOMMENT this for the percentages

                svg.selectAll( '.y-axis-group.axis-right .tick text' )
                    .attr( 'transform', function(d) {
                        return d > 0 ? 'translate(-3, 0)' : 'translate(-5, 0)';
                    })
                    .attr('fill-opacity', function(d) {
                        return isNaN(d) ? 0.0: 1.0;
                    })
                    .style( 'fill', ( d ) => {
                        return d > 0 ? 'green' : 'red';
                    });

                svg.selectAll('.y-axis-group.axis-right .tick')
                    .append('polygon')
                    .attr( 'transform', function(d) {

                        return d > 0 ? 'translate(42, -8)' : 'translate(52, 8)';
                    })
                    .attr('points', function(d) {
                        return d > 0 ? '2,8 2,13 8,13 8,8 10,8 5,0 0,8' : '-2,-8 -2,-13 -8,-13 -8,-8 -10,-8 -5,0 0,-8';
                    })
                    .style('fill', ( d ) => {
                        return d > 0 ? '#20aa3f' : '#D14124';
                    })
                    .attr('class', function(d){
                        return d > 0 ? 'down' : 'up';
                    })
                    // just hide the percentages if the number is bogus
                    .attr('fill-opacity', function(d){
                        //console.log(d);
                        return isNaN(d) ? 0.0: 1.0;
                    });
            }

            svg.selectAll('.y-axis-group.axis .tick text')
                .call(wrapText, margin.left - yAxisPaddingBetweenChart)
        }

        /**
         * Draws the rows along the x axis
         * @param  {D3Selection} rows Selection of rows
         * @param  {boolean} whether we are doing the background layer
         * @return {void}
         */
        function drawHorizontalRows(rows, bg) {
            if (bg) {
                // Enter + Update
                rows.enter()
                    .append( 'rect' )
                    .classed( 'row', true )
                    .attr( 'y', chartHeight )
                    .attr( 'x', 0 )
                    .attr( 'height', yScale.bandwidth() )
                    .attr( 'width', ( { value } ) => xScale( value ) )
                    .on( 'click', function( d ) {
                        handleClick( this, d, chartWidth, chartHeight );
                    } )
                    .merge( rows )
                    .attr( 'x', 0 )
                    .attr( 'y', ( { name } ) => yScale( name ) )
                    .attr( 'height', yScale.bandwidth() )
                    .attr( 'width', ( { value } ) => xScale( value ) )
                    .attr( 'fill', ( { name } ) => computeColor( name ) );
            }
            else {
                // Enter + Update
                rows.enter()
                    .append( 'rect' )
                    .classed( 'row', true )
                    .attr( 'y', chartHeight )
                    .attr( 'x', 0 )
                    .attr( 'height', yScale.bandwidth() )
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
                    .attr( 'y', ( { name } ) => yScale( name ) )
                    .attr( 'height', yScale.bandwidth() )
                    .attr( 'width', ( { value } ) => xScale( value ) )
                    .attr( 'fill', ( { name } ) => computeColor( name ) );
            }
        }

        /**
         * Draws and animates the rows along the x axis
         * @param  {D3Selection} rows Selection of rows
         * @param  {boolean} whether we are doing the background layer
         * @return {void}
         */
        function drawAnimatedHorizontalRows(rows, bg) {
            if(bg){

            } else {
                // Enter + Update
                rows.enter()
                    .append( 'rect' )
                    .classed( 'row', true )
                    .attr( 'x', 0 )
                    .attr( 'y', chartHeight )
                    .attr( 'height', yScale.bandwidth() )
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
                    } );
            }
            if(bg){
                rows
                    .attr('x', 0)
                    .attr('y', ({name}) => yScale(name))
                    .attr('height', yScale.bandwidth())
                    .attr('fill', backgroundColor)
                    .transition()
                    .duration(animationDuration)
                    .delay(interRowDelay)
                    .ease(ease)
                    .attr('width', backgroundWidth + '%');
            } else {

                rows
                    .attr( 'x', 0 )
                    .attr( 'y', ( { name } ) => yScale( name ) )
                    .attr( 'height', yScale.bandwidth() )
                    .attr( 'fill', ( { name } ) => computeColor( name ) )
                    .transition()
                    .duration( animationDuration )
                    .delay( interRowDelay )
                    .ease( ease )
                    .attr( 'width', ( { value } ) => xScale( value ) );
            }
        }

        /**
         * Draws and animates the rows along the y axis
         * @param  {D3Selection} rows Selection of rows
         * @return {void}
         */
        function drawAnimatedVerticalRows(rows) {
            // Enter + Update
            rows.enter()
              .append('rect')
                .classed('row', true)
                .attr('x', chartWidth)
                .attr('y', ({value}) => yScale(value))
                .attr('width', xScale.bandwidth())
                .attr('height', ({value}) => chartHeight - yScale(value))
                .on('mouseover', function(d, index, rowList) {
                    handleMouseOver(this, d, rowList, chartWidth, chartHeight);
                })
                .on('mousemove', function(d) {
                    handleMouseMove(this, d, chartWidth, chartHeight);
                })
                .on('mouseout', function(d, index, rowList) {
                    handleMouseOut(this, d, rowList, chartWidth, chartHeight);
                })
                .on('click', function(d) {
                    handleClick(this, d, chartWidth, chartHeight);
                })
              .merge(rows)
                .attr('x', ({name}) => xScale(name))
                .attr('width', xScale.bandwidth())
                .attr('fill', ({name}) => computeColor(name))
                .transition()
                .duration(animationDuration)
                .delay(interRowDelay)
                .ease(ease)
                .attr('y', ({value}) => yScale(value))
                .attr('height', ({value}) => chartHeight - yScale(value));
        }

        /**
         * Draws the rows along the y axis
         * @param  {D3Selection} rows Selection of rows
         * @return {void}
         */
        function drawVerticalRows(rows) {
            // Enter + Update
            rows.enter()
              .append('rect')
                .classed('row', true)
                .attr('x', chartWidth)
                .attr('y', ({value}) => yScale(value))
                .attr('width', xScale.bandwidth())
                .attr('height', ({value}) => chartHeight - yScale(value))
                .on('mouseover', function(d, index, rowList) {
                    handleMouseOver(this, d, rowList, chartWidth, chartHeight);
                })
                .on('mousemove', function(d) {
                    handleMouseMove(this, d, chartWidth, chartHeight);
                })
                .on('mouseout', function(d, index, rowList) {
                    handleMouseOut(this, d, rowList, chartWidth, chartHeight);
                })
                .on('click', function(d) {
                    handleClick(this, d, chartWidth, chartHeight);
                })
              .merge(rows)
                .attr('x', ({name}) => xScale(name))
                .attr('y', ({value}) => yScale(value))
                .attr('width', xScale.bandwidth())
                .attr('height', ({value}) => chartHeight - yScale(value))
                .attr('fill', ({name}) => computeColor(name));
        }

        /**
         * Draws labels at the end of each row
         * @private
         * @return {void}
         */
        function drawLabels() {
            let labelXPosition = isHorizontal ? _labelsHorizontalX : _labelsVerticalX;
            let labelYPosition = isHorizontal ? _labelsHorizontalY : _labelsVerticalY;
            let labelYPosition1 = isHorizontal ? _labelsHorizontalY : _labelsVerticalY1;

            let text = _labelsFormatValue

            if (labelEl) {
                svg.selectAll('.percentage-label-group').remove();
            }

            labelEl = svg.select('.metadata-group')
              .append('g')
                .classed('percentage-label-group', true)
                .selectAll('text')
                .data(data.reverse())
                .enter()
                .append('text');

            labelEl
                .classed('percentage-label', true)
                .attr('x', labelXPosition)
                .attr('y', labelYPosition)
                .text(text)
                .attr('font-size', labelsSize + 'px')
        }

        /**
         * Draws the row elements within the chart group
         * @private
         */
        function drawRows() {
            let rows, rowsBg;

            if (isAnimated) {
                rows = svg.select('.chart-group').selectAll('.row')
                    .data(dataZeroed);

                rowsBg = svg.select('.chart-group-background').selectAll('.row')
                    .data(dataZeroed);

                if (isHorizontal) {
                    drawHorizontalRows(rowsBg, true);
                    drawHorizontalRows(rows);
                } else {
                    drawVerticalRows(rows);
                }

                rowsBg = svg.select('.chart-group-background').selectAll('.row')
                    .data(data);

                rows = svg.select('.chart-group').selectAll('.row')
                    .data(data);

                if (isHorizontal) {
                    drawAnimatedHorizontalRows(rowsBg, true);
                    drawAnimatedHorizontalRows(rows);
                } else {
                    drawAnimatedVerticalRows(rows);
                }
            } else {
                rows = svg.select('.chart-group').selectAll('.row')
                    .data(data);

                if (isHorizontal) {
                    drawHorizontalRows(rows);
                } else {
                    drawVerticalRows(rows);
                }
            }

            // Exit
            rows.exit()
                .transition()
                .style('opacity', 0)
                .remove();
        }

        /**
         * Draws grid lines on the background of the chart
         * @return void
         */
        function drawGridLines() {
            svg.select('.grid-lines-group')
                .selectAll('line')
                .remove();

            if (isHorizontal) {
                drawHorizontalGridLines();
            } else {
                drawVerticalGridLines();
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
                    .attr('y1', (xAxisPadding.left))
                    .attr('y2', chartHeight)
                    .attr('x1', (d) => xScale(d))
                    .attr('x2', (d) => xScale(d))

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
                    .attr('y1', (xAxisPadding.bottom))
                    .attr('y2', chartHeight)
                    .attr('x1', 0)
                    .attr('x2', 0);
        }

        /**
         * Draws the grid lines for a vertical row chart
         * @return {void}
         */
        function drawVerticalGridLines() {
            maskGridLines = svg.select('.grid-lines-group')
                .selectAll('line.horizontal-grid-line')
                .data(yScale.ticks(4))
                .enter()
                  .append('line')
                    .attr('class', 'horizontal-grid-line')
                    .attr('x1', (xAxisPadding.left))
                    .attr('x2', chartWidth)
                    .attr('y1', (d) => yScale(d))
                    .attr('y2', (d) => yScale(d))

            drawHorizontalExtendedLine();
        }

        /**
         * Draws a vertical line to extend x-axis till the edges
         * @return {void}
         */
        function drawHorizontalExtendedLine() {
            baseLine = svg.select('.grid-lines-group')
                .selectAll('line.extended-x-line')
                .data([0])
                .enter()
                  .append('line')
                    .attr('class', 'extended-x-line')
                    .attr('x1', (xAxisPadding.left))
                    .attr('x2', chartWidth)
                    .attr('y1', chartHeight)
                    .attr('y2', chartHeight);
        }

        /**
         * Custom OnMouseOver event handler
         * @return {void}
         * @private
         */
        function handleMouseOver(e, d, rowList, chartWidth, chartHeight) {
            dispatcher.call('customMouseOver', e, d, d3Selection.mouse(e), [chartWidth, chartHeight]);
            highlightRowFunction = highlightRowFunction || function() {};

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
         * Gets or Sets the background color of a row in the chart, num in
         * percentage
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
         * Gets or Sets the padding of the chart (Default is 0.1)
         * @param  { Number | module } _x Padding value to get/set
         * @return {padding | module} Current padding or Chart module to chain calls
         * @public
         */
        exports.betweenRowsPadding = function(_x) {
            if (!arguments.length) {
                return betweenRowsPadding;
            }
            betweenRowsPadding = _x;

            return this;
        };

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
         * Gets or Sets the horizontal direction of the chart
         * @param  {number} _x Desired horizontal direction for the graph
         * @return { isHorizontal | module} If it is horizontal or Chart module to chain calls
         * @public
         */
        exports.isHorizontal = function(_x) {
            if (!arguments.length) {
                return isHorizontal;
            }
            isHorizontal = _x;

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
        }

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
        }

        /**
         * Gets or Sets the pctChangeLabel of the chart
         * @param  {Number} _x Desired pctChangeLabel for the graph
         * @return { valueLabel | module} Current pctChangeLabel or Chart module to chain calls
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
         * @param  {Number} _x Desired pctOfSet for the graph
         * @return { valueLabel | module} Current pctOfSet or Chart module to chain calls
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

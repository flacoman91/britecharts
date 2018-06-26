define(function(require) {
    'use strict';

    console.log(' testing 123! ');

    const d3Array = require('d3-array');
    const d3Ease = require('d3-ease');
    const d3Axis = require('d3-axis');
    const d3Color = require('d3-color');
    const d3Dispatch = require('d3-dispatch');
    const d3Format = require('d3-format');
    const d3Scale = require('d3-scale');
    const d3Selection = require('d3-selection');
    const d3Transition = require('d3-transition');

    const textHelper = require('./helpers/text');
    const {exportChart} = require('./helpers/export');
    const colorHelper = require('./helpers/color');
    const {test} = require('./helpers/load');
    const {uniqueId} = require('./helpers/number');

    const PERCENTAGE_FORMAT = '%';
    const NUMBER_FORMAT = ',f';


    /**
     * @typedef TestChartData
     * @type {Object[]}
     * @property {Number} value        Value of the group (required)
     * @property {String} name         Name of the group (required)
     *
     * @example
     * [
     *     {
     *         value: 1,
     *         name: 'foobar',
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
     * Test Chart reusable API class that renders a
     * simple and configurable test chart.
     *
     * @module Test
     * @tutorial test
     * @requires d3-array, d3-axis, d3-dispatch, d3-scale, d3-selection
     *
     * @example
     * var testChart = test();
     *
     * testChart
     *     .height(500)
     *     .width(800);
     *
     * d3Selection.select('.css-selector')
     *     .datum(dataset)
     *     .call(testChart);
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
            loadingState = test,
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
            chartGradientId = uniqueId('test-gradient'),
            yTicks = 5,
            xTicks = 5,
            percentageAxisToMaxRatio = 1,
            numberFormat = NUMBER_FORMAT,
            enableLabels = false,
            labelsMargin = 7,
            labelsNumberFormat = NUMBER_FORMAT,
            labelsSuffix = '',
            labelsSize = 12,
            betweenTestsPadding = 0.1,
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

            hasSingleTestHighlight = true,
            isAnimated = false,
            ease = d3Ease.easeQuadInOut,
            animationDuration = 800,
            animationStepRatio = 70,
            interTestDelay = (d, i) => animationStepRatio * i,

            highlightTestFunction = (testSelection) => testSelection.attr('fill', ({name}) => d3Color.color(colorMap(name)).darker()),
            orderingFunction,

            valueLabel = 'value',
            nameLabel = 'name',
            pctChangeLabel = 'pctChange',
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

            _labelsFormatValue = ({value}) => d3Format.format(labelsNumberFormat)(value) + ' ' + labelsSuffix,

            // labels per bar, aka XX Complaints
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
         * @param {TestChartData} _data The data to attach and generate the chart
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
                drawTests();
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
            console.log('build axis');
            if (isHorizontal) {
                xAxis = d3Axis.axisBottom(xScale)
                    .ticks(xTicks, numberFormat)
                    .tickSizeInner([-chartHeight]);

                yAxis = d3Axis.axisLeft(yScale);

                yAxis2 = d3Axis.axisRight(yScale2);
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
                  .attr('transform', `translate(${margin.left + yAxisPaddingBetweenChart}, ${margin.top})`);

            container
                .append('g').classed('grid-lines-group', true);

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

            console.log(yAxisPaddingBetweenChart);
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
                    .padding(betweenTestsPadding);

                yScale2 = d3Scale.scaleBand()
                    .domain(data.map(getPctChange))
                    .rangeRound([chartHeight, 0])
                    .padding(betweenTestsPadding);
            } else {
                xScale = d3Scale.scaleBand()
                    .domain(data.map(getName))
                    .rangeRound([0, chartWidth])
                    .padding(betweenTestsPadding);

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
                      .classed('britechart test-chart', true);

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
         * @param  {TestChartData} originalData  Raw data as passed to the container
         * @return  {TestChartData}              Clean data
         * @private
         */
        function cleanData(originalData) {
            let data = originalData.reduce((acc, d) => {
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
         * @param {String} name - test's data point name
         * @return {void}
         * @private
         */
        function computeColor(name) {
            return chartGradientColors ? `url(#${chartGradientId})` : colorMap(name);
        }

        /**
         * Sorts data if orderingFunction is specified
         * @param  {TestChartData}     clean unordered data
         * @return  {TestChartData}    clean ordered data
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

            if (isHorizontal) {
                svg.select( '.y-axis-group.axis-right' )
                    .attr('transform', `translate(${ 5 + chartWidth}, 0)`)
                    .call( yAxis2 );
            }

            svg.selectAll('.y-axis-group .tick text')
                .call(wrapText, margin.left - yAxisPaddingBetweenChart)
        }

        /**
         * Draws the tests along the x axis
         * @param  {D3Selection} tests Selection of tests
         * @return {void}
         */
        function drawHorizontalTests(tests) {
            // Enter + Update
            tests.enter()
              .append('rect')
                .classed('test', true)
                .attr('y', chartHeight)
                .attr('x', 0)
                .attr('height', yScale.bandwidth())
                .attr('width', ({value}) => xScale(value))
                .on('mouseover', function(d, index, testList) {
                    handleMouseOver(this, d, testList, chartWidth, chartHeight);
                })
                .on('mousemove', function(d) {
                    handleMouseMove(this, d, chartWidth, chartHeight);
                })
                .on('mouseout', function(d, index, testList) {
                    handleMouseOut(this, d, testList, chartWidth, chartHeight);
                })
                .on('click', function(d) {
                    handleClick(this, d, chartWidth, chartHeight);
                })
              .merge(tests)
                .attr('x', 0)
                .attr('y', ({name}) => yScale(name))
                .attr('height', yScale.bandwidth())
                .attr('width', ({value}) => xScale(value))
                .attr('fill', ({name}) => computeColor(name));
        }

        /**
         * Draws and animates the tests along the x axis
         * @param  {D3Selection} tests Selection of tests
         * @return {void}
         */
        function drawAnimatedHorizontalTests(tests) {
            // Enter + Update
            tests.enter()
              .append('rect')
                .classed('test', true)
                .attr('x', 0)
                .attr('y', chartHeight)
                .attr('height', yScale.bandwidth())
                .attr('width', ({value}) => xScale(value))
                .on('mouseover', function(d, index, testList) {
                    handleMouseOver(this, d, testList, chartWidth, chartHeight);
                })
                .on('mousemove', function(d) {
                    handleMouseMove(this, d, chartWidth, chartHeight);
                })
                .on('mouseout', function(d, index, testList) {
                    handleMouseOut(this, d, testList, chartWidth, chartHeight);
                })
                .on('click', function(d) {
                    handleClick(this, d, chartWidth, chartHeight);
                });

            tests
                .attr('x', 0)
                .attr('y', ({name}) => yScale(name))
                .attr('height', yScale.bandwidth())
                .attr('fill', ({name}) => computeColor(name))
                .transition()
                .duration(animationDuration)
                .delay(interTestDelay)
                .ease(ease)
                .attr('width', ({value}) => xScale(value));
        }

        /**
         * Draws and animates the tests along the y axis
         * @param  {D3Selection} tests Selection of tests
         * @return {void}
         */
        function drawAnimatedVerticalTests(tests) {
            // Enter + Update
            tests.enter()
              .append('rect')
                .classed('test', true)
                .attr('x', chartWidth)
                .attr('y', ({value}) => yScale(value))
                .attr('width', xScale.bandwidth())
                .attr('height', ({value}) => chartHeight - yScale(value))
                .on('mouseover', function(d, index, testList) {
                    handleMouseOver(this, d, testList, chartWidth, chartHeight);
                })
                .on('mousemove', function(d) {
                    handleMouseMove(this, d, chartWidth, chartHeight);
                })
                .on('mouseout', function(d, index, testList) {
                    handleMouseOut(this, d, testList, chartWidth, chartHeight);
                })
                .on('click', function(d) {
                    handleClick(this, d, chartWidth, chartHeight);
                })
              .merge(tests)
                .attr('x', ({name}) => xScale(name))
                .attr('width', xScale.bandwidth())
                .attr('fill', ({name}) => computeColor(name))
                .transition()
                .duration(animationDuration)
                .delay(interTestDelay)
                .ease(ease)
                .attr('y', ({value}) => yScale(value))
                .attr('height', ({value}) => chartHeight - yScale(value));
        }

        /**
         * Draws the tests along the y axis
         * @param  {D3Selection} tests Selection of tests
         * @return {void}
         */
        function drawVerticalTests(tests) {
            // Enter + Update
            tests.enter()
              .append('rect')
                .classed('test', true)
                .attr('x', chartWidth)
                .attr('y', ({value}) => yScale(value))
                .attr('width', xScale.bandwidth())
                .attr('height', ({value}) => chartHeight - yScale(value))
                .on('mouseover', function(d, index, testList) {
                    handleMouseOver(this, d, testList, chartWidth, chartHeight);
                })
                .on('mousemove', function(d) {
                    handleMouseMove(this, d, chartWidth, chartHeight);
                })
                .on('mouseout', function(d, index, testList) {
                    handleMouseOut(this, d, testList, chartWidth, chartHeight);
                })
                .on('click', function(d) {
                    handleClick(this, d, chartWidth, chartHeight);
                })
              .merge(tests)
                .attr('x', ({name}) => xScale(name))
                .attr('y', ({value}) => yScale(value))
                .attr('width', xScale.bandwidth())
                .attr('height', ({value}) => chartHeight - yScale(value))
                .attr('fill', ({name}) => computeColor(name));
        }

        /**
         * Draws labels at the end of each test
         * @private
         * @return {void}
         */
        function drawLabels() {
            let labelXPosition = isHorizontal ? _labelsHorizontalX : _labelsVerticalX;
            let labelYPosition = isHorizontal ? _labelsHorizontalY : _labelsVerticalY;
            let labelYPosition1 = isHorizontal ? _labelsHorizontalY : _labelsVerticalY1;

            let text = _labelsFormatValue

            console.log(text);

            if (labelEl) {
                svg.selectAll('.percentage-label-group').remove();
            }

            console.log(data);
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
         * Draws the test elements within the chart group
         * @private
         */
        function drawTests() {
            let tests;

            if (isAnimated) {
                tests = svg.select('.chart-group').selectAll('.test')
                    .data(dataZeroed);

                if (isHorizontal) {
                    drawHorizontalTests(tests);
                } else {
                    drawVerticalTests(tests);
                }

                tests = svg.select('.chart-group').selectAll('.test')
                    .data(data);

                if (isHorizontal) {
                    drawAnimatedHorizontalTests(tests);
                } else {
                    drawAnimatedVerticalTests(tests);
                }
            } else {
                tests = svg.select('.chart-group').selectAll('.test')
                    .data(data);

                if (isHorizontal) {
                    drawHorizontalTests(tests);
                } else {
                    drawVerticalTests(tests);
                }
            }

            // Exit
            tests.exit()
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
         * Draws the grid lines for an horizontal test chart
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
         * Draws the grid lines for a vertical test chart
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
        function handleMouseOver(e, d, testList, chartWidth, chartHeight) {
            dispatcher.call('customMouseOver', e, d, d3Selection.mouse(e), [chartWidth, chartHeight]);
            highlightTestFunction = highlightTestFunction || function() {};

            if (hasSingleTestHighlight) {
                highlightTestFunction(d3Selection.select(e));
                return;
            }

            testList.forEach(testRect => {
                if (testRect === e) {
                    return;
                }
                highlightTestFunction(d3Selection.select(testRect));
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
        function handleMouseOut(e, d, testList, chartWidth, chartHeight) {
            dispatcher.call('customMouseOut', e, d, d3Selection.mouse(e), [chartWidth, chartHeight]);

            testList.forEach((testRect) => {
                d3Selection.select(testRect).attr('fill', ({name}) => colorMap(name));
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
         * Gets or Sets the gradient colors of a test in the chart
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
        exports.betweenTestsPadding = function(_x) {
            if (!arguments.length) {
                return betweenTestsPadding;
            }
            betweenTestsPadding = _x;

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
         * If true, adds labels at the end of the tests
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
         * Gets or Sets the hasSingleTestHighlight status.
         * If the value is true (default), only the hovered test is considered to
         * be highlighted and will be darkened by default. If the value is false,
         * all the tests but the hovered test are considered to be highlighted
         * and will be darkened (by default). To customize the test highlight or
         * remove it completely, use highlightTestFunction instead.
         * @param  {boolean} _x        Should highlight the hovered test
         * @return {boolean | module} Is hasSingleTestHighlight used or Chart module to chain calls
         * @public
         */
        exports.hasSingleTestHighlight = function(_x) {
            if (!arguments.length) {
                return hasSingleTestHighlight;
            }
            hasSingleTestHighlight = _x;

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
         * Gets or Sets the highlightTestFunction function. The callback passed to
         * this function returns a test selection from the test chart. Use this function
         * if you want to apply a custom behavior to the highlighted test on hover.
         * When hasSingleTestHighlight is true the highlighted test will be the
         * one that was hovered by the user. When hasSingleTestHighlight is false
         * the highlighted tests are all the tests but the hovered one. The default
         * highlight effect on a test is darkening the highlighted test(s) color.
         * @param  {Function} _x        Desired operation operation on a hovered test passed through callback
         * @return {highlightTestFunction | module} Is highlightTestFunction used or Chart module to chain calls
         * @public
         * @example testChart.highlightTestFunction(test => test.attr('fill', 'blue'))
         * testChart.highlightTestFunction(null) // will disable the default highlight effect
         */
        exports.highlightTestFunction = function(_x) {
            if (!arguments.length) {
                return highlightTestFunction;
            }
            highlightTestFunction = _x;

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
         * Offset between end of test and start of the percentage tests
         * @param  {number} [_x=7] margin offset from end of test
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
         * @param  {string} [_x=",f"] desired label number format for the test chart
         * @return {string | module} Current labelsNumberFormat or Chart module to chain calls
         * @public
         */
        exports.labelsNumberFormat = function(_x) {

            console.log('labels');

            console.log(_x);

            console.log(arguments);

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
         * Gets or Sets the number format of the test chart
         * @param  {string} _x Desired number format for the test chart
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
         * @return {module} Test Chart
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

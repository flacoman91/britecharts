'use strict';

const d3Selection = require('d3-selection');
const PubSub = require('pubsub-js');

const test = require('./../../src/charts/test');
const miniTooltip = require('./../../src/charts/mini-tooltip');
const colors = require('./../../src/charts/helpers/color');
const dataBuilder = require('./../../test/fixtures/testChartDataBuilder');

const aTestDataSet = () => new dataBuilder.TestDataBuilder();

require('./helpers/resizeHelper');

function createSimpleTestChart() {
    let testChart = test(),
        testContainer = d3Selection.select('.js-test-chart-container'),
        containerWidth = testContainer.node() ? testContainer.node().getBoundingClientRect().width : false,
        dataset;

    if (containerWidth) {
        dataset = aTestDataSet().withLettersFrequency().build();

        testChart
            .width(containerWidth)
            .hasPercentage(true)
            .enableLabels(true)
            .labelsNumberFormat('.0%')
            .height(300);

        testContainer.datum(dataset).call(testChart);
    }
}

function createHorizontalTestChart() {
    let testChart = test(),
        tooltip = miniTooltip(),
        testContainer = d3Selection.select('.js-horizontal-test-chart-container'),
        containerWidth = testContainer.node() ? testContainer.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        dataset = aTestDataSet().withColors().build();

        testChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 100,
                right: 20,
                top: 20,
                bottom: 30
            })
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSuffix('complaints')
            .colorSchema(['#20aa3f'])
            .width(containerWidth)
            .yAxisPaddingBetweenChart(20)
            .height(250)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(1.3)
            .on('customMouseOver', tooltip.show)
            .on('customMouseMove', tooltip.update)
            .on('customMouseOut', tooltip.hide);

        testContainer.datum(dataset).call(testChart);

        tooltipContainer = d3Selection.select('.js-horizontal-test-chart-container .test-chart .metadata-group');
        tooltipContainer.datum([]).call(tooltip);
    }
}

function createTestChartWithTooltip() {
    let testChart = test(),
        tooltip = miniTooltip(),
        testContainer = d3Selection.select('.js-test-chart-tooltip-container'),
        containerWidth = testContainer.node() ? testContainer.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        d3Selection.select('.js-download-button').on('click', function() {
            testChart.exportChart('testchart.png', 'Britecharts Test Chart');
        });

        dataset = aTestDataSet().withLettersFrequency().build();

        testChart
            .width(containerWidth)
            .height(300)
            .isAnimated(true)
            .on('customMouseOver', tooltip.show)
            .on('customMouseMove', tooltip.update)
            .on('customMouseOut', tooltip.hide);

        testContainer.datum(dataset).call(testChart);

        tooltip
            .numberFormat('.2%')

        tooltipContainer = d3Selection.select('.test-chart .metadata-group');
        tooltipContainer.datum([]).call(tooltip);
    }
}

function createLoadingState() {
    let testChart = test(),
        testContainer = d3Selection.select('.js-loading-container'),
        containerWidth = testContainer.node() ? testContainer.node().getBoundingClientRect().width : false,
        dataset = null;
console.log('loading state');
    if (containerWidth) {
        console.log('loading state' +containerWidth);
        testContainer.html(testChart.loadingState());
    }
}

// Show charts if container available
if (d3Selection.select('.js-test-chart-tooltip-container').node()){
    createTestChartWithTooltip();
    createHorizontalTestChart();
    createSimpleTestChart();
    createLoadingState();

    let redrawCharts = function(){
        d3Selection.selectAll('.test-chart').remove();
        createTestChartWithTooltip();
        createHorizontalTestChart();
        createSimpleTestChart();
        createLoadingState();
    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);
}

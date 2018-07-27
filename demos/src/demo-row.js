'use strict';

const d3Selection = require('d3-selection');
const PubSub = require('pubsub-js');

const row = require('./../../src/charts/row');
const miniTooltip = require('./../../src/charts/mini-tooltip');
const colors = require('./../../src/charts/helpers/color');
const dataBuilder = require('./../../test/fixtures/rowChartDataBuilder');

const aRowDataSet = () => new dataBuilder.RowDataBuilder();

require('./helpers/resizeHelper');

function createSimpleRowChart() {
    let rowChart = row(),
        tooltip = miniTooltip(),
        rowContainer = d3Selection.select('.js-row-chart-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        dataset = aRowDataSet().withColors().build();
        const dataTarget = dataset.slice(1,2);

        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 70,
                right: 50,
                top: 20,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSuffix('complaints')
            .colorSchema(['#20aa3f'])
            .width(containerWidth)
            .yAxisPaddingBetweenChart(5)
            .orderingFunction(function(a,b){
                return a.value > b.value;
            })
            .height(250)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(1.5)
            .on('customMouseOver', tooltip.show)
            .on('customMouseMove', tooltip.update)
            .on('customMouseOut', tooltip.hide);

        rowContainer.datum(dataTarget).call(rowChart);

        tooltipContainer = d3Selection.select('.js-row-chart-container .row-chart .metadata-group');
        tooltipContainer.datum([]).call(tooltip);
    }
}

function createHorizontalRowChart() {
    let rowChart = row(),
        tooltip = miniTooltip(),
        rowContainer = d3Selection.select('.js-horizontal-row-chart-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        dataset = aRowDataSet().withColors().build();

        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 70,
                right: 50,
                top: 20,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSuffix('complaints')
            .colorSchema(['#20aa3f'])
            .width(containerWidth)
            .yAxisPaddingBetweenChart(5)
            .orderingFunction(function(a,b){
                return a.value > b.value;
            })
            .height(250)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(1.5)
            .on('customMouseOver', tooltip.show)
            .on('customMouseMove', tooltip.update)
            .on('customMouseOut', tooltip.hide);

        rowContainer.datum(dataset).call(rowChart);

        tooltipContainer = d3Selection.select('.js-horizontal-row-chart-container .row-chart .metadata-group');
        tooltipContainer.datum([]).call(tooltip);
    }
}

function createRowChartWithTooltip() {
    let rowChart = row(),
        tooltip = miniTooltip(),
        rowContainer = d3Selection.select('.js-row-chart-tooltip-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        d3Selection.select('.js-download-button').on('click', function() {
            rowChart.exportChart('rowchart.png', 'Britecharts Row Chart');
        });

        dataset = aRowDataSet().withColors().build();
        const dataTarget = dataset.slice(0,4);

        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 70,
                right: 50,
                top: 20,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSuffix('complaints')
            .colorSchema(['#20aa3f'])
            .width(containerWidth)
            .yAxisPaddingBetweenChart(5)
            .orderingFunction(function(a,b){
                return a.value > b.value;
            })
            .height(250)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(1.5)
            .on('customMouseOver', tooltip.show)
            .on('customMouseMove', tooltip.update)
            .on('customMouseOut', tooltip.hide);

        rowContainer.datum(dataTarget).call(rowChart);
        tooltip
            .numberFormat('.2%')


        tooltipContainer = d3Selection.select('.row-chart .metadata-group');
        tooltipContainer.datum([]).call(tooltip);
    }
}

function createLoadingState() {
    let rowChart = row(),
        rowContainer = d3Selection.select('.js-loading-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        dataset = null;

    if (containerWidth) {
        console.log('loading state' + containerWidth);
        rowContainer.html(rowChart.loadingState());
    }
}

// Show charts if container available
if (d3Selection.select('.js-row-chart-tooltip-container').node()){
    createRowChartWithTooltip();
    createHorizontalRowChart();
    createSimpleRowChart();
    createLoadingState();

    let redrawCharts = function(){
        d3Selection.selectAll('.row-chart').remove();
        createRowChartWithTooltip();
        createHorizontalRowChart();
        createSimpleRowChart();
        createLoadingState();
    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);
}

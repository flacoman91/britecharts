'use strict';
const d3Array = require('d3-array');
const d3Selection = require('d3-selection');
const PubSub = require('pubsub-js');

const colors = require('./../../src/charts/helpers/color');
const groupedRowChart = require('./../../src/charts/grouped-row');
const tooltip = require('./../../src/charts/tooltip');
const groupedDataBuilder = require('./../../test/fixtures/groupedRowChartDataBuilder');
const colorSelectorHelper = require('./helpers/colorSelector');
let redrawCharts;

require('./helpers/resizeHelper');
const getParentValue = ({parentVal}) => parentVal,
    getValue = ({value}) => value;

function creategroupedRowChartWithTooltip(optionalColorSchema) {
    let groupedRow = groupedRowChart(),
        chartTooltip = tooltip(),
        testDataSet = new groupedDataBuilder.GroupedRowChartDataBuilder(),
        container = d3Selection.select('.js-grouped-row-chart-tooltip-container'),
        containerWidth = container.node() ? container.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        dataset = testDataSet.with3Sources().build();

        // GroupedAreChart Setup and start
        groupedRow
            .tooltipThreshold(600)
            .margin({
                left: 100
            })
            .width(containerWidth)
            .grid('horizontal')
            .isAnimated(true)
            .groupLabel('stack')
            .nameLabel('date')
            .valueLabel('views')
            .on('customMouseOver', function() {
                chartTooltip.show();
            })
            .on('customMouseMove', function(dataPoint, topicColorMap, x,y) {
                chartTooltip.update(dataPoint, topicColorMap, x, y);
            })
            .on('customMouseOut', function() {
                chartTooltip.hide();
            });

        if (optionalColorSchema) {
            groupedRow.colorSchema(optionalColorSchema);
        }

        container.datum(dataset.data).call(groupedRow);

        // Tooltip Setup and start
        chartTooltip
            .topicLabel('values')
            .dateLabel('key')
            .nameLabel('stack')
            .title('Testing tooltip');

        // Note that if the viewport width is less than the tooltipThreshold value,
        // this container won't exist, and the tooltip won't show up
        tooltipContainer = d3Selection.select('.js-grouped-row-chart-tooltip-container .metadata-group');
        tooltipContainer.datum([]).call(chartTooltip);

        d3Selection.select('#button').on('click', function() {
            groupedRow.exportChart('grouped-row.png', 'Britecharts Grouped Row');
        });
    }
}

function createHorizontalgroupedRowChart(containerId, width) {
    let groupedRow = groupedRowChart(),
        container = d3Selection.select(containerId),
        containerWidth = width ? width : container.node().getBoundingClientRect().width;
    let dataBuilder = new groupedDataBuilder.GroupedRowChartDataBuilder(),
        dataset;


    if (containerWidth) {
        dataset = dataBuilder.withCFPBSources().build();
        const data = dataset.data;
        // StackedAreChart Setup and start
        const isStacked = true;
        const ratio = isStacked ? 100 / d3Array.max( data, getParentValue ) :
            100/d3Array.max(data, getValue);
        const isDesktop = containerWidth > 600;
        const margin = {
            left: isDesktop ? 250 : containerWidth / 2.5,
            top: 40,
            right: isDesktop ? 30 : 0,
            bottom: 20
        };

        groupedRow
            .tooltipThreshold(600)
            .grid('vertical')
            .height(3*10*30)
            .width(containerWidth)
            .percentageAxisToMaxRatio(ratio)
            .isHorizontal(true)
            .isStacked(isStacked)
            .isAnimated(true)
            .margin(margin)
            .xTicks(10);

        groupedRow.colorSchema(['red', 'yellow', 'blue']);

        container.datum(data).call(groupedRow);
    }
}

function createHorizontalExportGroupedRowChart(optionalColorSchema) {
    let groupedRow = groupedRowChart(),
        container = d3Selection.select('.js-grouped-row-chart-export-container'),
        containerWidth = container.node() ? container.node().getBoundingClientRect().width : false;
    let dataBuilder = new groupedDataBuilder.GroupedRowChartDataBuilder(),
        dataset;

    if (containerWidth) {
        dataset = dataBuilder.withCFPBSources().build();
        const data = dataset.data;
        // StackedAreChart Setup and start
        const isStacked = true;
        const ratio = isStacked ? 100 / d3Array.max( data, getParentValue ) :
            100/d3Array.max(data, getValue);
        groupedRow
            .tooltipThreshold(600)
            .grid('vertical')
            .height(3*10*30)
            .width(1175)
            .percentageAxisToMaxRatio(ratio)
            .isHorizontal(true)
            .isStacked(isStacked)
            .isAnimated(true)
            .isPrintMode(true)
            .margin({
                left: 250,
                top: 40,
                right: 60,
                bottom: 20
            })
            .xTicks(10);

        groupedRow.colorSchema(['red', 'yellow', 'blue']);

        // unstripe them
        data.forEach( o => {
            o.striped = false;
        });

        container.datum(data).call(groupedRow);
    }
}

if (d3Selection.select('.js-grouped-row-chart-tooltip-container').node()){
    // Chart creation
    creategroupedRowChartWithTooltip();
    createHorizontalgroupedRowChart('.js-grouped-row-chart-600-container', 600);
    createHorizontalgroupedRowChart('.js-grouped-row-chart-320-container', 320);
    createHorizontalgroupedRowChart('.js-grouped-row-chart-fixed-container');
    createHorizontalExportGroupedRowChart();

    // For getting a responsive behavior on our chart,
    // we'll need to listen to the window resize event
    redrawCharts = () => {
        d3Selection.selectAll('.grouped-row').remove();
        creategroupedRowChartWithTooltip();
        createHorizontalgroupedRowChart('.js-grouped-row-chart-600-container', 600);
        createHorizontalgroupedRowChart('.js-grouped-row-chart-320-container', 320);
        createHorizontalgroupedRowChart('.js-grouped-row-chart-fixed-container');
        createHorizontalExportGroupedRowChart();

    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);

    // Color schema selector
    colorSelectorHelper.createColorSelector('.js-color-selector-container', '.grouped-row', creategroupedRowChartWithTooltip);
}

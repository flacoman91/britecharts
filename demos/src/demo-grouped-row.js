'use strict';

const d3Selection = require('d3-selection');
const PubSub = require('pubsub-js');

const colors = require('./../../src/charts/helpers/color');
const groupedRowChart = require('./../../src/charts/grouped-row');
const tooltip = require('./../../src/charts/tooltip');
const groupedDataBuilder = require('./../../test/fixtures/groupedBarChartDataBuilder');
const colorSelectorHelper = require('./helpers/colorSelector');
let redrawCharts;

require('./helpers/resizeHelper');

function createHorizontalgroupedRowChart(optionalColorSchema) {
    let groupedRow = groupedRowChart(),
        chartTooltip = tooltip(),
        testDataSet = new groupedDataBuilder.GroupedBarChartDataBuilder(),
        container = d3Selection.select('.js-grouped-row-chart-fixed-container'),
        containerWidth = container.node() ? container.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        dataset = testDataSet.with3Sources().build();

        // StackedAreChart Setup and start
        groupedRow
            .tooltipThreshold(600)
            .grid('vertical')
            .width(containerWidth)
            .isHorizontal(true)
            .isAnimated(true)
            .aspectRatio(100)
            .margin({
                left: 80,
                top: 40,
                right: 30,
                bottom: 20
            })
            .percentageAxisToMaxRatio(2)
            .nameLabel('name')
            .valueLabel('value')
            .groupLabel('stack')
            .on('customMouseOver', function() {
                chartTooltip.show();
            })
            .on('customMouseMove', function(dataPoint, topicColorMap, x, y) {
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
            .title('Tooltip Title');

        // Note that if the viewport width is less than the tooltipThreshold value,
        // this container won't exist, and the tooltip won't show up
        tooltipContainer = d3Selection.select('.js-grouped-row-chart-fixed-container .metadata-group');
        tooltipContainer.datum([]).call(chartTooltip);
    }
}

if (d3Selection.select('.js-grouped-row-chart-tooltip-container').node()){
    // Chart creation

    createHorizontalgroupedRowChart();

    // For getting a responsive behavior on our chart,
    // we'll need to listen to the window resize event
    redrawCharts = () => {
        d3Selection.selectAll('.grouped-row').remove();
        createHorizontalgroupedRowChart();
    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);

    // Color schema selector
    colorSelectorHelper.createColorSelector('.js-color-selector-container', '.grouped-row', creategroupedRowChartWithTooltip);
}

'use strict';

const d3Selection = require('d3-selection');
const PubSub = require('pubsub-js');

const colors = require('./../../src/charts/helpers/color');
const groupedRowChart = require('./../../src/charts/grouped-row');
const tooltip = require('./../../src/charts/tooltip');
const groupedDataBuilder = require('./../../test/fixtures/groupedRowChartDataBuilder');
const colorSelectorHelper = require('./helpers/colorSelector');
let redrawCharts;

require('./helpers/resizeHelper');

const data = [
    {
        name: 'Credit card or prepaid card',
        value: 200,
        group: 'Sum of comparable companies'
    },
    {
        name: 'Credit card or prepaid card',
        value: 700,
        group: 'Average of comparable companies'
    },
    {
        name: 'Credit card or prepaid card',
        value: 800,
        group: 'EQUIFAX, INC.'
    },
    {
        name: 'Vehicle loan or lease',
        value: 700,
        group: 'Sum of comparable companies'
    },
    {
        name: 'Vehicle loan or lease',
        value: 300,
        group: 'Average of comparable companies'
    },
    {
        name: 'Vehicle loan or lease',
        value: 300,
        group: 'EQUIFAX, INC.'
    },
    {
        name: 'Debt collection',
        value: 226,
        group: 'Sum of comparable companies'
    },
    {
        name: 'Debt collection',
        value: 750,
        group: 'Average of comparable companies'
    },

    {
        name: 'Debt collection',
        value: 960,
        group: 'EQUIFAX, INC.'
    },
    {
        name: 'Credit reporting, credit repair services, or other personal consumer reports',
        value: 16480,
        group: 'Sum of comparable companies'
    },
    {
        name: 'Credit reporting, credit repair services, or other personal consumer reports',
        value: 5000,
        group: 'Average of comparable companies'
    },
    {
        name: 'Credit reporting, credit repair services, or other personal consumer reports',
        value: 7500,
        group: 'EQUIFAX, INC.'
    }
];

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

function createHorizontalgroupedRowChart(optionalColorSchema) {
    let groupedRow = groupedRowChart(),
        chartTooltip = tooltip(),
        testDataSet = new groupedDataBuilder.GroupedRowChartDataBuilder(),
        container = d3Selection.select('.js-grouped-row-chart-fixed-container'),
        containerWidth = container.node() ? container.node().getBoundingClientRect().width : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        dataset = testDataSet.with3Sources().build();

        // StackedAreChart Setup and start
        const ratio = 16749/16480;
        groupedRow
            .tooltipThreshold(600)
            .grid('vertical')
            .width(containerWidth)
            .percentageAxisToMaxRatio(ratio)
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 200,
                top: 40,
                right: 30,
                bottom: 20
            })
            // .nameLabel('date')
            // .valueLabel('views')
            // .groupLabel('stack')
            .on('customMouseOver', function() {
                chartTooltip.show();
            })
            .on('customMouseMove', function(dataPoint, topicColorMap, x, y) {
                chartTooltip.update(dataPoint, topicColorMap, x, y);
            })
            .on('customMouseOut', function() {
                chartTooltip.hide();
            });

        groupedRow.colorSchema(['red', 'yellow', 'blue']);
        //if (optionalColorSchema) {
            //groupedRow.colorSchema(optionalColorSchema);
        //}

        container.datum(data).call(groupedRow);

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
    creategroupedRowChartWithTooltip();
    createHorizontalgroupedRowChart();

    // For getting a responsive behavior on our chart,
    // we'll need to listen to the window resize event
    redrawCharts = () => {
        d3Selection.selectAll('.grouped-row').remove();

        creategroupedRowChartWithTooltip();
        createHorizontalgroupedRowChart();
    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);

    // Color schema selector
    colorSelectorHelper.createColorSelector('.js-color-selector-container', '.grouped-row', creategroupedRowChartWithTooltip);
}

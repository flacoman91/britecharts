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

const data = [ {
    "name": "Student loan",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 0.2958579881656805,
    "group": "Sum of comparable companies"
}, {
    "name": "Student loan",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 0.29574132492113564,
    "group": "Average of comparable companies"
}, {
    "name": "Student loan",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 0.2985074626865672,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Payday loan, title loan, or personal loan",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 0.5128205128205128,
    "group": "Sum of comparable companies"
}, {
    "name": "Payday loan, title loan, or personal loan",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 0.4100946372239748,
    "group": "Average of comparable companies"
}, {
    "name": "Payday loan, title loan, or personal loan",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 0.1492537313432836,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Vehicle loan or lease",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 1.9526627218934909,
    "group": "Sum of comparable companies"
}, {
    "name": "Vehicle loan or lease",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 1.5615141955835963,
    "group": "Average of comparable companies"
}, {
    "name": "Vehicle loan or lease",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 0.9701492537313432,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Money transfer, virtual currency, or money service",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 2.9980276134122286,
    "group": "Sum of comparable companies"
}, {
    "name": "Money transfer, virtual currency, or money service",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 2.397476340694006,
    "group": "Average of comparable companies"
}, {
    "name": "Money transfer, virtual currency, or money service",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 3.805970149253731,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Mortgage",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 10.493096646942801,
    "group": "Sum of comparable companies"
}, {
    "name": "Mortgage",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 10.488958990536277,
    "group": "Average of comparable companies"
}, {
    "name": "Mortgage",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 15.37313432835821,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Debt collection",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 11.321499013806706,
    "group": "Sum of comparable companies"
}, {
    "name": "Debt collection",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 9.053627760252365,
    "group": "Average of comparable companies"
}, {
    "name": "Debt collection",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 6.343283582089552,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Checking or savings account",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 21.794871794871796,
    "group": "Sum of comparable companies"
}, {
    "name": "Checking or savings account",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 17.42902208201893,
    "group": "Average of comparable companies"
}, {
    "name": "Checking or savings account",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 34.32835820895522,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Credit reporting, credit repair services, or other personal consumer reports",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 24.674556213017752,
    "group": "Sum of comparable companies"
}, {
    "name": "Credit reporting, credit repair services, or other personal consumer reports",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 19.73186119873817,
    "group": "Average of comparable companies"
}, {
    "name": "Credit reporting, credit repair services, or other personal consumer reports",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 13.059701492537313,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Credit card or prepaid card",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 52.38658777120315,
    "group": "Sum of comparable companies"
}, {
    "name": "Credit card or prepaid card",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 41.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Credit card or prepaid card",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 25.671641791044774,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
} ];

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
        const ratio = 100/52.38658777120315;
        groupedRow
            .tooltipThreshold(600)
            .grid('vertical')
            .height(3*10*30)
            .width(containerWidth)
            .percentageAxisToMaxRatio(ratio)
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 250,
                top: 40,
                right: 30,
                bottom: 20
            })
            .xTicks(10)
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

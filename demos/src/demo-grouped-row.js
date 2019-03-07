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

const data = [
    {
    "name": "Student loan",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 0.2958579881656805,
    "parentVal": 6.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Student loan",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 0.29574132492113564,
    "parentVal": 16.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Student loan",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 0.2985074626865672,
    "parentVal": 6.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Payday loan, title loan, or personal loan",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 0.5128205128205128,
    "parentVal": 16.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Payday loan, title loan, or personal loan",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 0.4100946372239748,
    "parentVal": 9.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Payday loan, title loan, or personal loan",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 0.1492537313432836,
    "parentVal": 6.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Vehicle loan or lease",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 1.9526627218934909,
    "parentVal": 9.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Vehicle loan or lease",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 1.5615141955835963,
    "parentVal": 9.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Vehicle loan or lease",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 0.9701492537313432,
    "parentVal": 5.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Money transfer, virtual currency, or money service",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 2.9980276134122286,
    "parentVal": 6.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Money transfer, virtual currency, or money service",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 2.397476340694006,
    "parentVal": 6.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Money transfer, virtual currency, or money service",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 3.805970149253731,
    "parentVal": 16.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Mortgage",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 10.493096646942801,
    "parentVal": 76.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Mortgage",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 10.488958990536277,
    "parentVal": 46.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Mortgage",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 15.37313432835821,
    "parentVal": 46.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Debt collection",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 11.321499013806706,
    "parentVal": 46.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Debt collection",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 9.053627760252365,
    "parentVal": 15.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Debt collection",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 6.343283582089552,
    "parentVal": 26.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Checking or savings account",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 21.794871794871796,
    "parentVal": 46.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Checking or savings account",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 17.42902208201893,
    "parentVal": 46.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Checking or savings account",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 34.32835820895522,
    "parentVal": 46.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Credit reporting, credit repair services, or other personal consumer reports",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 24.674556213017752,
    "parentVal": 46.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Credit reporting, credit repair services, or other personal consumer reports",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 19.73186119873817,
    "parentVal": 40.89274447949527,
    "group": "Average of comparable companies"
}, {
    "name": "Credit reporting, credit repair services, or other personal consumer reports",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 13.059701492537313,
    "parentVal": 46.89274447949527,
    "group": "BANK OF AMERICA, NATIONAL ASSOCIATION"
}, {
    "name": "Credit card or prepaid card",
    "show": true,
    "striped": false,
    "readOnly": true,
    "value": 52.38658777120315,
    "parentVal": 70.89274447949527,
    "group": "Sum of comparable companies"
}, {
    "name": "Credit card or prepaid card",
    "show": true,
    "striped": true,
    "readOnly": true,
    "value": 98.46,
    "parentVal": 98.75,
    "group": "Average of comparable companies"
}, {
    "name": "Credit card or prepaid card",
    "readOnly": true,
    "show": true,
    "striped": false,
    "value": 100,
    "parentVal": 100,
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
        container = d3Selection.select('.js-grouped-row-chart-fixed-container'),
        containerWidth = container.node() ? container.node().getBoundingClientRect().width : false;

    if (containerWidth) {

        // StackedAreChart Setup and start
        const isStacked = true;
        const ratio = isStacked ? 100 / d3Array.max( data, getParentValue ) :
            100/d3Array.max(data, getValue);
        groupedRow
            .tooltipThreshold(600)
            .grid('vertical')
            .height(3*10*30)
            .width(containerWidth)
            .percentageAxisToMaxRatio(ratio)
            .isHorizontal(true)
            .isStacked(isStacked)
            .isAnimated(true)
            .margin({
                left: 250,
                top: 40,
                right: 30,
                bottom: 20
            })
            .xTicks(10);

        groupedRow.colorSchema(['red', 'yellow', 'blue']);

        container.datum(data).call(groupedRow);
    }
}

function createHorizontalExportGroupedRowChart(optionalColorSchema) {
    let groupedRow = groupedRowChart(),
        container = d3Selection.select('.js-grouped-row-chart-export-container'),
        containerWidth = container.node() ? container.node().getBoundingClientRect().width : false;

    if (containerWidth) {

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
    createHorizontalgroupedRowChart();
    createHorizontalExportGroupedRowChart();

    // For getting a responsive behavior on our chart,
    // we'll need to listen to the window resize event
    redrawCharts = () => {
        d3Selection.selectAll('.grouped-row').remove();
        creategroupedRowChartWithTooltip();
        createHorizontalgroupedRowChart();
        createHorizontalExportGroupedRowChart();

    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);

    // Color schema selector
    colorSelectorHelper.createColorSelector('.js-color-selector-container', '.grouped-row', creategroupedRowChartWithTooltip);
}

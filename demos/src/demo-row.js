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
        const colorScheme = dataTarget.map((o)=>{
            return o.parent ? '#addc91' : '#20aa3f';
        });
        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 140,
                right: 50,
                top: 20,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .width(containerWidth)
            .height(dataTarget.length * 100)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(1)
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
        containerHeight = rowContainer.node() ? rowContainer.node().getBoundingClientRect().height : false,
        tooltipContainer,
        dataset;

    if (containerWidth) {
        d3Selection.select('.js-download-button-123').on('click', function() {
            const oldHeight = containerHeight;
            console.log(containerHeight);
            const oH = rowContainer.select('svg').attr('height');
            console.log(oH);

            const detailContainer = rowContainer.select('svg')
                .append('g')
                .attr('transform', 'translate(0, 280)')
                .classed('export-details', true);

            detailContainer.append('text')
                .text('URL:');

            const url = 'http://192.168.33.110/#/complaints/q?size=10&page=99&sort=Created%20Date&fields=All%20Data';

            let y=20;
            detailContainer.append('text')
                .text(url)
                .attr('x', 0)
                .attr('y', y);

            y+=40;

            detailContainer.append('text')
                .text('Filters:')
                .attr('x', 0)
                .attr('y', y);

            y+=20;


            const tags = ['lorem', 'ipsum', 'foo bar', 'blah blah'];

            const out = tags.join('; ');
            detailContainer.append('text')
                .text(out)
                .attr('x', 0)
                .attr('y', y);

            rowContainer.select('svg').attr('height', +oH + y);

            // tags.forEach(function(o){
            //     detailContainer.append('text')
            //         .text(o)
            //         .attr('x', 0)
            //         .attr('y', y);
            //     y+=20;
            // });


            //rowChart.exportChart('horiz-rowchart.png', 'Britecharts Row
            // Chart');
            //rowContainer.select('svg').attr('height', oH);

            // rowContainer.select('.export-details').remove();

        });

        dataset = aRowDataSet().withColors().build();

        const colorScheme = dataset.map((o)=>{
            return o.parent ? '#20aa3f' : '#eeeeee';
        });

        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 200,
                right: 50,
                top: 20,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .width(containerWidth)
            .height(dataset.length * 37)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(1)
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
        const colorScheme = dataTarget.map((o)=>{
            return o.parent ? '#20aa3f' : '#eeeeee';
        });
        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 140,
                right: 50,
                top: 20,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .width(containerWidth)
            .height(dataTarget.length * 37)
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
    // createLoadingState();

    let redrawCharts = function(){
        d3Selection.selectAll('.row-chart').remove();
        createRowChartWithTooltip();
        createHorizontalRowChart();
        createSimpleRowChart();
        // createLoadingState();
    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);
}

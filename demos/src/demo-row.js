'use strict';

const d3Selection = require('d3-selection');
const PubSub = require('pubsub-js');

const row = require('./../../src/charts/row');
const miniTooltip = require('./../../src/charts/mini-tooltip');
const colors = require('./../../src/charts/helpers/color');
const dataBuilder = require('./../../test/fixtures/rowChartDataBuilder');

const aRowDataSet = () => new dataBuilder.RowDataBuilder();
const textHelper = require('./../../src/charts/helpers/text');

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
            const oH = rowContainer.select('svg').attr('height');
            const padding = 10;
            const detailContainer = rowContainer.select('svg')
                .append('g')
                .classed('export-details', true)
                .attr('transform', 'translate('+ padding + ', ' + oH + ')');

            const detailWidth = containerWidth - padding;

            // filters
            let y = 20;

            detailContainer.append('text')

                .text('Filters:')
                .attr('class', 'text-title')
                .attr('x', 0);

            const tags = [
                'EQUIFAX, INC.',
                'Experian Information Solutions',
                'CAPITAL ONE FINANCIAL CORPORATION',
                'Incorrect information on your report',
                'Problem with a credit reporting company\'s investigation' +
                ' into an existing problem',
                'not CAPITAL ONE FINANCIAL CORPORATION'
            ];

            const out = tags.join('; ');
            detailContainer.append('text')
                .text(out)
                .classed('tags', true)
                .attr('x', 0)
                .attr('y', y)
                .call(wrap, detailWidth);

            const tagheight = detailContainer
                .select('.tags').node().getBoundingClientRect().height;

            y+= tagheight + 20;

            // adding export date
            // adding URL details
            detailContainer.append('text')
                .classed('export-date', true)
                .text('Export Date: ' +  new Date().toLocaleDateString())
                .attr('dy', '1.2em');
                // .attr('y', y);

            y+= 30;

            // adding URL details
            detailContainer.append('text')
                .text('URL:')
                .attr('y', y);

            let url = 'http://192.168.33.110/#/complaints/q/trends?size=10&page=99&sort=Created%20Date&company=EQUIFAX,%20INC.&company=Experian%20Information%20Solutions%20Inc.&issue=Incorrect%20information%20on%20your%20report&issue=Problem%20with%20a%20credit%20reporting%20company\'s%20investigation%20into%20an%20existing%20problem&not_company=CAPITAL%20ONE%20FINANCIAL%20CORPORATION&interval=Month&fields=All%20Data';

            let pieces = [];
            while( textHelper.getTextWidth( url, 16, 'sans-serif') > detailWidth) {
                for ( var i = 0; i < url.length; i++ ) {
                    const w = textHelper.getTextWidth( url.substr( 0, i ), 16, 'sans-serif' );
                    if ( w+ 20 > detailWidth ) {
                        pieces.push( url.slice( 0, i ) );
                        url = url.slice(i);
                        break;
                    }
                }
            }

            pieces.push(url);

            const longURL = pieces.join(' ');
            detailContainer.append('text')
                .text(longURL)
                .classed('url', true)
                .attr('x', 0)
                .attr('dy', '1.2em')
                // .attr('y', y)
                .call(wrap, detailWidth );

            // end url

            const urlHeight = detailContainer
                .select('.url').node().getBoundingClientRect().height;

            y+= urlHeight + 30;
            rowContainer.select('svg').attr('height', +oH + y + tagheight);

            //const rcOheight = rowChart.height();
            rowChart.height(+oH + y + tagheight);
            rowChart.exportChart('horiz-rowchart.png', 'Britecharts Row Chart');

            rowContainer.select('svg').attr('height', rcOheight);
            // rowContainer.select('.export-details').remove();
            //rowChart.height(rcOheight);
        });

        dataset = aRowDataSet().withColors().build();

        console.log(dataset);

        const colorScheme = dataset.map((o)=>{
            if(o) {
                return '#20aa3f';
            }
        });

        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 200,
                right: 50,
                top: 50,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(16)
            .labelsSizeChild(12)
            .labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .width(containerWidth)
            .height(dataset.length * 50)
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

function createExportRowChart() {
    let rowChart = row(),
        rowContainer = d3Selection.select('.js-row-chart-export-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        containerHeight = rowContainer.node() ? rowContainer.node().getBoundingClientRect().height : false,
        dataset;

    if (containerWidth) {
        d3Selection.select('.js-download-button-export').on('click', function() {
            const oH = rowContainer.select('svg').attr('height');
            const padding = 10;
            const detailContainer = rowContainer.select('svg')
                .append('g')
                .classed('export-details', true)
                .attr('transform', 'translate('+ padding + ', ' + oH + ')');

            const detailWidth = containerWidth - padding;

            // filters
            let y = 20;

            detailContainer.append('text')
                .text('Filters:')
                .attr('x', 0);

            const tags = [
                'EQUIFAX, INC.',
                'Experian Information Solutions',
                'CAPITAL ONE FINANCIAL CORPORATION',
                'Incorrect information on your report',
                'Problem with a credit reporting company\'s investigation' +
                ' into an existing problem',
                'not CAPITAL ONE FINANCIAL CORPORATION'
            ];

            const out = tags.join('; ');
            detailContainer.append('text')
                .text(out)
                .classed('tags', true)
                .attr('x', 0)
                .attr('y', y)
                .call(wrap, detailWidth);

            const tagheight = detailContainer
                .select('.tags').node().getBoundingClientRect().height;

            y+= tagheight + 20;

            // adding export date
            // adding URL details
            detailContainer.append('text')
                .classed('export-date', true)
                .text('Export Date: ' +  new Date().toLocaleDateString())
                .attr('y', y);

            y+= 30;

            // adding URL details
            detailContainer.append('text')
                .text('URL:')
                .attr('y', y);

            let url = 'http://192.168.33.110/#/complaints/q/trends?size=10&page=99&sort=Created%20Date&company=EQUIFAX,%20INC.&company=Experian%20Information%20Solutions%20Inc.&issue=Incorrect%20information%20on%20your%20report&issue=Problem%20with%20a%20credit%20reporting%20company\'s%20investigation%20into%20an%20existing%20problem&not_company=CAPITAL%20ONE%20FINANCIAL%20CORPORATION&interval=Month&fields=All%20Data';

            let pieces = [];
            while( textHelper.getTextWidth( url, 16, 'sans-serif') > detailWidth) {
                for ( var i = 0; i < url.length; i++ ) {
                    const w = textHelper.getTextWidth( url.substr( 0, i ), 16, 'sans-serif' );
                    if ( w+ 20 > detailWidth ) {
                        pieces.push( url.slice( 0, i ) );
                        url = url.slice(i);
                        break;
                    }
                }
            }

            pieces.push(url);

            const longURL = pieces.join(' ');
            detailContainer.append('text')
                .text(longURL)
                .classed('url', true)
                .attr('x', 0)
                .attr('y', y)
                .call(wrap, detailWidth );

            // end url

            const urlHeight = detailContainer
                .select('.url').node().getBoundingClientRect().height;

            y+= urlHeight + 30;
            rowContainer.select('svg').attr('height', +oH + y + tagheight);

            //const rcOheight = rowChart.height();
            rowChart.height(+oH + y + tagheight);
            rowChart.exportChart('horiz-rowchart.png', 'Britecharts Row Chart');

            rowContainer.select('svg').attr('height', rcOheight);
            // rowContainer.select('.export-details').remove();
            //rowChart.height(rcOheight);
        });

        dataset = aRowDataSet().withLongNames().build();

        const colorScheme = [
            'orange', 'orange', 'orange',
            'purple',
            'green', 'green', 'green',
            'teal',
            'brown'
        ];

        rowChart
            .isHorizontal(true)
            .isAnimated(true)
            .margin({
                left: 400,
                right: 97,
                top: 20,
                bottom: 30
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(18)
            .labelsSizeChild(14)
            .labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .isPrintMode(true)
            .width(containerWidth)
            .height(dataset.length * 60)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(1)
            .pctChangeLabelSize(18)
            .yAxisLineWrapLimit(2)
            .yAxisPaddingBetweenChart(5);

        rowContainer.datum(dataset).call(rowChart);
    }
}

function wrap(text, width){

    text.each(function() {
        var text = d3Selection.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(1),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
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

// Show charts if container available
if (d3Selection.select('.js-row-chart-tooltip-container').node()){
    createRowChartWithTooltip();
    createHorizontalRowChart();
    createSimpleRowChart();
    createExportRowChart();

    let redrawCharts = function(){
        d3Selection.selectAll('.row-chart').remove();
       createRowChartWithTooltip();
       createHorizontalRowChart();
       createSimpleRowChart();
        createExportRowChart();
    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);
}

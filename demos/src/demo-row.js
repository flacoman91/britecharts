'use strict';
const d3Array = require('d3-array');
const d3Scale = require('d3-scale');
const d3Selection = require('d3-selection');
const PubSub = require('pubsub-js');

const row = require('./../../src/charts/row');
const miniTooltip = require('./../../src/charts/mini-tooltip');
const colors = require('./../../src/charts/helpers/color');
const dataBuilder = require('./../../test/fixtures/rowChartDataBuilder');

const aRowDataSet = () => new dataBuilder.RowDataBuilder();
const textHelper = require('./../../src/charts/helpers/text');

require('./helpers/resizeHelper');

function createFocusExportRowChart() {
    let rowChart = row(),
        rowContainer = d3Selection.select('.js-row-chart-focus-export-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        containerHeight = rowContainer.node() ? rowContainer.node().getBoundingClientRect().height : false,
        dataset;

    if (containerWidth) {
        d3Selection.select('.js-download-button-focus-export').on('click', function() {
            const scope = {
                chartName: 'deez',
                chartWidth: containerWidth - 50,
                dateRange: { to: '9/23/1980', from: '9/23/2012' },
                filters: [
                    'EQUIFAX, INC.',
                    'Experian Information Solutions',
                    'CAPITAL ONE FINANCIAL CORPORATION',
                    'Incorrect information on your report',
                    'Problem with a credit reporting company\'s investigation' +
                    ' into an existing problem',
                    'not CAPITAL ONE FINANCIAL CORPORATION'
                ]
            };
            appendExportDetails(rowChart, rowContainer, scope);
        });

        dataset = aRowDataSet().withFocusLens().build();

        const colorScheme = [
            'orange', 'orange', 'orange',
            'purple',
            'green', 'green', 'green',
            'teal',
            'brown'
        ];

        const height = calculateHeight(dataset);

        rowChart
            .isAnimated(true)
            .margin({
                left: 400,
                right: 175,
                top: 20,
                bottom: 20
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(18)
            .labelsSizeChild(14)
            .labelsTotalCount( 7759 )
            .labelsTotalText('Some Focus Item Lorem Ipsum not CAPITAL ONE FINANCIAL CORPORATION')
            .labelsInterval('month')
            .downArrowColor( '#257675' )
            .outerPadding(.1)
            .colorSchema(colorScheme)
            .isPrintMode(true)
            .width( 1175 )
            .height(height * 2)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataset))
            .pctChangeLabelSize(18)
            .yAxisLineWrapLimit(2)
            .yAxisPaddingBetweenChart(5);

        rowContainer.datum(dataset).call(rowChart);
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
            const scope = {
                chartName: 'deez',
                chartWidth: containerWidth - 50,
                dateRange: { to: '9/23/1980', from: '9/23/2012' },
                filters: [
                    'EQUIFAX, INC.',
                    'Experian Information Solutions',
                    'CAPITAL ONE FINANCIAL CORPORATION',
                    'Incorrect information on your report',
                    'Problem with a credit reporting company\'s investigation' +
                    ' into an existing problem',
                    'not CAPITAL ONE FINANCIAL CORPORATION'
                ]
            };
            appendExportDetails(rowChart, rowContainer, scope);
        });

        dataset = aRowDataSet().withLongNames().build();

        const colorScheme = [
            'orange', 'orange', 'orange',
            'purple',
            'green', 'green', 'green',
            'teal',
            'brown'
        ];

        const height = calculateHeight(dataset);

        rowChart
            .isAnimated(true)
            .margin({
                left: 400,
                right: 175,
                top: 20,
                bottom: 20
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(18)
            .labelsSizeChild(14)
            //.labelsSuffix('complaints')
            .downArrowColor( '#257675' )
            .outerPadding(.1)
            .colorSchema(colorScheme)
            .isPrintMode(true)
            .width( 1175 )
            .height(height * 2)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataset))
            .pctChangeLabelSize(18)
            .yAxisLineWrapLimit(2)
            .yAxisPaddingBetweenChart(5);

        rowContainer.datum(dataset).call(rowChart);
    }
}

function createRowChartDataLens(containerId, width) {
    let rowChart = row(),
        rowContainer = d3Selection.select( containerId ),
        containerWidth = width ? width : rowContainer.node().getBoundingClientRect().width,
        dataset;

    if (containerWidth) {
        d3Selection.select('.js-download-focus-button').on('click', function() {
            const scope = {
                chartName: 'Focus Chart',
                chartWidth: containerWidth - 50,
                dateRange: { to: '9/23/1980', from: '9/23/2012' },
                filters: [
                    'EQUIFAX, INC.',
                    'Experian Information Solutions',
                    'CAPITAL ONE FINANCIAL CORPORATION',
                    'Incorrect information on your report',
                    'Problem with a credit reporting company\'s investigation' +
                    ' into an existing problem',
                    'not CAPITAL ONE FINANCIAL CORPORATION'
                ]
            };
            appendExportDetails(rowChart, rowContainer, scope);
        });

        dataset = aRowDataSet().withDataLens().build();
        const dataTarget = dataset;
        const colorScheme = dataTarget.map((o)=>{
            return '#20aa3f';
        });

        // let out total count be 10000
        const isDesktop = containerWidth > 600;
        let height = calculateHeight(dataTarget);
        height = isDesktop ? height : height * 1.5;
        const margin = {
            left: isDesktop ? 250 : width / 2.5,
            right: isDesktop ? 100 : 20,
            top: 15,
            bottom: 10
        };

        rowChart
            .isAnimated(true)
            .margin(margin)
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsTotalCount('75,000')
            .labelsFocusTitle('Some Focus Item Lorem approximate of the text width by using a canvas element')
            .labelsInterval('month')
            .labelsNumberFormat(',d')
            .downArrowColor( '#257675' )
            //.labelsSuffix('complaints')
            .outerPadding(.2)
            .colorSchema(colorScheme)
            .width(containerWidth)
            .height(height)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(75000/800);


        rowContainer.datum(dataTarget).call(rowChart);
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
            return '#20aa3f';
        });

        const height = calculateHeight(dataTarget);
        rowChart
            .isAnimated(true)
            .margin({
                left:140,
                right: 50,
                top: 10,
                bottom: 10
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .downArrowColor( '#257675' )
            //.labelsSuffix('complaints')
            .outerPadding(.2)
            .colorSchema(colorScheme)
            .width(containerWidth)
            .height(height)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataset))
            .on('customMouseOver', tooltip.show)
            .on('customMouseMove', tooltip.update)
            .on('customMouseOut', tooltip.hide);

        rowContainer.datum(dataTarget).call(rowChart);
        tooltip
            .numberFormat('.2%');


        tooltipContainer = d3Selection.select('.row-chart .metadata-group');
        tooltipContainer.datum([]).call(tooltip);
    }
}

function createHorizontalRowChart(containerId, width) {
    let rowChart = row(),
        rowContainer = d3Selection.select(containerId),
        containerWidth = width ? width : rowContainer.node().getBoundingClientRect().width,
        containerHeight = rowContainer.node() ? rowContainer.node().getBoundingClientRect().height : false,
        dataset;

    if (containerWidth) {
        d3Selection.select('.js-download-button-123').on('click', function() {
            const scope = {
                chartName: 'deez',
                chartWidth: containerWidth - 50,
                dateRange: { to: '9/23/1980', from: '9/23/2012' },
                filters: [
                    'EQUIFAX, INC.',
                    'Experian Information Solutions',
                    'CAPITAL ONE FINANCIAL CORPORATION',
                    'Incorrect information on your report',
                    'Problem with a credit reporting company\'s investigation' +
                    ' into an existing problem',
                    'not CAPITAL ONE FINANCIAL CORPORATION'
                ]
            };
            appendExportDetails(rowChart, rowContainer, scope);
        });

        dataset = aRowDataSet().withColors().build();

        const colorScheme = dataset.map((o)=>{ return '#20aa3f'; });
        const isDesktop = containerWidth > 600;
        let height = calculateHeight(dataset);
        let axisWrapLimit = 1;
        if(!isDesktop) {
            height = height * 1.5;
            axisWrapLimit = 2;
        }
        const margin = {
            left: isDesktop ? 200 : containerWidth / 2.5,
            right: isDesktop? 50 : 20,
            top: 14,
            bottom: 5
        };

        rowChart
            .isAnimated(true)
            .margin(margin)
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(16)
            .labelsSizeChild(12)
            .downArrowColor( '#257675' )
            //.labelsSuffix('complaints')
            .labelsTotalCount(7000)
            .colorSchema(colorScheme)
            .outerPadding(.1)
            .width(containerWidth)
            .height(height)
            .xTicks( 0 )
            .yTicks( 0 )
            .yAxisLineWrapLimit(axisWrapLimit)
            .percentageAxisToMaxRatio(1);

        rowContainer.datum(dataset).call(rowChart);

    }
}

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
            .isAnimated(true)
            .margin({
                left: 140,
                right: 50,
                top: 10,
                bottom: 5
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            //.labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .width(containerWidth)
            .outerPadding(0)
            .height(60)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataTarget))
            .on('customMouseOver', tooltip.show)
            .on('customMouseMove', tooltip.update)
            .on('customMouseOut', tooltip.hide);

        rowContainer.datum(dataTarget).call(rowChart);

        tooltipContainer = d3Selection.select('.js-row-chart-container .row-chart .metadata-group');
        tooltipContainer.datum([]).call(tooltip);
    }
}

function createRow4ExpandedChart() {
    let rowChart = row(),
        rowContainer = d3Selection.select('.js-four-row-chart-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        containerHeight = rowContainer.node() ? rowContainer.node().getBoundingClientRect().height : false,
        dataset;

    if (containerWidth) {
        dataset = aRowDataSet().with4Bars().build();

        const colorScheme = dataset.map((o)=>{ return '#20aa3f'; });
        const height = calculateHeight(dataset);
        rowChart
            .isAnimated(true)
            .margin({
                left: 200,
                right: 50,
                top: 10,
                bottom: 5
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(16)
            .labelsSizeChild(12)
            .downArrowColor( '#257675' )
            //.labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .outerPadding(.1)
            .width(containerWidth)
            .height(height)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataset));

        rowContainer.datum(dataset).call(rowChart);

    }
}

function createLastExpandedChart() {
    let rowChart = row(),
        rowContainer = d3Selection.select('.js-last-row-chart-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        containerHeight = rowContainer.node() ? rowContainer.node().getBoundingClientRect().height : false,
        dataset;

    if (containerWidth) {
        dataset = aRowDataSet().with5Bars().build();

        const colorScheme = dataset.map((o)=>{ return '#20aa3f'; });
        const height = calculateHeight(dataset);
        rowChart
            .isAnimated(true)
            .margin({
                left: 200,
                right: 50,
                top: 10,
                bottom: 5
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(16)
            .labelsSizeChild(12)
            .downArrowColor( '#257675' )
            //.labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .outerPadding(.1)
            .width(containerWidth)
            .height(height)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataset));

        rowContainer.datum(dataset).call(rowChart);

    }
}

function createCollapsedChart() {
    let rowChart = row(),
        rowContainer = d3Selection.select('.js-row-collapsed-chart-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        dataset;

    if (containerWidth) {
        dataset = aRowDataSet().with5CollapsedBars().build();

        const colorScheme = dataset.map((o)=>{ return '#20aa3f'; });
        const height = calculateHeight(dataset);
        rowChart
            .isAnimated(true)
            .margin({
                left: 200,
                right: 50,
                top: 10,
                bottom: 5
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(16)
            .labelsSizeChild(12)
            .downArrowColor( '#257675' )
            //.labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .outerPadding(.1)
            .width(containerWidth)
            .height(height)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataset));

        rowContainer.datum(dataset).call(rowChart);
    }
}

function createMassiveChart() {
    let rowChart = row(),
        rowContainer = d3Selection.select('.js-row-massive-chart-container'),
        containerWidth = rowContainer.node() ? rowContainer.node().getBoundingClientRect().width : false,
        dataset;

    if (containerWidth) {
        dataset = aRowDataSet().withMassiveSet().build();

        const colorScheme = dataset.map((o)=>{ return '#20aa3f'; });
        const height = calculateHeight(dataset);
        rowChart
            .isAnimated(true)
            .margin({
                left: 200,
                right: 50,
                top: 10,
                bottom: 5
            })
            .backgroundColor('#f7f8f9')
            .enableYAxisRight(true)
            .enableLabels(true)
            .labelsNumberFormat(',d')
            .labelsSize(16)
            .labelsSizeChild(12)
            .downArrowColor( '#257675' )
            //.labelsSuffix('complaints')
            .colorSchema(colorScheme)
            .outerPadding(.1)
            .width(containerWidth)
            .height(height)
            .xTicks( 0 )
            .yTicks( 0 )
            .percentageAxisToMaxRatio(calculateMaxRatio(dataset));

        rowContainer.datum(dataset).call(rowChart);
    }
}

function appendExportDetails(chart, container, scope) {
    const chartName = scope.chartName,
        dateRange = scope.dateRange,
        elems = [],
        filters = scope.filters,
        detailWidth =  scope.chartWidth || 1100,
        padBottom = 100,
        padding = 10,
        paddingTop = 30,
        detailContainer = container.select( 'svg' )
            .append( 'g' )
            .classed( 'export-details', true )
            .attr( 'transform', `translate(${ padding }, ${ paddingTop })` );
    const contentWidth = detailWidth - 50;

    // needs to be added first
    // on the bottom adding height of the details.
    detailContainer.append( 'rect' )
        .classed( 'detail-wrapper', true )
        .attr('fill','grey')
        .attr( 'width', detailWidth );

    const topPad = isIE() ? 0 : paddingTop;
    const dr = appendDateRange( detailContainer, dateRange, contentWidth, topPad );
    elems.push( dr );

    const d = appendExportDate( detailContainer, contentWidth, sumHeight( elems ) );
    elems.push( d );

    const u = appendURL( detailContainer, contentWidth, sumHeight( elems ) );
    elems.push( u );

    const f = appendFilterDetails( detailContainer, filters, contentWidth, sumHeight( elems ) );
    elems.push( f );

    let newHeight = sumHeight( elems );
    const detWrapper = detailContainer.select( 'rect.detail-wrapper' )
        .attr( 'height', newHeight );

    appendChartTitle( container, scope, getHeight( detWrapper ) );

    // shift main chart down below details container
    const detailHeight = getHeight( detWrapper ) + padBottom,
        chartHeight = getHeight( container.select( '.container-group' ) ),
        oldTransform = container.select( '.container-group' )
            .attr( 'transform' );

    newHeight = detailHeight + chartHeight + padBottom;
    container.select( '.container-group' )
        .attr( 'transform', `${ oldTransform } translate(0, ${ detailHeight })` );
    // update the height for export
    container.select( 'rect.export-wrapper' ).attr( 'height', newHeight );
    container.select( 'svg' ).attr( 'height', newHeight );
    chart.height( newHeight );
    chart.exportChart( `${ chartName }.png` );

    // clean up remnants
    // comment this out for debugging to see the chart in the dom
    // container.select( 'svg' ).remove();

}

function calculateMaxRatio(data){
    return 100 / d3Array.max( data, o => o.pctOfSet )
}

function calculateHeight(data){

    let height = 37;
    const parentHeight = data.filter( o => o.isParent ).length * 37;
    const childrenHeight = data.filter( o => !o.isParent ).length * 35;

    const expandedParents = [ ... new Set(data
        .filter(o=>{ return !o.isParent })
        .map(o=>{ return o.parent; })
    ) ];

    const powScale = d3Scale.scaleLinear()
        .domain( [ 0, 10 ] )
        .range( [ 0, data.length * 50 ] );

    const expandedHeight = powScale( expandedParents.length );

    switch ( data.length ) {
        case 1:
            height = 90;
            break;
        case 2:
            height = 96;
            break;
        default:
            height = parentHeight + childrenHeight + expandedHeight;
    }

    return height;
}



/**
 * helper function to add title to chart
 * @param {object} container d3 object selection
 * @param {object} scope contains info about the chart
 * @param {Number} detailContainerHeight contains info about the chart
 */
export const appendChartTitle = ( container, scope, detailContainerHeight ) => {
    const yPos = detailContainerHeight + 70;
    const marginLeft = 30;
    const totalContainer = container.select( 'svg' )
        .append( 'g' )
        .classed( 'chart-title', true )
        .attr( 'transform', `translate(${ marginLeft }, ${ yPos })` );

    // adding total and interval to the PNG.
    const titleNode = totalContainer.append( 'text' )
        .classed( 'title', true );

    titleNode.append( 'tspan' )
        .text( scope.chartName )
        .attr( 'font-size', '36px' );
};

/**
 * adds date info to export details at the bottom of the chart
 * @param {object} detailContainer container that wraps the date, filter info
 * @param {number} detailWidth how wide to fit container in
 * @param {number} padTop amount of padding above this element
 * @returns {object} new appended element
 */
export const appendExportDate = ( detailContainer, detailWidth, padTop ) => {
    const text = formatDateView( new Date() );
    return appendTextElement( detailContainer, 'Export Date:', text, detailWidth, padTop );
};

/**
 * adds date info to export details at the bottom of the chart
 * @param {object} detailContainer container that wraps the date, filter info
 * @param {object} dateRange contains the TO/From
 * @param {number} detailWidth how wide to fit container in
 * @param {number} padTop amount of padding above this element
 * @returns {object} new appended element
 */
export const appendDateRange = ( detailContainer, dateRange, detailWidth, padTop ) => {
    const text = formatDateView( dateRange.from ) + ' - ' + formatDateView( dateRange.to );
    return appendTextElement( detailContainer, 'Date Range:', text, detailWidth, padTop );
};

/**
 * appends URL to the chart
 * @param {object} detailContainer d3 selection
 * @param {number} detailWidth width of the container we are appending to
 * @param {number} padTop offset of chart we want to append to
 * @returns {object} appended text element
 */
export const appendURL = ( detailContainer, detailWidth, padTop ) => {
    const inputUrl = 'http://192.168.99.100/#/complaints/q/trends?size=10&page=1&sort=Relevance&not_issue=Incorrect%20information%20on%20your%20report&not_product=Credit%20reporting,%20credit%20repair%20services,%20or%20other%20personal%20consumer%20reports&not_product=Debt%20collection&not_product=Credit%20card%20or%20prepaid%20card&interval=Month&lens=Overview&trend_depth=10&fields=All%20Data';
    const longURL = splitLongString( inputUrl, detailWidth, 18 );
    return appendTextElement( detailContainer, 'URL:', longURL, detailWidth, padTop );
};

function formatDateView(dateIn){
    return dateIn.toLocaleString();
}

/**
 * generic function to add text element to a chart
 * @param {object} container d3 selection object
 * @param {string} title the Heading of a text element URL: Filters: etc
 * @param {string} text the text under the heading
 * @param {number} width how wide the box is in which we need to insert text
 * @param {number} padTop offset of the top of the text.
 * @returns {object} returns inserted element
 */
export const appendTextElement = ( container, title, text, width, padTop = 30 ) => {
    const padLeft = 20;

    if ( isIE() ) {
        padTop += 20;
    }

    const textContainer = container.append( 'g' )
        .classed( 'text-group', true )
        .attr( 'transform', `translate(0, ${ padTop })` );

    textContainer.append( 'text' )
        .classed( 'title-text', true )
        .text( title )
        .attr( 'font-weight', 'bold' )
        .attr( 'font-size', '12px' )
        .attr( 'x', padLeft );

    textContainer.append( 'text' )
        .classed( 'sub-text', true )
        .text( text )
        .attr( 'font-size', '16px' )
        .attr( 'y', 0 )
        .attr( 'dy', '1.2em' )
        .call( wrap, width );

    return textContainer;
};

/**
 * helper function to get heights of containers in an array
 * @param {array} elemList holds a bunch of containers
 * @returns {number} height of the elements
 */
const sumHeight = elemList => {
    let height = 0;
    const padding = 30;
    elemList.forEach( o => {
        height += o ? getHeight( o ) + padding : 0;
    } );
    return height;
};


/**
 * helper function to get height of a d3 selection
 * @param {object} container d3selection
 * @returns {number} height of selection
 */
function getHeight( container ) {
    return container.node().getBoundingClientRect().height;
}



/**
 *
 * @param {string} input long string to process
 * @param {number} width size of bounding box
 * @param {number} fontSize size of font we measure
 * @returns {string} the long string split with spaces
 */
export const splitLongString = ( input, width, fontSize ) => {
    const pieces = [],
        padding = 20 * 2;

    while ( exports.getTextWidth( input, fontSize, 'sans-serif' ) > width ) {
        for ( let i = 0; i < input.length; i++ ) {
            const w = exports.getTextWidth( input.slice( 0, i ), fontSize,
                'sans-serif' );
            if ( w + padding > width ) {
                pieces.push( input.slice( 0, i ) );
                input = input.slice( i );
                break;
            }
        }
    }

    pieces.push( input );
    return pieces.join( ' ' );
};



/**
 * Figures out an approximate of the text width by using a canvas element
 * This avoids having to actually render the text to measure it from the DOM
 * @param  {String} text     Text to measure
 * @param  {Number} fontSize Fontsize (or default)
 * @param  {String} fontFace Font familty (or default)
 * @returns {String}          Approximate font size of the text
 */
export const getTextWidth = ( text, fontSize, fontFace ) => {
    const a = document.createElement( 'canvas' ),
        b = a.getContext( '2d' );

    b.font = fontSize + 'px ' + fontFace;

    return b.measureText( text ).width;
}

/**
 * helper to wrap text
 * @param  {object} d3Selection d3 selection node we are working with
 * @param  {Number} width width of the box
 */
function wrap( d3Obj, width ){
    d3Obj.each( function() {
        const textNode = d3Selection.select( this ),
            words = textNode.text().split( /\s+/ ).reverse();
        appendTextSpan( words, textNode, width );
    } );
};


/**
 * Helper function so it's testable
 * @param {Array} words string we want to append
 * @param {Object}textNode the d3 node we are working with
 * @param {number} width container size
 */
function appendTextSpan( words, textNode, width ){
    const dy = parseFloat( textNode.attr( 'dy' ) ) || 0;

    let word,
        line = [],
        tspan = textNode.text( null )
            .append( 'tspan' )
            .attr( 'x', 20 )
            .attr( 'dy', dy + 'em' );

    while ( typeof ( word = words.pop() ) !== 'undefined' ) {
        line.push( word );
        tspan.text( line.join( ' ' ) );
        if ( tspan.node().getComputedTextLength() > width ) {
            line.pop();
            tspan.text( line.join( ' ' ) );
            line = [ word ];
            tspan = textNode.append( 'tspan' )
                .attr( 'x', 20 )
                .attr( 'dy', dy + 'em' )
                .text( word );
        }
    }
};

/**
 * add filter details to chart
 * @param {object} detailContainer the grouping containing info
 * @param {object} filters filters in state passed from scope
 * @param {number} width box size
 * @param {number} padTop amount of padding above this element
 * @returns {object} element grouping with Filters: filter names, etc
 */
export const appendFilterDetails = ( detailContainer, filters, width, padTop ) => {
    const allFilters = processFilters( filters );
    let filterText = false;
    if ( allFilters.length ) {
        // append Filters first
        filterText = allFilters.join( '; ' );
    }

    if ( !filterText ) {
        return null;
    }

    return exports.appendTextElement( detailContainer, 'Filters:', filterText, width, padTop );
};

function processFilters(filters){
    return filters;
}


function isIE(){
    const ua = window.navigator.userAgent;
    return ua.indexOf( 'Edge' ) > -1 || ua.indexOf( 'MSIE' ) > -1;
}

// Show charts if container available
if (d3Selection.select('.js-row-chart-tooltip-container').node()){
    // createFocusExportRowChart();
    // createExportRowChart();
    // createRowChartWithTooltip();

    // createRowChartDataLens('.js-mobile-lg-row-chart-lens-container', 600);
    // createRowChartDataLens('.js-mobile-sm-row-chart-lens-container', 320);
    // createRowChartDataLens('.js-row-chart-lens-container');

    createHorizontalRowChart('.js-horizontal-row-chart-container');
    createHorizontalRowChart('.js-mobile-lg-row-chart-container', 600);
    createHorizontalRowChart('.js-mobile-sm-row-chart-container', 320);
    // createSimpleRowChart();
    // createRow4ExpandedChart();
    // createLastExpandedChart();
    // createCollapsedChart();
    // createMassiveChart();

    let redrawCharts = function() {
        d3Selection.selectAll( '.row-chart' ).remove();
        // createFocusExportRowChart();
        // createExportRowChart();
        // createRowChartWithTooltip();

        // createRowChartDataLens('.js-mobile-lg-row-chart-lens-container', 600);
        // createRowChartDataLens('.js-mobile-sm-row-chart-lens-container', 320);
        // createRowChartDataLens('.js-row-chart-lens-container');

        createHorizontalRowChart('.js-horizontal-row-chart-container');
        createHorizontalRowChart('.js-mobile-lg-row-chart-container', 600);
        createHorizontalRowChart('.js-mobile-sm-row-chart-container', 320);

        // createSimpleRowChart();
        // createRow4ExpandedChart();
        // createLastExpandedChart();
        // createCollapsedChart();
        // createMassiveChart();
    };

    // Redraw charts on window resize
    PubSub.subscribe('resize', redrawCharts);
}

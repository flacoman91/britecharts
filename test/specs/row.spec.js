define(['d3', 'row', 'rowChartDataBuilder'], function(d3, chart, dataBuilder) {
    'use strict';

    const aTestDataSet = () => new dataBuilder.RowDataBuilder();
    const buildDataSet = (dataSetName) => {
        return aTestDataSet()
            [dataSetName]()
            .build();
    };


    describe('Row Chart', () => {
        let rowChart, dataset, containerFixture, f;

        beforeEach(() => {
            dataset = buildDataSet('withLettersFrequency');
            rowChart = chart();

            // DOM Fixture Setup
            f = jasmine.getFixtures();
            f.fixturesPath = 'base/test/fixtures/';
            f.load('testContainer.html');

            containerFixture = d3.select('.test-container');
            containerFixture.datum(dataset).call(rowChart);
        });

        afterEach(() => {
            containerFixture.remove();
            f = jasmine.getFixtures();
            f.cleanUp();
            f.clearCache();
        });

        it('should render a chart with minimal requirements', () => {
            expect(containerFixture.select('.row-chart').empty()).toBeFalsy();
        });

        it('should render container, axis and chart groups', () => {
            expect(containerFixture.select('g.container-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.chart-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.x-axis-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.y-axis-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.grid-lines-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.metadata-group').empty()).toBeFalsy();
        });

        it('should render an X and Y axis', () => {
            expect(containerFixture.select('.x-axis-group.axis').empty()).toBeFalsy();
            expect(containerFixture.select('.y-axis-group.axis').empty()).toBeFalsy();
        });

        it('should render a row for each data entry', () => {
            let numRows = dataset.length;

            expect(containerFixture.selectAll('.row').size()).toEqual(numRows);
        });

        describe('when reloading with a different dataset', () => {

            it('should render in the same svg', function() {
                let actual;
                let expected = 1;
                let newDataset = buildDataSet('withColors');

                containerFixture.datum(newDataset).call(rowChart);

                actual = containerFixture.selectAll('.row-chart').nodes().length;

                expect(actual).toEqual(expected);
            });

            // This test fails because of the transition on the exit
            xit('should render six rows', function() {
                let actual;
                let expected = 6;
                let newDataset = buildDataSet('withColors');

                containerFixture.datum(newDataset).call(rowChart);

                actual = containerFixture.selectAll('.row-chart .row').nodes().length;

                expect(actual).toEqual(expected);
            });
        });

        describe('when orderingFunction is called', () => {

            it('accepts custom descending order function', () => {
                let fn = (a, b) => b.value - a.value;
                let actual,
                    expected = {
                        name: 'E',
                        value: 0.12702
                    };

                rowChart.orderingFunction(fn);
                containerFixture.call(rowChart)
                actual = containerFixture.selectAll('.row-chart .row').nodes()[0].__data__;

                expect(actual.name).toBe(expected.name);
                expect(actual.value).toBe(expected.value);
            });

            it('accepts a custom ascending sorting function', () => {
                let fn = (a, b) => a.value - b.value;
                let actual,
                    expected = {
                        name: 'Z',
                        value: 0.00074
                    };

                rowChart.orderingFunction(fn);
                containerFixture.call(rowChart)
                actual = containerFixture.selectAll('.row-chart .row').nodes()[0].__data__;

                expect(actual.name).toBe(expected.name);
                expect(actual.value).toBe(expected.value);
            });
        });

        describe('when hasSingleRowHighlight is called', () => {

            it('should darken the original color of the hovered row', () => {
                let expectedHasRowHighlight = true;
                let expectedColor = '#20aa3f';
                let expectedHoverColor = 'rgb(22, 119, 44)';

                let actualHasHover = rowChart.hasSingleRowHighlight();
                let row = containerFixture.selectAll('.row:nth-child(1)');

                let actualColor = row.attr('fill');

                row.dispatch('mouseover');
                let actualHoverColor = row.attr('fill');

                expect(actualHasHover).toBe(expectedHasRowHighlight);
                expect(actualColor).toBe(expectedColor);
                expect(actualHoverColor).toBe(expectedHoverColor);
            });

            it('should keep the same hover color of the hovered row', () => {
                let expectedHasRowHighlight = false;
                let expectedColor = '#20aa3f';

                rowChart.hasSingleRowHighlight(false);
                let actualHasHover = rowChart.hasSingleRowHighlight();
                let row = containerFixture.selectAll('.row:nth-child(1)');
                let actualColor = row.attr('fill');

                row.dispatch('mouseover');
                let hoverColor = row.attr('fill');

                expect(actualHasHover).toBe(expectedHasRowHighlight);
                expect(actualColor).toBe(expectedColor);
                expect(actualColor).toBe(hoverColor);
            });
        });

        describe('when highlightRowFunction is called', () => {

            it('should change behavior of the hovered row', () => {
                let expectedHighlightColor = '#ffffff';
                let customHighlightFunction = rowSelection => rowSelection.attr('fill', expectedHighlightColor);

                rowChart.highlightRowFunction(customHighlightFunction);
                let row = containerFixture.selectAll('.row:nth-child(1)');

                let beforeHighlightColor = row.attr('fill');

                row.dispatch('mouseover');
                let actualHighlightColor = row.attr('fill');

                expect(actualHighlightColor).toBe(expectedHighlightColor);
                expect(beforeHighlightColor).not.toBe(expectedHighlightColor);
            });

            it('should change the behavior of non-hovered rows when hasSingleRowHighlight is False', () => {
                let expectedHighlightColor = '#ffffff';
                let customHighlightFunction = rowSelection => rowSelection.attr('fill', expectedHighlightColor);

                rowChart.hasSingleRowHighlight(false);
                rowChart.highlightRowFunction(customHighlightFunction);
                let rowNotHighlighted = containerFixture.selectAll('.row:nth-child(1)');
                let rowHighlighted = containerFixture.selectAll('.row:nth-child(2)');

                let beforeHighlightColor = rowNotHighlighted.attr('fill');

                rowNotHighlighted.dispatch('mouseover');
                let actualNotHighlightColor = rowNotHighlighted.attr('fill');
                let actualHighlightColor = rowHighlighted.attr('fill');

                expect(actualHighlightColor).toBe(expectedHighlightColor);
                expect(actualNotHighlightColor).toBe(beforeHighlightColor);
            });
        });

        describe('API', function() {

            it('should provide backgroundColor getter and setter', () => {
                let previous = rowChart.backgroundColor(),
                    expected = [ '#20aa3f' ],
                    actual;

                rowChart.backgroundColor(expected);
                actual = rowChart.colorSchema();

                expect(previous).not.toBe(actual);
                expect(actual[0]).toBe(expected[0]);
            });

            it('should provide upArrowColor getter and setter', () => {
                let previous = rowChart.upArrowColor(),
                    expected = '#20aa3f',
                    actual;

                rowChart.upArrowColor(expected);
                actual = rowChart.upArrowColor();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide downArrowColor getter and setter', () => {
                let previous = rowChart.downArrowColor(),
                    expected = '#20aa3f',
                    actual;

                rowChart.downArrowColor(expected);
                actual = rowChart.downArrowColor();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide backgroundWidth getter and setter', () => {
                let previous = rowChart.backgroundWidth(),
                    expected = 99,
                    actual;

                rowChart.backgroundWidth(expected);
                actual = rowChart.backgroundWidth();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide colorSchema getter and setter', () => {
                let previous = rowChart.colorSchema(),
                    expected = ['#FFFFFF'],
                    actual;

                rowChart.colorSchema(expected);
                actual = rowChart.colorSchema();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should set chartGradient getter and setter', () => {
                let previous = rowChart.chartGradient(),
                    expected = ['#fff', '#ddd'],
                    actual;

                rowChart.colorSchema(expected);
                actual = rowChart.colorSchema();

                expect(previous).toBe(null);
                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should update color', () => {
                let previous = rowChart.colorSchema(),
                    expected = '#FFFFFF',
                    actual;

                rowChart.colorSchema([expected]);

                const rowColor = containerFixture.select('rect.row');

                containerFixture.call(rowChart);
                actual = rowColor.attr('fill');

                expect(actual).toBe(expected);
            });

            it('should provide enable labels getter and setter', () => {
                let previous = rowChart.enableLabels(),
                    expected = true,
                    actual;

                rowChart.enableLabels(expected);
                actual = rowChart.enableLabels();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide enable Y axis right getter and setter', () => {
                let previous = rowChart.enableYAxisRight(),
                    expected = true,
                    actual;

                rowChart.enableYAxisRight(expected);
                actual = rowChart.enableYAxisRight();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should have exportChart defined', () => {
                expect(rowChart.exportChart).toBeDefined();
            });

            it('should provide height getter and setter', () => {
                let previous = rowChart.height(),
                    expected = {top: 4, right: 4, bottom: 4, left: 4},
                    actual;

                rowChart.height(expected);
                actual = rowChart.height();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide horizontal direction getter and setter', () => {
                let previous = rowChart.isHorizontal(),
                    expected = true,
                    actual;

                rowChart.isHorizontal(expected);
                actual = rowChart.isHorizontal();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide isAnimated getter and setter', () => {
                let previous = rowChart.isAnimated(),
                    expected = true,
                    actual;

                rowChart.isAnimated(expected);
                actual = rowChart.isAnimated();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide labelsMargin getter and setter', () => {
                let previous = rowChart.labelsMargin(),
                    expected = 10,
                    actual;

                rowChart.labelsMargin(expected);
                actual = rowChart.labelsMargin();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide labelsNumberFormat getter and setter', () =>{
                let previous = rowChart.labelsNumberFormat(),
                    expected = 'd',
                    actual;

                rowChart.labelsNumberFormat(expected);
                actual = rowChart.labelsNumberFormat();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide labelsSize getter and setter', () => {
                let previous = rowChart.labelsSize(),
                    expected = 10,
                    actual;

                rowChart.labelsSize(expected);
                actual = rowChart.labelsSize();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide margin getter and setter', () => {
                let previous = rowChart.margin(),
                    expected = {top: 4, right: 4, bottom: 4, left: 4},
                    actual;

                rowChart.margin(expected);
                actual = rowChart.margin();

                expect(previous).not.toBe(actual);
                expect(actual).toEqual(expected);
            });

            it('should provide loadingState getter and setter', () => {
                let previous = rowChart.loadingState(),
                    expected = 'test',
                    actual;

                rowChart.loadingState(expected);
                actual = rowChart.loadingState();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide padding getter and setter', () => {
                let previous = rowChart.betweenRowsPadding(),
                    expected = 0.5,
                    actual;

                rowChart.betweenRowsPadding(expected);
                actual = rowChart.betweenRowsPadding();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide nameLabel getter and setter', () => {
                let previous = rowChart.nameLabel(),
                    expected = 'key',
                    actual;

                rowChart.nameLabel(expected);
                actual = rowChart.nameLabel();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide a percentageAxisToMaxRatio getter and setter', () => {
                let previous = rowChart.percentageAxisToMaxRatio(),
                    expected = 1.5,
                    actual;

                rowChart.percentageAxisToMaxRatio(expected);
                actual = rowChart.percentageAxisToMaxRatio();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide a shouldReverseColorList getter and setter', () => {
                let previous = rowChart.shouldReverseColorList(),
                    expected = false,
                    actual;

                rowChart.shouldReverseColorList(expected);
                actual = rowChart.shouldReverseColorList();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide an hasPercentage getter and setter', () => {
                let previous = rowChart.hasPercentage(),
                    expected = true,
                    actual;

                rowChart.hasPercentage(expected);
                actual = rowChart.hasPercentage();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide valueLabel getter and setter', () => {
                let previous = rowChart.valueLabel(),
                    expected = 'quantity',
                    actual;

                rowChart.valueLabel(expected);
                actual = rowChart.valueLabel();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide width getter and setter', () => {
                let previous = rowChart.width(),
                    expected = {top: 4, right: 4, bottom: 4, left: 4},
                    actual;

                rowChart.width(expected);
                actual = rowChart.width();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide xTicks getter and setter', () => {
                let previous = rowChart.xTicks(),
                    expected = 4,
                    actual;

                rowChart.xTicks(expected);
                actual = rowChart.xTicks();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide yTicks getter and setter', () => {
                let previous = rowChart.yTicks(),
                    expected = 20,
                    actual;

                rowChart.yTicks(expected);
                actual = rowChart.yTicks();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide yAxisPaddingBetweenChart getter and setter', () => {
                let previous = rowChart.yAxisPaddingBetweenChart(),
                    expected = 15,
                    actual;

                rowChart.yAxisPaddingBetweenChart(expected);
                actual = rowChart.yAxisPaddingBetweenChart();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide numberFormat getter and setter', () =>{
                let previous = rowChart.numberFormat(),
                    expected = 'd',
                    actual;

                rowChart.numberFormat(expected);
                actual = rowChart.numberFormat();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide hasSingleRowHighlight getter and setter', () =>{
                let previous = rowChart.hasSingleRowHighlight(),
                    expected = false,
                    actual;

                rowChart.hasSingleRowHighlight(expected);
                actual = rowChart.hasSingleRowHighlight();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });
        });

        describe('when custom gradient color schem is applied', () => {

            it('should build the gradient with given colors', () => {
                let expectedGradientColors = ['#ddd', 'ccc'];
                let expectedGradientRefStr = 'url(#row-gradient';

                rowChart.chartGradient(expectedGradientColors);
                containerFixture.datum(dataset).call(rowChart);
                let row = containerFixture.selectAll('.row:nth-child(1)');
                let gradientStopEl = containerFixture.selectAll('stop').nodes();

                expect(row.attr('fill')).toContain(expectedGradientRefStr);
                expect(gradientStopEl[0]).toHaveAttr('stop-color', expectedGradientColors[0]);
                expect(gradientStopEl[1]).toHaveAttr('stop-color', expectedGradientColors[1]);
            });
        });

        describe('when margins are set partially', function() {

            it('should override the default values', () => {
                let previous = rowChart.margin(),
                    expected = {
                        ...previous,
                        top: 10,
                        right: 20
                    },
                    actual;

                rowChart.width(expected);
                actual = rowChart.width();

                expect(previous).not.toBe(actual);
                expect(actual).toEqual(expected);
            })
        });

        describe('when clicking on a row', function() {

            it('should trigger a callback on mouse click', () => {
                let row = containerFixture.selectAll('.row:nth-child(1)');
                let callbackSpy = jasmine.createSpy('callback');

                rowChart.on('customClick', callbackSpy);
                row.dispatch('click');

                expect(callbackSpy.calls.count()).toBe(1);
                expect(callbackSpy.calls.allArgs()[0].length).toBe(3);
            });
        });

        describe('when hovering a row', function() {

            it('should trigger a callback on mouse over', () => {
                let row = containerFixture.selectAll('.row:nth-child(1)');
                let callbackSpy = jasmine.createSpy('callback');

                rowChart.on('customMouseOver', callbackSpy);
                row.dispatch('mouseover');

                expect(callbackSpy.calls.count()).toBe(1);
                expect(callbackSpy.calls.allArgs()[0].length).toBe(3);
            });

            it('should trigger a callback on mouse move', () => {
                let row = containerFixture.selectAll('.row:nth-child(1)');
                let callbackSpy = jasmine.createSpy('callback');

                rowChart.on('customMouseMove', callbackSpy);
                row.dispatch('mousemove');

                expect(callbackSpy.calls.count()).toBe(1);
                expect(callbackSpy.calls.allArgs()[0].length).toBe(3);
            });

            it('should trigger a callback on mouse out', () => {
                let row = containerFixture.selectAll('.row:nth-child(1)');
                let callbackSpy = jasmine.createSpy('callback');

                rowChart.on('customMouseOut', callbackSpy);
                row.dispatch('mouseout');

                expect(callbackSpy.calls.count()).toBe(1);
                expect(callbackSpy.calls.allArgs()[0].length).toBe(3);
            });
        });
    });
});

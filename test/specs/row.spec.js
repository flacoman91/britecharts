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
            dataset = buildDataSet('withFocusLens');
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

        describe('Render', () => {

            it('should show a chart with minimal requirements', () => {
                const expected = 1;
                const actual = containerFixture.select('.row-chart').size();

                expect(actual).toEqual(expected);
            });

            describe('groups', () => {
                it('should create a container-group', () => {
                    const expected = 1;
                    const actual = containerFixture.select('g.container-group').
                        size();

                    expect(actual).toEqual(expected);
                });

                it('should create a chart-group', () => {
                    const expected = 1;
                    const actual = containerFixture.select('g.chart-group').
                        size();

                    expect(actual).toEqual(expected);
                });

                it('should create a x-axis-group', () => {
                    const expected = 1;
                    const actual = containerFixture.select('g.x-axis-group').
                        size();

                    expect(actual).toEqual(expected);
                });

                it('should create a y-axis-group', () => {
                    const expected = 1;
                    const actual = containerFixture.select('g.y-axis-group').
                        size();

                    expect(actual).toEqual(expected);
                });

                it('should create a metadata-group', () => {
                    const expected = 1;
                    const actual = containerFixture.select('g.metadata-group').
                        size();

                    expect(actual).toEqual(expected);
                });
            });

            describe('axis', () => {
                it('should draw an X axis', () => {
                    const expected = 1;
                    const actual = containerFixture.select(
                        '.x-axis-group.axis').size();

                    expect(actual).toEqual(expected);
                });

                it('should draw an Y axis', () => {
                    const expected = 1;
                    const actual = containerFixture.select(
                        '.y-axis-group.axis').size();

                    expect(actual).toEqual(expected);
                });
            });

            it('should draw a row for each data entry', () => {
                const expected = dataset.length;
                const actual = containerFixture.selectAll('.row-wrapper').size();

                expect(actual).toEqual(expected);
            });

            describe('when reloading with a different dataset', () => {

                it('should render in the same svg', () => {
                    const expected = 1;
                    const newDataset = buildDataSet('withColors');
                    let actual;

                    containerFixture.datum(newDataset).call(rowChart);
                    actual = containerFixture.selectAll('.row-chart').size();

                    expect(actual).toEqual(expected);
                });

                // This test fails because of the transition on the exit
                it('should render five rows', () => {
                    const expected = 5;
                    const newDataset = buildDataSet('withColors');
                    let actual;

                    containerFixture.datum(newDataset).call(rowChart);
                    actual = containerFixture.selectAll('.row-chart .pct').
                        size();

                    expect(actual).toEqual(expected);
                });
            });
        });

        describe('Lifecycle', () => {
            describe('when highlightRowFunction is called', () => {

                it('should change behavior of the hovered row', () => {
                    const expectedHighlightColor = '#ffffff';
                    const customHighlightFunction = rowSelection => rowSelection.attr(
                        'fill', expectedHighlightColor);

                    rowChart.highlightRowFunction(customHighlightFunction);
                    const row = containerFixture.selectAll('.bg-hover:nth-child(1)');

                    const beforeHighlightColor = row.attr('fill');

                    row.dispatch('mouseover');
                    const actualHighlightColor = row.attr('fill');

                    expect(actualHighlightColor).toBe(expectedHighlightColor);
                    expect(beforeHighlightColor).
                        not.
                        toBe(expectedHighlightColor);
                });

                it('should change the behavior of non-hovered rows when hasSingleRowHighlight is False',
                    () => {
                        const expectedHighlightColor = '#ffffff';
                        const customHighlightFunction = rowSelection => rowSelection.attr(
                            'fill', expectedHighlightColor);

                        rowChart.hasSingleRowHighlight(false);
                        rowChart.highlightRowFunction(customHighlightFunction);
                        const rowNotHighlighted = containerFixture.selectAll(
                            '.row:nth-child(1)');
                        const rowHighlighted = containerFixture.selectAll(
                            '.row:nth-child(2)');

                        const beforeHighlightColor = rowNotHighlighted.attr(
                            'fill');

                        rowNotHighlighted.dispatch('mouseover');
                        const actualNotHighlightColor = rowNotHighlighted.attr(
                            'fill');
                        const actualHighlightColor = rowHighlighted.attr(
                            'fill');

                        expect(actualHighlightColor).
                            toBe(expectedHighlightColor);
                        expect(actualNotHighlightColor).
                            toBe(beforeHighlightColor);
                    });
            });

            describe('when clicking on a row', () => {

                it('should trigger a callback on mouse click', () => {
                    const callbackSpy = jasmine.createSpy('callback');
                    const row = containerFixture.selectAll('.bg-hover:nth-child(1)');
                    const expectedCalls = 1;
                    const expectedArgumentsNumber = 3;
                    let actualCalls;
                    let actualArgumentsNumber;

                    rowChart.on('customClick', callbackSpy);
                    row.dispatch('click');
                    actualCalls = callbackSpy.calls.count();
                    actualArgumentsNumber = callbackSpy.calls.allArgs()[0].length;

                    expect(actualCalls).toEqual(expectedCalls);
                    expect(actualArgumentsNumber).
                        toEqual(expectedArgumentsNumber);
                });
            });

            describe('when hovering a row', () => {

                it('should trigger a callback on mouse over', () => {
                    const row = containerFixture.selectAll('.row:nth-child(1)');
                    const callbackSpy = jasmine.createSpy('callback');
                    const expectedCallCount = 1;
                    const expectedArgumentsNumber = 3;
                    let actualCallCount;
                    let actualArgumentsNumber;

                    rowChart.on('customMouseOver', callbackSpy);
                    row.dispatch('mouseover');
                    actualCallCount = callbackSpy.calls.count();
                    actualArgumentsNumber = callbackSpy.calls.allArgs()[0].length;

                    expect(actualCallCount).toEqual(expectedCallCount);
                    expect(actualArgumentsNumber).
                        toEqual(expectedArgumentsNumber);
                });

                it('should trigger a callback on mouse move', () => {
                    const expectedCallCount = 1;
                    const expectedArgumentsNumber = 3;

                    let actualCallCount;
                    let actualArgumentsNumber;

                    const row = containerFixture.selectAll('.row:nth-child(1)');
                    const callbackSpy = jasmine.createSpy('callback');

                    rowChart.on('customMouseMove', callbackSpy);
                    row.dispatch('mousemove');
                    actualCallCount = callbackSpy.calls.count();
                    actualArgumentsNumber = callbackSpy.calls.allArgs()[0].length;

                    expect(actualCallCount).toEqual(expectedCallCount);
                    expect(actualArgumentsNumber).
                        toEqual(expectedArgumentsNumber);
                });

                it('should trigger a callback on mouse out', () => {
                    const expectedCallCount = 1;
                    const expectedArgumentsNumber = 3;

                    let actualCallCount;
                    let actualArgumentsNumber;

                    const row = containerFixture.selectAll('.row:nth-child(1)');
                    const callbackSpy = jasmine.createSpy('callback');

                    rowChart.on('customMouseOut', callbackSpy);
                    row.dispatch('mouseout');
                    actualCallCount = callbackSpy.calls.count();
                    actualArgumentsNumber = callbackSpy.calls.allArgs()[0].length;

                    expect(actualCallCount).toEqual(expectedCallCount);
                    expect(actualArgumentsNumber).
                        toEqual(expectedArgumentsNumber);
                });
            });
        });

        describe('API', () => {

            it('should provide colorSchema getter and setter', () => {
                let previous = rowChart.colorSchema(),
                    expected = ['#FFFFFF'],
                    actual;

                rowChart.colorSchema(expected);
                actual = rowChart.colorSchema();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should update color', () => {
                let previous = rowChart.colorSchema(),
                    expected = '#FFFFFF',
                    actual;

                rowChart.colorSchema([expected]);

                const rowColor = containerFixture.select('rect.pct');

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

            it('should provide labelsNumberFormat getter and setter', () => {
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

            describe('loadingState', () => {

                it('should provide loadingState getter and setter', () => {
                    let previous = rowChart.loadingState(),
                        expected = 'test',
                        actual;

                    rowChart.loadingState(expected);
                    actual = rowChart.loadingState();

                    expect(previous).not.toBe(actual);
                    expect(actual).toBe(expected);
                });

                describe('when getting a loadingState', () => {
                    it('should return an SVG element', () => {
                        let expected = 1,
                            actual;

                        rowChart = chart();
                        actual = rowChart.loadingState().
                            match('bar-load-state').length;

                        expect(actual).toEqual(expected);
                    });
                });
            });

            describe('margin', () => {
                it('should provide margin getter and setter', () => {
                    let previous = rowChart.margin(),
                        expected = {top: 4, right: 4, bottom: 4, left: 4},
                        actual;

                    rowChart.margin(expected);
                    actual = rowChart.margin();

                    expect(previous).not.toBe(actual);
                    expect(actual).toEqual(expected);
                });

                describe('when margins are set partially', () => {

                    it('should override the default values', () => {
                        let previous = rowChart.margin(),
                            expected = {
                                ...previous,
                                top: 10,
                                right: 20,
                            },
                            actual;

                        rowChart.width(expected);
                        actual = rowChart.width();

                        expect(previous).not.toBe(actual);
                        expect(actual).toEqual(expected);
                    });
                });
            });

            it('should provide padding getter and setter', () => {
                let previous = rowChart.padding(),
                    expected = 0.5,
                    actual;

                rowChart.padding(expected);
                actual = rowChart.padding();

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

            it('should provide a percentageAxisToMaxRatio getter and setter',
                () => {
                    let previous = rowChart.percentageAxisToMaxRatio(),
                        expected = 1.5,
                        actual;

                    rowChart.percentageAxisToMaxRatio(expected);
                    actual = rowChart.percentageAxisToMaxRatio();

                    expect(previous).not.toBe(expected);
                    expect(actual).toBe(expected);
                });

            it('should provide a shouldReverseColorList getter and setter',
                () => {
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

            it('should provide yAxisPaddingBetweenChart getter and setter',
                () => {
                    let previous = rowChart.yAxisPaddingBetweenChart(),
                        expected = 15,
                        actual;

                    rowChart.yAxisPaddingBetweenChart(expected);
                    actual = rowChart.yAxisPaddingBetweenChart();

                    expect(previous).not.toBe(actual);
                    expect(actual).toBe(expected);
                });

            it('should provide numberFormat getter and setter', () => {
                let previous = rowChart.numberFormat(),
                    expected = 'd',
                    actual;

                rowChart.numberFormat(expected);
                actual = rowChart.numberFormat();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });
        });
    });
});

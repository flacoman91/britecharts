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
            describe('when clicking on a row', () => {

                it('should trigger a callback on mouse click', () => {
                    const callbackSpy = jasmine.createSpy('callback');
                    const row = containerFixture.select('.bg:first-child');
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
                let callbackSpy, actualCallCount, actualArgumentsNumber,
                    row

                beforeEach(()=>{
                    callbackSpy = jasmine.createSpy('callback');
                })

                it('should trigger a callback on mouse over', () => {
                    row = containerFixture.select('.pct');
                    const expectedCallCount = 1;
                    const expectedArgumentsNumber = 3;

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

                    row = containerFixture.select('.pct');
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

                    row = containerFixture.select('.pct');
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
            it('should provide backgroundColor getter and setter', () => {
                let previous = rowChart.backgroundColor(),
                    expected = '#fooooo',
                    actual;

                rowChart.backgroundColor(expected);
                actual = rowChart.backgroundColor();

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

            it('should provide isPrintMode getter and setter', () => {
                let previous = rowChart.isPrintMode(),
                    expected = true,
                    actual;

                rowChart.isPrintMode(expected);
                actual = rowChart.isPrintMode();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide enableYAxisRight getter and setter', () => {
                let previous = rowChart.enableYAxisRight(),
                    expected = true,
                    actual;

                rowChart.enableYAxisRight(expected);
                actual = rowChart.enableYAxisRight();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide labelsFocusTitle getter and setter', () => {
                let previous = rowChart.labelsFocusTitle(),
                    expected = 'Some Complaint Thingy',
                    actual;

                rowChart.labelsFocusTitle(expected);
                actual = rowChart.labelsFocusTitle();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide labelsInterval getter and setter', () => {
                let previous = rowChart.labelsInterval(),
                    expected = 'month',
                    actual;

                rowChart.labelsInterval(expected);
                actual = rowChart.labelsInterval();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide labelsSuffix getter and setter', () => {
                let previous = rowChart.labelsSuffix(),
                    expected = 's',
                    actual;

                rowChart.labelsSuffix(expected);
                actual = rowChart.labelsSuffix();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide labelsTotalCount getter and setter', () => {
                let previous = rowChart.labelsTotalCount(),
                    expected = '20000',
                    actual;

                rowChart.labelsTotalCount(expected);
                actual = rowChart.labelsTotalCount();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide labelsTotalText getter and setter', () => {
                let previous = rowChart.labelsTotalText(),
                    expected = 'Total foobars',
                    actual;

                rowChart.labelsTotalText(expected);
                actual = rowChart.labelsTotalText();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide wrapLabels getter and setter', () => {
                let previous = rowChart.wrapLabels(),
                    expected = false,
                    actual;

                rowChart.wrapLabels(expected);
                actual = rowChart.wrapLabels();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide yAxisLineWrapLimit getter and setter', () => {
                let previous = rowChart.yAxisLineWrapLimit(),
                    expected = 2,
                    actual;

                rowChart.yAxisLineWrapLimit(expected);
                actual = rowChart.yAxisLineWrapLimit();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide upArrowColor getter and setter', () => {
                let previous = rowChart.upArrowColor(),
                    expected = '#FFFFFF',
                    actual;

                rowChart.upArrowColor(expected);
                actual = rowChart.upArrowColor();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide downArrowColor getter and setter', () => {
                let previous = rowChart.downArrowColor(),
                    expected = '#FFFFFF',
                    actual;

                rowChart.downArrowColor(expected);
                actual = rowChart.downArrowColor();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide paddingBetweenGroups getter and setter', () => {
                let previous = rowChart.paddingBetweenGroups(),
                    expected = 100,
                    actual;

                rowChart.paddingBetweenGroups(expected);
                actual = rowChart.paddingBetweenGroups();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide outerPadding getter and setter', () => {
                let previous = rowChart.outerPadding(),
                    expected = 0.5,
                    actual;

                rowChart.outerPadding(expected);
                actual = rowChart.outerPadding();

                expect(previous).not.toBe(actual);
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

            it('should provide labelsSizeChild getter and setter', () => {
                let previous = rowChart.labelsSizeChild(),
                    expected = 10,
                    actual;

                rowChart.labelsSizeChild(expected);
                actual = rowChart.labelsSizeChild();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide pctChangeLabel getter and setter', () => {
                let previous = rowChart.pctChangeLabel(),
                    expected = 'foobar',
                    actual;

                rowChart.pctChangeLabel(expected);
                actual = rowChart.pctChangeLabel();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });


            it('should provide pctChangeLabelSize getter and setter', () => {
                let previous = rowChart.pctChangeLabelSize(),
                    expected = 8,
                    actual;

                rowChart.pctChangeLabelSize(expected);
                actual = rowChart.pctChangeLabelSize();

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

    describe('Row Chart', () => {
        let rowChart, dataset, containerFixture, f;

        beforeEach(() => {
            dataset = buildDataSet('withSeparatorsNoDelta');
            rowChart = chart().enableLabels(true);

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

            it('should draw a focus links when splittertext', () => {
                const expected = dataset.filter(o=>{return o.splitterText;}).length;
                const actual = containerFixture.selectAll('.view-more-label').size();

                expect(actual).toEqual(expected);
            });
        })
    })

    describe('Print Mode Row Chart', () => {
        let rowChart, dataset, containerFixture, f;

        beforeEach(() => {
            dataset = buildDataSet('withFocusLens');
            rowChart = chart()
                        .isPrintMode(true)
                        .isAnimated(true)
                        .wrapLabels(false);

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
        });
    });
});

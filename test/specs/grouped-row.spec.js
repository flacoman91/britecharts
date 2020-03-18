define(['d3', 'grouped-row', 'groupedRowChartDataBuilder'], function(d3, chart, dataBuilder) {
    'use strict';

    const aTestDataSet = () => new dataBuilder.GroupedRowChartDataBuilder();
    const buildDataSet = (dataSetName) => {
        return aTestDataSet()
            [dataSetName]()
            .build();
    };

    const differentDatesReducer = (acc, d) => {
                if (acc.indexOf(d.date) === -1) {
                    acc.push(d.date);
                }

                return acc;
            };

    describe('Grouped Row Chart', () => {
        let groupedRowChart, dataset, containerFixture, f;

        beforeEach(() => {
            dataset = buildDataSet('with3Sources');
            groupedRowChart = chart()
                        .groupLabel('stack')
                        .nameLabel('date')
                        .valueLabel('views')
                        .grid('full');

            // DOM Fixture Setup
            f = jasmine.getFixtures();
            f.fixturesPath = 'base/test/fixtures/';
            f.load('testContainer.html');

            containerFixture = d3.select('.test-container');
            containerFixture.datum(dataset.data).call(groupedRowChart);
        });

        afterEach(() => {
            containerFixture.remove();
            f = jasmine.getFixtures();
            f.cleanUp();
            f.clearCache();
        });

        it('should render a chart with minimal requirements', () => {
            expect(containerFixture.select('.grouped-row').empty()).toBeFalsy();
        });

        it('should render container, axis and chart groups', () => {
            expect(containerFixture.select('g.container-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.chart-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.x-axis-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.y-axis-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.grid-lines-group').empty()).toBeFalsy();
            expect(containerFixture.select('g.metadata-group').empty()).toBeFalsy();
        });

        it('should render grid lines', () => {
            expect(containerFixture.select('.horizontal-grid-line').empty()).toBeFalsy();
            expect(containerFixture.select('.vertical-grid-line').empty()).toBeFalsy();
        });

        it('should render an X and Y axis', () => {
            expect(containerFixture.select('.x-axis-group .axis.x').empty()).toBeFalsy();
            expect(containerFixture.select('.y-axis-group.axis').empty()).toBeFalsy();
        });

        it('should render a layer for each data entry group', () => {
            let actual = containerFixture.selectAll('.layer').size();
            let expected = dataset.data.reduce(differentDatesReducer, []).length;

            expect(actual).toEqual(expected);
        });

        it('should render a row for each data entry', () => {
            let actual = containerFixture.selectAll('.row').size();
            let expected = dataset.data.length;

            expect(actual).toEqual(expected);
        });

        describe('when reloading with a two sources dataset', () => {

            it('should render in the same svg', function() {
                let actual;
                let expected = 1;
                let newDataset = buildDataSet('with2Sources');

                containerFixture.datum(newDataset.data).call(groupedRowChart);

                actual = containerFixture.selectAll('.grouped-row').nodes().length;

                expect(actual).toEqual(expected);
            });

            it('should render four layers', function() {
                let actual;
                let expected = 4;
                let newDataset = buildDataSet('with2Sources');

                containerFixture.datum(newDataset.data).call(groupedRowChart);

                actual = containerFixture.selectAll('.grouped-row .layer').nodes().length;

                expect(actual).toEqual(expected);
            });

            it('should render eight rows total', () => {
                let actual;
                let expected = 8;
                let newDataset = buildDataSet('with2Sources');

                containerFixture.datum(newDataset.data).call(groupedRowChart);

                actual = containerFixture.selectAll('.grouped-row .row').nodes().length;

                expect(actual).toEqual(expected);
            });
        });

        describe('API', function() {

            it('should provide an aspect ratio getter and setter', () => {
                let previous = groupedRowChart.aspectRatio(),
                    expected = 600,
                    actual;

                groupedRowChart.aspectRatio(expected);
                actual = groupedRowChart.aspectRatio();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            describe('aspect Ratio', function () {
                describe('when an aspect ratio is set', function () {
                    it('should modify the height depending on the width', () => {
                        let testAspectRatio = 0.5,
                            testWidth = 400,
                            newHeight;

                        groupedRowChart.aspectRatio(testAspectRatio);
                        groupedRowChart.width(testWidth);
                        newHeight = groupedRowChart.height();

                        expect(newHeight).toEqual(Math.ceil(testWidth * testAspectRatio));
                    });

                    it('should modify the width depending on the height', () => {
                        let testAspectRatio = 0.5,
                            testHeight = 400,
                            newWidth;

                        groupedRowChart.aspectRatio(testAspectRatio);
                        groupedRowChart.height(testHeight);
                        newWidth = groupedRowChart.width();

                        expect(newWidth).toEqual(Math.ceil(testHeight / testAspectRatio));
                    });
                });
            });

            it('should provide a colorSchema getter and setter', () => {
                let previous = groupedRowChart.colorSchema(),
                    expected = ['#ffffff', '#fafefc', '#000000'],
                    actual;

                groupedRowChart.colorSchema(expected);
                actual = groupedRowChart.colorSchema();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should have exportChart defined', () => {
                expect(groupedRowChart.exportChart).toBeDefined();
            });

            it('should provide groupLabel getter and setter', () => {
                let previous = groupedRowChart.groupLabel(),
                    expected = 'testLabel',
                    actual;

                groupedRowChart.groupLabel(expected);
                actual = groupedRowChart.groupLabel();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide grid mode getter and setter', () => {
                let previous = groupedRowChart.grid(),
                    expected = 'vertical',
                    actual;

                groupedRowChart.grid(expected);
                actual = groupedRowChart.grid();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide height getter and setter', () => {
                let previous = groupedRowChart.height(),
                    expected = 1000,
                    actual;

                groupedRowChart.height(expected);
                actual = groupedRowChart.height();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide horizontal direction getter and setter', () => {
                let previous = groupedRowChart.isHorizontal(),
                    expected = true,
                    actual;

                groupedRowChart.isHorizontal(expected);
                actual = groupedRowChart.isHorizontal();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide isAnimated getter and setter', () => {
                let previous = groupedRowChart.isAnimated(),
                    expected = true,
                    actual;

                groupedRowChart.isAnimated(expected);
                actual = groupedRowChart.isAnimated();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide isPrintMode getter and setter', () => {
                let previous = groupedRowChart.isPrintMode(),
                    expected = true,
                    actual;

                groupedRowChart.isPrintMode(expected);
                actual = groupedRowChart.isPrintMode();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide isStacked getter and setter', () => {
                let previous = groupedRowChart.isStacked(),
                    expected = true,
                    actual;

                groupedRowChart.isStacked(expected);
                actual = groupedRowChart.isStacked();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide loadingState getter and setter', () => {
                let previous = groupedRowChart.loadingState(),
                    expected = 'test',
                    actual;

                groupedRowChart.loadingState(expected);
                actual = groupedRowChart.loadingState();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide margin getter and setter', () => {
                let previous = groupedRowChart.margin(),
                    expected = {top: 4, right: 4, bottom: 4, left: 4},
                    actual;

                groupedRowChart.margin(expected);
                actual = groupedRowChart.margin();

                expect(previous).not.toBe(actual);
                expect(actual).toEqual(expected);
            });

            it('should provide nameLabel getter and setter', () => {
                let previous = groupedRowChart.nameLabel(),
                    expected = 'key',
                    actual;

                groupedRowChart.nameLabel(expected);
                actual = groupedRowChart.nameLabel();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide percentageAxisToMaxRatio getter and setter', () => {
                let previous = groupedRowChart.percentageAxisToMaxRatio(),
                    expected = 1.72,
                    actual;

                groupedRowChart.percentageAxisToMaxRatio(expected);
                actual = groupedRowChart.percentageAxisToMaxRatio();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide xTicks getter and setter', () => {
                let previous = groupedRowChart.xTicks(),
                    expected = 4,
                    actual;

                groupedRowChart.xTicks(expected);
                actual = groupedRowChart.xTicks();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide yTicks getter and setter', () => {
                let previous = groupedRowChart.yTicks(),
                    expected = 4,
                    actual;

                groupedRowChart.yTicks(expected);
                actual = groupedRowChart.yTicks();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide a tooltip threshold getter and setter', () => {
                let previous = groupedRowChart.tooltipThreshold(),
                    expected = 600,
                    actual;

                groupedRowChart.tooltipThreshold(expected);
                actual = groupedRowChart.tooltipThreshold();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide valueLabel getter and setter', () => {
                let previous = groupedRowChart.valueLabel(),
                    expected = 'quantity',
                    actual;

                groupedRowChart.valueLabel(expected);
                actual = groupedRowChart.valueLabel();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide valueLabelFormat getter and setter', () => {
                let previous = groupedRowChart.valueLabelFormat(),
                    expected = 's',
                    actual;

                groupedRowChart.valueLabelFormat(expected);
                actual = groupedRowChart.valueLabelFormat();

                expect(previous).not.toBe(expected);
                expect(actual).toBe(expected);
            });

            it('should provide width getter and setter', () => {
                let previous = groupedRowChart.width(),
                    expected = 40,
                    actual;

                groupedRowChart.width(expected);
                actual = groupedRowChart.width();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide yTickTextOffset getter and setter', () => {
                let previous = groupedRowChart.yTickTextOffset(),
                    expected =
                    {
                        x: -20,
                        y: -8
                    },
                    actual;

                groupedRowChart.yTickTextOffset(expected);
                actual = groupedRowChart.yTickTextOffset();

                expect(previous).not.toBe(actual);
                expect(actual).toBe(expected);
            });

            it('should provide yAxisLabel getter and setter', () => {
                let defaultYAxisLabel = 'Hello',
                    testYAxisLabel = 'World',
                    newYAxisLabel;

                groupedRowChart.yAxisLabel(testYAxisLabel);
                newYAxisLabel = groupedRowChart.yAxisLabel();

                expect(defaultYAxisLabel).not.toBe(newYAxisLabel);
                expect(newYAxisLabel).toBe(testYAxisLabel);
            });

            it('should provide yAxisLabelOffset getter and setter', () => {
                let defaultYAxisLabelOffset =  groupedRowChart.yAxisLabelOffset(),
                    testYAxisLabelOffset = -30,
                    newYAxisLabelOffset;

                groupedRowChart.yAxisLabelOffset(testYAxisLabelOffset);
                newYAxisLabelOffset = groupedRowChart.yAxisLabelOffset();

                expect(defaultYAxisLabelOffset).not.toBe(newYAxisLabelOffset);
                expect(newYAxisLabelOffset).toBe(testYAxisLabelOffset);
            });
        });

        describe('when margins are set partially', function() {

            it('should override the default values', () => {
                let previous = groupedRowChart.margin(),
                expected = {
                    ...previous,
                    top: 10,
                    right: 20
                },
                actual;

                groupedRowChart.width(expected);
                actual = groupedRowChart.width();

                expect(previous).not.toBe(actual);
                expect(actual).toEqual(expected);
            })
        });

        describe('when clicking on a row', () => {

            it('should trigger a callback', function() {
                let chart = containerFixture.select('.grouped-row');
                let callbackSpy = jasmine.createSpy('callback');

                groupedRowChart.on('customClick', callbackSpy);
                chart.dispatch('click');

                expect(callbackSpy.calls.count()).toBe(1);
                expect(callbackSpy.calls.allArgs()[0].length).toBe(2);
            })
        });

        describe('when hovering', function() {

            it('mouseover should trigger a callback', () => {
                let chart = containerFixture.selectAll('.grouped-row');
                let callbackSpy = jasmine.createSpy('callback');

                groupedRowChart.on('customMouseOver', callbackSpy);
                chart.dispatch('mouseover');

                expect(callbackSpy.calls.count()).toBe(1);
                expect(callbackSpy.calls.allArgs()[0].length).toBe(2);
            });

            it('mouseout should trigger a callback', () => {
                let chart = containerFixture.selectAll('.grouped-row');
                let callbackSpy = jasmine.createSpy('callback');

                groupedRowChart.on('customMouseOut', callbackSpy);
                chart.dispatch('mouseout');

                expect(callbackSpy.calls.count()).toBe(1);
                expect(callbackSpy.calls.allArgs()[0].length).toBe(2);
            });
        });


        describe('when grouped row is animated', () => {

            it('it renders correct number of layers and rows', () => {
                const expectedNLayers = 4;
                const nRowsPerLayer = 3;

                groupedRowChart.isAnimated(true);
                containerFixture.datum(dataset.data).call(groupedRowChart);

                const actualNLayers = containerFixture.selectAll('.chart-group .layer').nodes().length;
                const actualNRows = containerFixture.selectAll('.chart-group .row').nodes().length;

                expect(actualNLayers).toEqual(expectedNLayers);
                expect(actualNRows).toEqual(expectedNLayers * nRowsPerLayer);
            });
        });
    });



    describe('Print Mode: Grouped Row Chart', () => {
        let groupedRowChart, dataset, containerFixture, f;

        beforeEach(() => {
            dataset = buildDataSet('with3Sources');
            groupedRowChart = chart()
                                .isAnimated(true)
                                .groupLabel('stack')
                                .nameLabel('date')
                                .valueLabel('views')
                                .isStacked(true)
                                .isPrintMode(true);

            // DOM Fixture Setup
            f = jasmine.getFixtures();
            f.fixturesPath = 'base/test/fixtures/';
            f.load('testContainer.html');

            containerFixture = d3.select('.test-container');
            containerFixture.datum(dataset.data).call(groupedRowChart);
        });

        afterEach(() => {
            containerFixture.remove();
            f = jasmine.getFixtures();
            f.cleanUp();
            f.clearCache();
        });

        it('should render a chart with minimal requirements', () => {
            expect(containerFixture.select('.grouped-row').empty()).toBeFalsy();
        });
    });
});

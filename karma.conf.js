let webpackConfig = require('./webpack.config');

webpackConfig.devtool = 'inline-source-map';

// Karma configuration
module.exports = function(config) {
    'use strict';

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine-jquery', 'jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'tests_index.js',
            {
                pattern: 'test/fixtures/*.html',
                watched: true,
                served: true,
                included: false
            },
            './node_modules/phantomjs-polyfill-find/find-polyfill.js',
            './node_modules/babel-polyfill/dist/polyfill.js',
        ],


        // list of files to exclude
        exclude: [
            'node_modules/**/*spec*',
            'node_modules/**/*Spec*'
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'tests_index.js': ['webpack', 'sourcemap', 'coverage'],
        },

        // Coverage reporter options, check more in:
        // https://github.com/karma-runner/karma-coverage

        reporters: ['coverage-istanbul'],

        // any of these options are valid: https://github.com/istanbuljs/istanbuljs/blob/aae256fb8b9a3d19414dcf069c592e88712c32c6/packages/istanbul-api/lib/config.js#L33-L39
        coverageIstanbulReporter: {
            // reports can be any that are listed here: https://github.com/istanbuljs/istanbuljs/tree/aae256fb8b9a3d19414dcf069c592e88712c32c6/packages/istanbul-reports/lib
            reports: ['html', 'lcovonly', 'text-summary'],

            // base output directory. If you include %browser% in the path it will be replaced with the karma browser name
            dir: 'stats/testCoverage/',

            // Combines coverage information from multiple browsers into one report rather than outputting a report
            // for each browser.
            combineBrowserReports: true,

            // if using webpack and pre-loaders, work around webpack breaking the source path
            fixWebpackSourcePaths: true,

            // Omit files with no statements, no functions and no branches from the report
            skipFilesWithNoCoverage: true,

            // Most reporters accept additional config options. You can pass these through the `report-config` option
            'report-config': {
                // all options available at: https://github.com/istanbuljs/istanbuljs/blob/aae256fb8b9a3d19414dcf069c592e88712c32c6/packages/istanbul-reports/lib/html/index.js#L135-L137
                html: {
                    // outputs the report in ./coverage/html
                    subdir: 'html'
                }
            },

            // enforce percentage thresholds
            // anything under these percentages will cause karma to fail with an exit code of 1 if not running in watch mode
            thresholds: {
                emitWarning: true, // set to `true` to not fail the test command when thresholds are not met
                // thresholds for all files
                global: {
                    statements: 50,
                    lines: 50,
                    branches: 50,
                    functions: 50
                },
                // thresholds per file
                each: {
                    statements: 50,
                    lines: 50,
                    branches: 50,
                    functions: 50,
                    overrides: {
                        'src/charts/helpers/date.js': {
                            statements: 0,
                            lines: 0,
                            branches: 0,
                            functions: 0
                        },
                        'src/charts/helpers/export.js': {
                            statements: 0,
                            lines: 0,
                            branches: 0,
                            functions: 0
                        },
                        'src/charts/helpers/filter.js': {
                            statements: 0,
                            lines: 0,
                            branches: 0,
                            functions: 0
                        }
                    }
                }
            },

            verbose: true, // output config used by istanbul for debugging

            // `instrumentation` is used to configure Istanbul API package.
            instrumentation: {
                // To include `node_modules` code in the report.
                'default-excludes': false
            }
        },

        webpack: webpackConfig('test'),

        webpackMiddleware: {
            noInfo: true
        },

        plugins: [
            require('karma-webpack'),
            require('karma-coverage-istanbul-reporter'),
            require('karma-jasmine'),
            require('karma-jasmine-jquery'),
            require('karma-coverage'),
            require('karma-chrome-launcher'),
            require('karma-phantomjs-launcher'),
            require('karma-sourcemap-loader')
        ],

        // Setup of babel settings
        // Check more in: https://github.com/babel/karma-babel-preprocessor
        babelPreprocessor: {
            options: {
                presets: ['es2015']
            }
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        // possible values: 'PhantomJS', 'Chrome'
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    });
};

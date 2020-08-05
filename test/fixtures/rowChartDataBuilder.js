define(function(require) {
    'use strict';

    var _ = require('underscore'),
        json4ExpandedBars = require('../json/row4ExpandedBars.json'),
        json5Bars = require('../json/row5Bars.json'),
        json5CollapsedBars = require('../json/row5CollapsedBars.json'),
        jsonColors = require('../json/rowColors.json'),
        jsonColorsSeparators = require('../json/rowColorsSeparators.json'),
        jsonColorsSeparatorsNoDelta = require('../json/rowColorsSeparatorsNoDelta.json'),
        jsonDataLens = require('../json/rowFocusLens.json'),
        jsonFocusLens = require('../json/rowFocusPrintLens.json'),
        jsonLetters = require('../json/rowDataLetters.json'),
        jsonLongNames = require('../json/rowLongNames.json'),
        jsonMassiveSet = require('../json/rowMassiveSetBars.json');


    function RowDataBuilder(config){
        this.Klass = RowDataBuilder;

        this.config = _.defaults({}, config);

        this.withDataLens = function(){
            var attributes = _.extend({}, this.config, jsonDataLens);

            return new this.Klass(attributes);
        };

        this.withFocusLens = function(){
            var attributes = _.extend({}, this.config, jsonFocusLens);

            return new this.Klass(attributes);
        };

        this.withLettersFrequency = function(){
            var attributes = _.extend({}, this.config, jsonLetters);

            return new this.Klass(attributes);
        };

        this.withLongNames = function(){
            var attributes = _.extend({}, this.config, jsonLongNames);

            return new this.Klass(attributes);
        };

        this.withMassiveSet = function(){
            var attributes = _.extend({}, this.config, jsonMassiveSet);

            return new this.Klass(attributes);
        };

        this.withColors = function(){
            var attributes = _.extend({}, this.config, jsonColors);

            return new this.Klass(attributes);
        };
        this.withSeparators = function(){
            var attributes = _.extend({}, this.config, jsonColorsSeparators);

            return new this.Klass(attributes);
        };

        this.withSeparatorsNoDelta = function(){
            var attributes = _.extend({}, this.config, jsonColorsSeparatorsNoDelta);

            return new this.Klass(attributes);
        };

        this.with4Bars = function(){
            var attributes = _.extend({}, this.config, json4ExpandedBars);

            return new this.Klass(attributes);
        };

        this.with5Bars = function(){
            var attributes = _.extend({}, this.config, json5Bars);

            return new this.Klass(attributes);
        };

        this.with5CollapsedBars = function(){
            var attributes = _.extend({}, this.config, json5CollapsedBars);

            return new this.Klass(attributes);
        };


        this.build = function() {
            return this.config.data;
        };
    }

    return {
        RowDataBuilder: RowDataBuilder
    };
});

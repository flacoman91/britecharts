define(function(require) {
    'use strict';

    var _ = require('underscore'),

        jsonColors = require('json-loader!../json/testColors.json'),
        jsonLetters = require('json-loader!../json/testDataLetters.json');


    function TestDataBuilder(config){
        this.Klass = TestDataBuilder;

        this.config = _.defaults({}, config);

        this.withLettersFrequency = function(){
            var attributes = _.extend({}, this.config, jsonLetters);

            return new this.Klass(attributes);
        };

        this.withColors = function(){
            var attributes = _.extend({}, this.config, jsonColors);

            return new this.Klass(attributes);
        };

        this.build = function() {
            return this.config.data;
        };
    }

    return {
        TestDataBuilder: TestDataBuilder
    };
});

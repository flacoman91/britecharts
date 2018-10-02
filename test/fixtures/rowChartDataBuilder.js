define(function(require) {
    'use strict';

    var _ = require('underscore'),

        jsonColors = require('json-loader!../json/rowColors.json'),
        jsonLetters = require('json-loader!../json/rowDataLetters.json'),
        jsonLongNames = require('json-loader!../json/rowLongNames.json');


    function RowDataBuilder(config){
        this.Klass = RowDataBuilder;

        this.config = _.defaults({}, config);

        this.withLettersFrequency = function(){
            var attributes = _.extend({}, this.config, jsonLetters);

            return new this.Klass(attributes);
        };

        this.withLongNames = function(){
            var attributes = _.extend({}, this.config, jsonLongNames);

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
        RowDataBuilder: RowDataBuilder
    };
});

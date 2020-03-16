define(function(require) {
    'use strict';

    var _ = require('underscore'),

        jsonCFPBSources = require('../json/groupedrowDataCFPBSources.json'),
        jsonTwoSources = require('../json/groupedrowDataTwoSources.json'),
        jsonThreeSources = require('../json/groupedrowDataThreeSources.json');


    function GroupedRowChartDataBuilder(config){
        this.Klass = GroupedRowChartDataBuilder;

        this.config = _.defaults({}, config);

        this.with3Sources = function(){
            var attributes = _.extend({}, this.config, jsonThreeSources);

            return new this.Klass(attributes);
        };

        this.with2Sources = function(){
            var attributes = _.extend({}, this.config, jsonTwoSources);

            return new this.Klass(attributes);
        };

        this.withCFPBSources = function(){
            var attributes = _.extend({}, this.config, jsonCFPBSources);

            return new this.Klass(attributes);
        };

        this.build = function() {
            return this.config;
        };
    }

    return {
        GroupedRowChartDataBuilder: GroupedRowChartDataBuilder
    };

});

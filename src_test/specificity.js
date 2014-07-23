/*global describe,expect,it,beforeEach,inject,afterEach*/

describe('Test Specificity Calculations', function() {

    'use strict';

    var scope;
    var compile;
    var rootScope;

    beforeEach(module('net.enzey.service.css.editor'));

    beforeEach(inject(function($rootScope, $compile, $document) {
        scope = $rootScope.$new();
        compile = $compile;
        rootScope = $rootScope;
    }));

    it('test', inject(function() {
    }));

});

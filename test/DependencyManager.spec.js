var assert = require('assert');
var tdu = require('../index');

function assertContains(arr, obj) {
    assert(arr.indexOf(obj) !== -1);
}

function assertNotContains(arr, obj) {
    assert(arr.indexOf(obj) === -1);
}

describe('Create dependency graph', function () {

    var manager;

    beforeEach(function () {
        manager = new tdu.DependencyManager();
    });

    it ('should compute dependencies from files', function () {
        var exportReportBySymbol = {
            'DummyClassChild': ['DummyClassChild.ts'],
            'DummyClassSuper': ['DummyClassSuper.ts']
        };
        var usageReportByFile = {
            'DummyClassChild.ts': ['a', 'DummyClassSuper', 'DummyClassChild'],
            'DummyClassSuper.ts': ['a', 'b', 'DummyClassSuper']
        };
        var report = manager.createDepdencyTree(exportReportBySymbol, usageReportByFile);
        assert(report['DummyClassChild.ts']);
        assert.equal(report['DummyClassChild.ts'].length, 1);
        assert.equal(report['DummyClassChild.ts'][0], 'DummyClassSuper.ts');
        assert(report['DummyClassSuper.ts']);
        assert.equal(report['DummyClassSuper.ts'].length, 0);
    });

    it ('should compute file order from dependencies', function () {
        var tree = {
            'DummyClassChild.ts': ['DummyClassSuper.ts'],
            'DummyClassSuper.ts': []
        };
        var order = manager.sortFromDepdencyTree(tree);
        assert.equal(order.length, 2);
        assert.equal(order[0], 'DummyClassSuper.ts');
        assert.equal(order[1], 'DummyClassChild.ts');
    });

    it ('should compute file order from dependencies without any relations', function () {
        var tree = {
            'DummyClassA': [],
            'DummyClassB': [],
            'DummyClassC': []
        };
        var order = manager.sortFromDepdencyTree(tree);
        assert.equal(order[0], 'DummyClassA');
        assert.equal(order[1], 'DummyClassB');
        assert.equal(order[2], 'DummyClassC');
    });

    it ('should compute file order from dependencies 2', function () {
        var tree = {
            'DummyClassA': ['DummyClassB'],
            'DummyClassB': ['DummyClassC'],
            'DummyClassC': []
        };
        var order = manager.sortFromDepdencyTree(tree);
        assert.equal(order.length, 3);
        assert.equal(order[0], 'DummyClassC');
        assert.equal(order[1], 'DummyClassB');
        assert.equal(order[2], 'DummyClassA');
    });

    it ('should not add a dependency to something defined in itself', function () {
        var exportReportBySymbol = {
            'moduleA': ['moduleA/module.ts', 'moduleA/file1.ts', 'moduleA/file2.ts'],
            'moduleA.DummyClass1': ['moduleA/file1.ts'],
            'moduleA.DummyClass2': ['moduleA/file2.ts'],
            'moduleB': ['moduleB/module.ts']
        };
        var usageReportByFile = {
            'moduleA/file1.ts': ['moduleA', 'moduleB', 'DummyClassChild'],
            'moduleA/file2.ts': ['moduleA', 'AnotherClass'],
            'moduleA/module.ts': ['moduleA'],
            'moduleB/module.ts': ['moduleB', 'b', 'DummyClassSuper']
        };
        var tree = manager.createDepdencyTree(exportReportBySymbol, usageReportByFile);
        assertNotContains(tree['moduleA/file1.ts'], 'moduleA/module.ts');
        assertNotContains(tree['moduleA/file1.ts'], 'moduleA/file2.ts');
        assertNotContains(tree['moduleA/module.ts'], 'moduleA/file1.ts');
        assertNotContains(tree['moduleA/module.ts'], 'moduleA/file2.ts');
        manager.sortFromDepdencyTree(tree);
    });
});

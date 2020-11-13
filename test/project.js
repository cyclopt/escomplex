/* globals require, suite, test, setup, teardown */
'use strict'
var assert = require('chai').assert
var mozWalker = require('../src/walker')
var parsers = require('./helpers/parsers')
var modulePath = '../src/project'
suite('project:', function () {
  test('require does not throw', function () {
    assert.doesNotThrow(function () {
      require(modulePath)
    })
  })
  test('require returns object', function () {
    assert.isObject(require(modulePath))
  })
  suite('require:', function () {
    var cr
    setup(function () {
      cr = require(modulePath)
    })
    teardown(function () {
      cr = undefined
    })
    test('analyse function is exported', function () {
      assert.isFunction(cr.analyse)
    })
    test('processResults function is exported', function () {
      assert.isFunction(cr.processResults)
    })
    test('analyse throws when modules is object', function () {
      assert.throws(function () {
        cr.analyse({
          body: [],
          loc: {
            end: {
              line: 0
            },
            start: {
              line: 0
            }
          }
        }, mozWalker)
      })
    })
    test('analyse does not throw when modules is array', function () {
      assert.doesNotThrow(function () {
        cr.analyse([], mozWalker)
      })
    })
    suite('no modules:', function () {
      var result
      setup(function () {
        result = cr.analyse([], mozWalker)
      })
      teardown(function () {
        result = undefined
      })
      test('object was returned', function () {
        assert.isObject(result)
      })
      test('reports array exists', function () {
        assert.isArray(result.reports)
      })
      test('reports array has zero length', function () {
        assert.lengthOf(result.reports, 0)
      })
      test('adjacency matrix exists', function () {
        assert.isArray(result.adjacencyMatrix)
      })
      test('adjacency matrix has zero length', function () {
        assert.lengthOf(result.adjacencyMatrix, 0)
      })
      test('first-order density is correct', function () {
        assert.strictEqual(result.firstOrderDensity, 0)
      })
      test('change cost is correct', function () {
        assert.strictEqual(result.changeCost, 0)
      })
      test('core size is correct', function () {
        assert.strictEqual(result.coreSize, 0)
      })
      test('mean per-function logical LOC is correct', function () {
        assert.strictEqual(result.loc, 0)
      })
      test('mean per-function cyclomatic complexity is correct', function () {
        assert.strictEqual(result.cyclomatic, 0)
      })
      test('mean per-function Halstead effort is correct', function () {
        assert.strictEqual(result.effort, 0)
      })
      test('mean per-function parameter count is correct', function () {
        assert.strictEqual(result.params, 0)
      })
      test('mean per-function maintainability index is correct', function () {
        assert.strictEqual(result.maintainability, 0)
      })
    })
    parsers.forEach(function (parserName, parser, options) {
      suite('two modules:', function () {
        var result
        setup(function () {
          result = cr.analyse([
            {
              ast: parser.parse('function foo (a, b) { if (a) { b(a); } else { a(b); } } function bar (c, d) { var i; for (i = 0; i < c.length; i += 1) { d += 1; } console.log(d); }', options),
              path: 'b'
            },
            {
              ast: parser.parse('if (true) { "foo"; } else { "bar"; }', options),
              path: 'a'
            }
          ], mozWalker)
        })
        teardown(function () {
          result = undefined
        })
        test('reports is correct length', function () {
          assert.lengthOf(result.reports, 2)
        })
        test('first report aggregate has correct physical lines of code', function () {
          assert.strictEqual(result.reports[0].aggregate.sloc.physical, 1)
        })
        test('first report aggregate has correct logical lines of code', function () {
          assert.strictEqual(result.reports[0].aggregate.sloc.logical, 4)
        })
        test('first report aggregate has correct cyclomatic complexity', function () {
          assert.strictEqual(result.reports[0].aggregate.cyclomatic, 2)
        })
        test('first report aggregate has correct cyclomatic complexity density', function () {
          assert.strictEqual(result.reports[0].aggregate.cyclomaticDensity, 50)
        })
        test('first report functions is empty', function () {
          assert.lengthOf(result.reports[0].functions, 0)
        })
        test('first report aggregate has correct Halstead total operators', function () {
          assert.strictEqual(result.reports[0].aggregate.halstead.operators.total, 2)
        })
        test('first report aggregate has correct Halstead distinct operators', function () {
          assert.strictEqual(result.reports[0].aggregate.halstead.operators.distinct, 2)
        })
        test('first report aggregate has correct Halstead total operands', function () {
          assert.strictEqual(result.reports[0].aggregate.halstead.operands.total, 3)
        })
        test('first report aggregate has correct Halstead distinct operands', function () {
          assert.strictEqual(result.reports[0].aggregate.halstead.operands.distinct, 3)
        })
        test('first report aggregate has correct Halstead operator identifier length', function () {
          assert.lengthOf(result.reports[0].aggregate.halstead.operators.identifiers, result.reports[0].aggregate.halstead.operators.distinct)
        })
        test('first report aggregate has correct Halstead operand identifier length', function () {
          assert.lengthOf(result.reports[0].aggregate.halstead.operands.identifiers, result.reports[0].aggregate.halstead.operands.distinct)
        })
        test('first report aggregate has correct Halstead length', function () {
          assert.strictEqual(result.reports[0].aggregate.halstead.length, 5)
        })
        test('first report aggregate has correct Halstead vocabulary', function () {
          assert.strictEqual(result.reports[0].aggregate.halstead.vocabulary, 5)
        })
        test('first report aggregate has correct Halstead difficulty', function () {
          assert.strictEqual(result.reports[0].aggregate.halstead.difficulty, 1)
        })
        test('first report aggregate has correct Halstead volume', function () {
          assert.strictEqual(Math.round(result.reports[0].aggregate.halstead.volume), 12)
        })
        test('first report aggregate has correct Halstead effort', function () {
          assert.strictEqual(Math.round(result.reports[0].aggregate.halstead.effort), 12)
        })
        test('first report aggregate has correct Halstead bugs', function () {
          assert.strictEqual(Math.round(result.reports[0].aggregate.halstead.bugs), 0)
        })
        test('first report aggregate has correct Halstead time', function () {
          assert.strictEqual(Math.round(result.reports[0].aggregate.halstead.time), 1)
        })
        test('first report has correct path', function () {
          assert.strictEqual(result.reports[0].path, 'a')
        })
        test('second report maintainability index is correct', function () {
          assert.strictEqual(Math.round(result.reports[1].maintainability), 128)
        })
        test('second report first function has correct parameter count', function () {
          assert.strictEqual(result.reports[1].functions[0].params, 2)
        })
        test('second report second function has correct parameter count', function () {
          assert.strictEqual(result.reports[1].functions[1].params, 2)
        })
        test('second report aggregate has correct parameter count', function () {
          assert.strictEqual(result.reports[1].aggregate.params, 4)
        })
        test('second report mean parameter count is correct', function () {
          assert.strictEqual(result.reports[1].params, 2)
        })
        test('second report has correct path', function () {
          assert.strictEqual(result.reports[1].path, 'b')
        })
        test('first-order density is correct', function () {
          assert.strictEqual(result.firstOrderDensity, 0)
        })
        test('change cost is correct', function () {
          assert.strictEqual(result.changeCost, 50)
        })
        test('core size is correct', function () {
          assert.strictEqual(result.coreSize, 0)
        })
        test('mean per-function logical LOC is correct', function () {
          assert.strictEqual(result.loc, 4)
        })
        test('mean per-function cyclomatic complexity is correct', function () {
          assert.strictEqual(result.cyclomatic, 2)
        })
        test('mean per-function Halstead effort is correct', function () {
          assert.strictEqual(result.effort, 193.1614743092401)
        })
        test('mean per-function parameter count is correct', function () {
          assert.strictEqual(result.params, 1)
        })
        test('mean per-function maintainability index is correct', function () {
          assert.strictEqual(result.maintainability, 134.05623254229997)
        })
      })
      suite('two modules with different options:', function () {
        var modules = []
        var reportsOnly
        setup(function () {
          modules.push({
            ast: parser.parse('function foo (a, b) { if (a) { b(a); } else { a(b); } } function bar (c, d) { var i; for (i = 0; i < c.length; i += 1) { d += 1; } console.log(d); }', options),
            path: 'b'
          })
          modules.push({
            ast: parser.parse('if (true) { "foo"; } else { "bar"; }', options),
            path: 'a'
          })
          reportsOnly = cr.analyse(modules, mozWalker, {
            skipCalculation: true
          })
        })
        test('should not have aggregates if we call with skipCalculation', function () {
          assert.deepEqual(Object.keys(reportsOnly), [
            'reports'
          ])
        })
        test('should not have coreSize or visibilityMatrix if we call with noCoreSize', function () {
          var results = cr.analyse(modules, mozWalker, {
            noCoreSize: true
          })
          assert.notOk(results.coreSize)
          assert.notOk(results.visibilityMatrix)

          // Make sure we still have a few things though
          assert.ok(results.adjacencyMatrix)
          assert.ok(results.loc)
        })
        test('should be able to run processResults', function () {
          var fullReport
          var calcReport
          fullReport = cr.analyse(modules, mozWalker)
          calcReport = cr.processResults(reportsOnly)
          assert.deepEqual(calcReport, fullReport)
        })
        test('should be able to run processResults without calculating coreSize', function () {
          var results = cr.processResults(reportsOnly, true)
          assert.notOk(results.coreSize)
          assert.notOk(results.visibilityMatrix)

          // Make sure we still have a few things though
          assert.ok(results.adjacencyMatrix)
          assert.ok(results.loc)
        })
      })
      suite('require directory (index.js)', function () {
        setup(function () {
          this.path1 = '/b.js'
          this.path2 = '/mod/index.js'
          this.path3 = '/mod/a.js'
          var result = cr.analyse([
            {
              ast: parser.parse('require("./mod")', options),
              path: this.path1
            },
            {
              ast: parser.parse('require("./a")', options),
              path: this.path2
            },
            {
              ast: parser.parse('require("../b.js")', options),
              path: this.path3
            }
          ], mozWalker)
          this.processResults = cr.processResults(result)
        })
      })
      suite('modules with dependencies:', function () {
        var result
        setup(function () {
          result = cr.analyse([
            {
              ast: parser.parse('require("./a");"d";', options),
              path: '/d.js'
            },
            {
              ast: parser.parse('require("./b");"c";', options),
              path: '/a/c.js'
            },
            {
              ast: parser.parse('require("./c");"b";', options),
              path: '/a/b.js'
            },
            {
              ast: parser.parse('require("./a/b");require("./a/c");"a";', options),
              path: '/a.js'
            }
          ], mozWalker)
        })
        teardown(function () {
          result = undefined
        })
        test('first order density is correct', function () {
          assert.strictEqual(result.firstOrderDensity, 0)
        })
        test('change cost is correct', function () {
          assert.strictEqual(result.changeCost, 25)
        })
        test('core size is correct', function () {
          assert.strictEqual(result.coreSize, 0)
        })
      })
      suite('MacCormack, Rusnak & Baldwin example:', function () {
        var result
        setup(function () {
          result = cr.analyse([
            {
              ast: parser.parse('"f";', options),
              path: '/a/c/f.js'
            },
            {
              ast: parser.parse('require("./f");"e";', options),
              path: '/a/c/e.js'
            },
            {
              ast: parser.parse('"d";', options),
              path: '/a/b/d.js'
            },
            {
              ast: parser.parse('require("./c/e");"c";', options),
              path: '/a/c.js'
            },
            {
              ast: parser.parse('require("./b/d");"b";', options),
              path: '/a/b.js'
            },
            {
              ast: parser.parse('require("./a/b");require("./a/c");"a";', options),
              path: '/a.js'
            }
          ], mozWalker)
        })
        teardown(function () {
          result = undefined
        })
        test('first order density is correct', function () {
          assert.strictEqual(result.firstOrderDensity, 0)
        })
        test('change cost is correct', function () {
          assert.isTrue(result.changeCost > 0)
        })
        test('core size is correct', function () {
          assert.strictEqual(result.coreSize, 0)
        })
      })
    })
  })
})

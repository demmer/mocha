
/**
 * Module dependencies.
 */

var Base = require('./base')
  , output = Base.output
  , utils = require('../utils')
  , escape = utils.escape;

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */

var Date = global.Date
  , setTimeout = global.setTimeout
  , setInterval = global.setInterval
  , clearTimeout = global.clearTimeout
  , clearInterval = global.clearInterval;

/**
 * Expose `XUnit`.
 */

exports = module.exports = XUnit;

/**
 * Initialize a new `XUnit` reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function XUnit(runner, ostream) {
  Base.call(this, runner, ostream);
  var stats = this.stats
    , suites = []
    , self = this;

  runner.on('suite', function(suite) {
      suites.push({suite: suite, tests: [], passes: 0, fails: 0});
  });

  runner.on('pass', function(test){
      suites[suites.length - 1].tests.push(test);
      suites[suites.length - 1].passes++;
  });

  runner.on('fail', function(test){
      suites[suites.length - 1].tests.push(test);
      suites[suites.length - 1].fails++;
  });

  runner.on('end', function(){
    output.log(tag('testsuites', {
        name: 'Mocha Tests'
      , tests: stats.tests
      , failures: stats.failures
      , errors: stats.failures
      , skip: stats.tests - stats.failures - stats.passes
      , timestamp: (new Date).toUTCString()
      , time: stats.duration / 1000
    }, false));
    suites.forEach(suite);
    output.log('</testsuites>');
  });
}

/**
 * Inherit from `Base.prototype`.
 */

XUnit.prototype.__proto__ = Base.prototype;

/**
 * Output tag and contents for the given `suite.`
 */
function suite(suite) {
    if (suite.tests.length == 0) { 
        return; 
    };

    var duration = 0;
    suite.tests.forEach(function(test) { duration += test.duration; });

    output.log(tag('testsuite', {
        name: suite.suite.fullTitle()
      , tests: suite.tests.length
      , failures: suite.fails
      , errors: suite.fails
      , skip: 0
      , timestamp: (new Date).toUTCString()
      , time: duration / 1000
    }, false));
    
    suite.tests.forEach(test);
    
    output.log('</testsuite>');
}

/**
 * Output tag for the given `test.`
 */

function test(test) {
  var attrs = {
      classname: test.parent.fullTitle()
    , name: test.title
    , time: test.duration / 1000
  };

  if ('failed' == test.state) {
    var err = test.err;
    attrs.message = escape(err.message);
    output.log(tag('testcase', attrs, false, tag('failure', attrs, false, cdata(err.stack))));
  } else if (test.pending) {
    output.log(tag('testcase', attrs, false, tag('skipped', {}, true)));
  } else {
    output.log(tag('testcase', attrs, true) );
  }
}

/**
 * HTML tag helper.
 */

function tag(name, attrs, close, content) {
  var end = close ? '/>' : '>'
    , pairs = []
    , tag;

  for (var key in attrs) {
    pairs.push(key + '="' + escape(attrs[key]) + '"');
  }

  tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
  if (content) tag += content + '</' + name + end;
  return tag;
}

/**
 * Return cdata escaped CDATA `str`.
 */

function cdata(str) {
  return '<![CDATA[' + escape(str) + ']]>';
}

'use strict';

var Promise = require('bluebird');
var fs = require('graceful-fs');
var _ = require('highland');
var memoize = require('lodash.memoize');
var defaults = require('lodash.defaults');

/**
 * Line ending when outputting.  As per LDraw spec, this is Windows stylie
 * @type {string}
 */
var LINE_ENDING = '\r\n';

/**
 * Mapping of axis to column in LPD file (line type 1)
 * @type {{x: number, y: number, z: number}}
 */
var AXIS_CELL_MAP = {
  x: 2,
  y: 3,
  z: 4
};

/**
 * Line types which we ignore.
 * @type {number[]}
 */
var IGNORED_LINE_TYPES = [
  0,
  2,
  3,
  4,
  5
];

/**
 * Line which is interspersed throughout the output, denoting a step.
 * @type {string}
 */
var STEP_LINE = '0 STEP';

/**
 * Returns a function which sorts the LDraw file
 * @param {Object} opts Options object
 * @param {string} opts.axis Axis to sort on
 * @returns {Function} Sorting function
 */
function sorter(opts) {
  /**
   * In which column the data to sort on lives
   * @type number
   */
  var idx = AXIS_CELL_MAP[opts.axis];
  var value;
  var split;

  /**
   * Given cells, return the numeric value of the number at idx
   * @param {Array} cells A split line
   * @returns {number} Value
   */
  function fieldValue(cells) {
    return parseInt(cells[idx], 10);
  }

  /**
   * Split a line by whitespace
   * @param {string} line A line
   * @returns {Array} Line split by whitespace
   */
  function splitLine(line) {
    return line.split(/\s+/);
  }

  /**
   * Sorting function.  Splits lines `a` and `b` by whitespace then sorts on
   * the proper column.
   * @param {string} a Line
   * @param {string} b Another line
   * @returns {number} Sort result
   */
  function sortLines(a, b) {
    return value(split(a)) - value(split(b));
  }

  /**
   * Return false if the line is empty or begins with an ignored "type"
   * @param {string} line Line to evaluate
   * @returns {boolean} Result of evaluation
   */
  function reject(line) {
    return !line.length ||
      IGNORED_LINE_TYPES.indexOf(parseInt(line.charAt(0), 10)) > -1;
  }

  value = memoize(fieldValue);
  split = memoize(splitLine);

  return function sort(source) {
    return source.split()
      .reject(reject)
      .sortBy(sortLines);
  };
}

/**
 * Returns a function which outputs the result
 * @param {Object} opts Options object
 * @param {string} [opts.output] Output path, if any
 * @returns {Function} Function which accepts a source (of sources) and
 * intersperses steps endings, line endings, then writes.
 */
function writer(opts) {
  return function write(source) {
    return source.intersperse(STEP_LINE)
      .flatten()
      .intersperse(LINE_ENDING)
      .pipe(opts.output ? fs.createWriteStream(opts.output) : process.stdout);
  };
}

/**
 * Given a filepath and an options object, read the LPD file and output a new
 * LPD file sorted into steps.
 * @param {string} filepath File to read
 * @param {Object} [opts] Options object
 * @param {Function} [done] Optional callback; returns a Promise if not used
 * @todo document options
 * @returns {Promise} Empty fulfilled promise
 */
function generateSteps(filepath, opts, done) {
  var sort;
  var write;
  opts = defaults(opts || {}, {
    axis: 'y',
    pieces: 10
  });

  sort = sorter(opts);
  write = writer(opts);

  return new Promise(function generate(resolve, reject) {
    var source = sort(_(fs.createReadStream(filepath))
      .stopOnError(reject));
    if (opts.steps) {
      source.toArray(function countLines(lines) {
        var steps = Math.floor(lines.length / opts.steps);
        write(_(lines)
          .batch(isNaN(steps) ? 0 : steps));
        resolve();
      });
    } else {
      write(source.batch(opts.pieces));
      resolve();
    }
  }).nodeify(done);
}

module.exports = generateSteps;

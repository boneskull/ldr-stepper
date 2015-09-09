'use strict';

var fs = require('graceful-fs');
var path = require('path');
var _ = require('highland');
var memoize = require('lodash.memoize');

var VALID_EXTENSIONS = [
  '.ldr',
  '.dat',
  '.mpd'
];

var LINE_ENDING = '\r\n';

var AXIS_CELL_MAP = {
  x: 2,
  y: 3,
  z: 4
};

var IGNORED_LINE_TYPES = [
  0,
  2,
  3,
  4,
  5
];

var STEP_LINE = '0 STEP\r\n';

var split = memoize(function split(line) {
  return line.split(/\s+/);
});

function sortFieldFactory(opts) {
  var idx = AXIS_CELL_MAP[opts.axis];
  return memoize(function getSortField(cells) {
    return parseInt(cells[idx], 10);
  });
}

function checkExtension(filepath) {
  var ext = path.extname(filepath).toLowerCase();
  return VALID_EXTENSIONS.indexOf(ext) > -1;
}

function sortFactory(opts) {
  var sortField = sortFieldFactory(opts);
  return function sort(a, b) {
    return sortField(split(a)) - sortField(split(b));
  };
}

function getWriteStream(opts) {
  return opts.output ? fs.createWriteStream(opts.output) : process.stdout;
}

function reject(line) {
  return !line.length ||
    IGNORED_LINE_TYPES.indexOf(parseInt(line.charAt(0), 10)) > -1;
}

function generateSteps(filepath, opts) {
  var sort = sortFactory(opts);

  var stream = _(fs.createReadStream(filepath))
    .stopOnError(function(err) {
      throw new Error(err);
    })
    .split()
    .reject(reject)
    .sortBy(sort)
    .intersperse(LINE_ENDING);

  if (opts.steps) {
    stream.toArray(function(lines) {
      var steps = Math.floor(lines.length / opts.steps);
      if (isNaN(steps)) {
        steps = 0;
      }
      _(lines)
        .batch(steps * 2)
        .intersperse(STEP_LINE)
        .flatten()
        .pipe(getWriteStream(opts));
    });
  } else {
    stream.batch(opts.pieces * 2)
      .intersperse(STEP_LINE)
      .flatten()
      .pipe(getWriteStream(opts));
  }
}

generateSteps.checkExtension = checkExtension;

module.exports = generateSteps;

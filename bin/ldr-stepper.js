#!/usr/bin/env node

'use strict';

var yargs = require('yargs');
var generateSteps = require('../lib');
var path = require('path');
var omit = require('lodash.omit');

var argv = yargs
  .usage('$0 [options] <file.ldr>')
  .demand(1)
  .version(function getVersion() {
    return require('../package.json').version;
  })
  .option('output', {
    alias: 'o',
    describe: 'Output file; if unspecified, will output to STDOUT',
    string: true
  })
  .option('pieces', {
    alias: 'p',
    describe: 'Number of pieces per step',
    number: true,
    'default': 10
  })
  .option('steps', {
    alias: 's',
    describe: 'Maximum number of steps.  Overrides --pieces',
    number: true
  })
  .option('axis', {
    alias: 'a',
    describe: 'Axis on which to sort pieces',
    'default': 'y',
    choices: [
      'x',
      'y',
      'z'
    ]
  })
  .option('force', {
    describe: 'Overwrite any file specified by --output',
    'default': false
  })
  .help('help')
  .alias('help', 'h')
  .showHelpOnFail(true)
  .check(function check(args) {
    var filepath = args._[0];
    var base;
    if (args.steps) {
      args.steps = Math.floor(args.steps);
      if (args.steps < 0) {
        throw new Error('--steps must not be negative');
      }
    }

    args.pieces = Math.floor(args.pieces);
    if (args.pieces < 1) {
      throw new Error('--pieces must be a positive integer');
    }

    if (!generateSteps.checkExtension(filepath)) {
      base = path.basename(filepath);
      console.warn('WARNING: "%s" may not be an LDR file', base);
    }
    return true;
  })
  .argv;

generateSteps(argv._[0], omit(argv, function uniquify(value, key) {
  return key.length === 1;
}));


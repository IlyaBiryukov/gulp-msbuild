'use strict';

var commandBuilder = require('./msbuild-command-builder');
var gutil = require('gulp-util');
var childProcess = require('child_process');

module.exports.startMsBuildTask = function (options, file, callback) {
  var command = commandBuilder.construct(file, options);
  var args = commandBuilder.buildArguments(options);

  if (options.logCommand) {
    gutil.log('Using msbuild command: ' + command + ' ' + args.join(' '));
  }

  var stdout = options.stdout ? 'pipe' : 'ignore';
  var stderr = options.stderr ? 'pipe' : 'ignore';
  var cp = childProcess.spawn(command, args, {stdio: ['pipe', stdout, stderr]});
  var error;
  cp.on('error', function(err) {
    if (err && options.errorOnFail) {
      error = err;
    }
  });
  cp.on('close', function(code) {
    if (code === 0) {
      gutil.log(gutil.colors.cyan('Build complete!'));
    } else {
      gutil.log(gutil.colors.red('Build failed!'));
    }

    return callback(error);
  });
};


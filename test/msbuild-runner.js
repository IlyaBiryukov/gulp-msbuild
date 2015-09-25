/*global describe, it, beforeEach*/
'use strict';

var chai          = require('chai'),
    Stream        = require('stream'),
    constants     = require('../lib/constants'),
    mockSpawn     = require('mock-spawn'),
    gutil         = require('gulp-util'),
    expect        = chai.expect;

chai.use(require('sinon-chai'));
require('mocha-sinon');

var mySpawn = mockSpawn();
require('child_process').spawn = mySpawn;

var commandBuilder = require('../lib/msbuild-command-builder');
var msbuildRunner = require('../lib/msbuild-runner');

var defaults;

describe('msbuild-runner', function () {

  beforeEach(function () {
    defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));

    this.sinon.stub(commandBuilder, 'construct').returns('msbuild');
    this.sinon.stub(commandBuilder, 'buildArguments').returns(['/nologo']);
    this.sinon.stub(gutil, 'log');
  });

  it('should execute the msbuild command', function (done) {
    defaults.stdout = true;
    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(
        gutil.colors.cyan('Build complete!'));
      expect(mySpawn.calls[0].command).to.be.equal('msbuild');
      expect(mySpawn.calls[0].args).to.deep.equal(['/nologo']);
      done();
    });

  });

  it('should log the command when the logCommand option is set', function(done) {
    defaults.logCommand = true;
    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(
        'Using msbuild command: msbuild /nologo');
      done();
    });
  });

  it('should log the error when the msbuild command failed', function (done) {
    mySpawn.sequence.add(mySpawn.simple(1, 'Test'));
    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      var execution = mySpawn.calls[2];
      expect(execution.exitCode).to.be.equal(1);
      expect(gutil.log).to.have.been.calledWith(
        gutil.colors.red('Build failed!'));
      done();
    });
  });

  it('should log the error and return the error in the callback when the msbuild command failed', function (done) {
    defaults.errorOnFail = true;
    mySpawn.sequence.add(function (cb) {
      this.emit('error', new Error('spawn ENOENT'));
      return cb(1);
    });

    msbuildRunner.startMsBuildTask(defaults, {}, function (err) {
      var execution = mySpawn.calls[3];
      expect(err).to.be.deep.equal(new Error('spawn ENOENT'));
      expect(gutil.log).to.have.been.calledWith(
        gutil.colors.red('Build failed!'));
      expect(execution.exitCode).to.be.equal(1);
      done();
    });
  });
});

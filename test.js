/*!
 * gulp-routes <https://github.com/assemble/gulp-routes>
 *
 * Copyright (c) 2014-2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var should = require('should');
var through = require('through2');
var File = require('gulp-util').File;
var Router = require('en-route').Router;
var gulpRoutes = require('./');

describe('gulp-routes', function() {
  it('should route files', function(done) {

    var fakeFile = new File({
      cwd: 'fixtures',
      base: 'fixtures',
      path: 'fixtures/index.js',
      contents: new Buffer('var foo = function(){};')
    });

    var router = new Router();
    router.all(/\.js/, function (file, next) {
      file.data = file.data || {};
      file.data.middleware = true;
      next();
    });

    var routes = gulpRoutes(router);
    var stream = routes();
    stream.on('data', function (file) {
      file.data.middleware.should.be.true;
    });

    stream.on('end', done);

    stream.write(fakeFile);
    stream.end();
  });

  it('should route files with a router from `this`', function (done) {
    var fakeFile = new File({
      cwd: 'fixtures',
      base: 'fixtures',
      path: 'fixtures/index.js',
      contents: new Buffer('var foo = function(){};')
    });

    var app = {};
    app.router = new Router();
    app.router.all(/\.js/, function (file, next) {
      file.data = file.data || {};
      file.data.middleware = true;
      next();
    });

    var routes = gulpRoutes.call(app);
    var stream = routes();
    stream.on('data', function (file) {
      file.data.middleware.should.be.true;
    });

    stream.on('end', done);

    stream.write(fakeFile);
    stream.end();
  });

  it('should route files to different routes', function (done) {
    var file1 = new File({
      cwd: 'fixtures',
      base: 'fixtures',
      path: 'fixtures/one.js',
      contents: new Buffer('one')
    });

    var file2 = new File({
      cwd: 'fixtures',
      base: 'fixtures',
      path: 'fixtures/two.js',
      contents: new Buffer('two')
    });

    var router = new Router();
    router.use(function (file, next ) {
      file.data = file.data || {};
      next();
    });

    router.all(/one/, function (file, next) {
      file.data.one = true;
      next();
    });

    router.all(/two/, function (file, next) {
      file.data.two = true;
      next();
    });

    var routes = gulpRoutes(router);
    var stream = routes();
    stream.on('data', function (file) {
      switch (file.contents.toString()) {
        case 'one':
          file.data.one.should.be.true;
          file.data.should.not.have.property('two');
          break;
        case 'two':
          file.data.should.not.have.property('one');
          file.data.two.should.be.true;
          break;
      }
    });

    stream.on('end', done);

    stream.write(file1);
    stream.write(file2);
    stream.end();
  });

  it('should route on multiple methods', function (done) {
    var fakeFile = new File({
      cwd: 'fixtures',
      base: 'fixtures',
      path: 'fixtures/one.js',
      contents: new Buffer('one')
    });

    var router = new Router({
      methods: ['before', 'after', 'whatever']
    });

    router.use(function (file, next) {
      file.data = file.data || {};
      next();
    });

    router.before(/./, function (file, next) {
      file.data.before = true;
      next();
    });

    router.whatever(/./, function (file, next) {
      file.data.whatever = true;
      next();
    });

    router.after(/./, function (file, next) {
      file.data.after = true;
      next();
    });

    var routes = gulpRoutes(router);
    var whateverStream = routes('whatever');
    var beforeStream = routes('before');
    var afterStream = routes('after');

    whateverStream
      .pipe(through.obj(function (file, enc, cb) {
        file.data.whatever.should.be.true;
        file.data.should.not.have.property('after');
        this.push(file);
        cb();
      }))

    beforeStream
      .pipe(through.obj(function (file, enc, cb) {
        file.data.before.should.be.true;
        file.data.should.not.have.property('after');
        this.push(file);
        cb();
      }))
      .pipe(whateverStream)
      .pipe(afterStream);

    afterStream.on('data', function (file) {
      file.data.before.should.be.true;
      file.data.whatever.should.be.true;
      file.data.after.should.be.true;
    });

    afterStream.on('end', done);

    beforeStream.write(fakeFile);
    beforeStream.end();
  });

  it('should throw an error when a router is\'t provided.', function (done) {
    try {
      var routes = gulpRoutes();
      return done(new Error('Expected an error to be thrown'));
    } catch (err) {
      if (!err) return done(new Error('Expected an error to be thrown'));
      done();
    }
  });
});

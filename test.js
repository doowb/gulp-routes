/**
 * Assemble <http://assemble.io>
 *
 * Copyright (c) 2014 Jon Schlinkert, Brian Woodward, contributors
 * Licensed under the MIT License (MIT).
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
      cwd: 'src/templates',
      base: 'src/templates',
      path: 'src/templates/alert.hbs',
      contents: new Buffer('---\ntitle: sup\n---\n{{upper title}}')
    });

    var router = new Router();
    router.all(/\.hbs/, function (file, next) {
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
      cwd: 'src/templates',
      base: 'src/templates',
      path: 'src/templates/alert.hbs',
      contents: new Buffer('---\ntitle: sup\n---\n{{upper title}}')
    });

    var app = {};
    app.router = new Router();
    app.router.all(/\.hbs/, function (file, next) {
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
      cwd: 'src/templates',
      base: 'src/templates',
      path: 'src/templates/one.hbs',
      contents: new Buffer('one')
    });

    var file2 = new File({
      cwd: 'src/templates',
      base: 'src/templates',
      path: 'src/templates/two.hbs',
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
      cwd: 'src/templates',
      base: 'src/templates',
      path: 'src/templates/one.hbs',
      contents: new Buffer('one')
    });

    var router = new Router({
      methods: ['before', 'after']
    });

    router.use(function (file, next) {
      file.data = file.data || {};
      next();
    });

    router.before(/\./, function (file, next) {
      file.data.before = true;
      next();
    });

    router.after(/\./, function (file, next) {
      file.data.after = true;
      next();
    });

    var routes = gulpRoutes(router);
    var beforeStream = routes('before');
    var afterStream = routes('after');

    beforeStream
      .pipe(through.obj(function (file, enc, cb) {
        file.data.before.should.be.true;
        file.data.should.not.have.property('after');
        this.push(file);
        cb();
      }))
      .pipe(afterStream);

    afterStream.on('data', function (file) {
      file.data.before.should.be.true;
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

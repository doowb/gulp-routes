/*!
 * gulp-routes <https://github.com/assemble/gulp-routes>
 *
 * Copyright (c) 2014 Brian Woodward, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var through = require('through2');
var gutil = require('gulp-util');

/**
 * Create a routes plugin that runs middleware defined on a router.
 *
 * ```js
 * var gulpRoutes = require('gulp-routes');
 * var router = require('en-route');
 * var routes = gulpRoutes(router);
 * ```
 *
 * @name  gulpRoutes
 * @param  {Object}   `router` Instance of an [en-route] router
 * @return {Function} New function for creating a router stream.
 * @api public
 */

module.exports = function gulpRoutes(router) {
  router = router || (this && this.router);
  if (!router) {
    throw new gutil.PluginError('gulp-routes', new Error('Expected a valid router object.'));
  }

  /**
   * Create a router stream to run middleware for the specified method.
   *
   * ```js
   * gulp.src('*.hbs')
   *   .pipe(routes())
   *   .pipe(gulp.dest('_gh_pages/'));
   * ```
   *
   * @name  routes
   * @param  {String} `method` Method to run middleware for.
   * @return {Stream} Stream for piping files through
   * @api public
   */

  return function routes (method) {
    method = method || 'all';

    return through.obj(function (file, encoding, cb) {
      var stream = this;
      try {
        file.options = file.options || {};
        file.options.method = method;
        // run middleware
        router.handle(file, function (err) {
          if (err) {
            stream.emit('error', new gutil.PluginError('gulp-routes', err));
            cb();
          } else {
            stream.push(file);
            cb();
          }
        });
      } catch (ex) {
        stream.emit('error', new gutil.PluginError('gulp-routes - handle', ex));
        cb();
      }
    });
  };
};


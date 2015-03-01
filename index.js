/*!
 * gulp-routes <https://github.com/assemble/gulp-routes>
 *
 * Copyright (c) 2014-2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var through = require('through2');
var gutil = require('gulp-util');

/**
 * Expose `gulpRoutes` plugin.
 */

module.exports = gulpRoutes;

/**
 * Returns a plugin function for running middleware defined on a router.
 *
 * ```js
 * var router = require('en-route');
 * var routes = require('gulp-routes')(router);
 * ```
 *
 * @param  {Object} `router` Instance of an [en-route] router.
 * @return {Function} New function for creating a router stream.
 * @api public
 */

function gulpRoutes(router) {
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

  return function routes(method) {
    method = method || 'all';

    return through.obj(function (file, encoding, cb) {
      if (file.isNull() || !file.isBuffer()) {
        this.push(file);
        return cb();
      }

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
      } catch (err) {
        stream.emit('error', new gutil.PluginError('gulp-routes - handle', err));
        return cb();
      }
    });
  };
};


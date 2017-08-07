/*!
 * gulp-routes <https://github.com/assemble/gulp-routes>
 *
 * Copyright (c) 2014-2017, Brian Woodward.
 * Released under the MIT License.
 */

'use strict';

var PluginError = require('plugin-error');
var through = require('through2');

/**
 * The main export is a function that takes an instance of
 * [en-route][] and returns a [gulp][] plugin function.
 *
 * ```js
 * var routes = require('gulp-routes');
 * var Router = require('en-route').Router;
 * var router = new Router();
 *
 * // define middleware
 * router.all(/\.hbs/, function (file, next) {
 *   var str = file.contents.toString();
 *   // do anything to `file` that can be done
 *   // in a gulp plugin
 *   file.contents = new Buffer(str);
 *   next();
 * });
 *
 * // pass the router to `gulp-routes`
 * var route = routes(router);
 *
 * gulp.src('*.hbs')
 *   .pipe(route())
 *   .pipe(gulp.dest('_gh_pages/'));
 * ```
 * @param {Object} `enRoute` Instance of [en-route][].
 * @return {Function}
 * @api public
 */

function routes(enRoute) {
  enRoute = enRoute || (this && this.router);

  if (!enRoute) {
    throw error(new Error('expected an instance of en-route'));
  }

  /**
   * Create a router stream to run middleware for the specified method.
   *
   * ```js
   * gulp.src('*.hbs')
   *   .pipe(route('before'))
   *   .pipe(otherPlugin())
   *   .pipe(route('after'))
   *   .pipe(gulp.dest('dist/'));
   * ```
   * @name route
   * @param {String} `method` Method to run middleware.
   * @return {Stream} Returns a stream for piping files through.
   * @api public
   */

  return function(method) {
    method = method || 'all';

    return through.obj(function(file, enc, next) {
      if (file.isNull()) {
        next(null, file);
        return;
      }

      if (file.isStream()) {
        this.emit('error', error('streaming is not supported'));
        return;
      }

      file.data = file.data || {};
      file.options = file.options || {};
      file.options.method = method;
      var stream = this;

      try {
        enRoute.handle(file, function(err) {
          if (err) {
            stream.emit('error', error(err));
            return;
          }
          next(null, file);
        });
      } catch (err) {
        stream.emit('error', error(err));
        next();
        return;
      }
    });
  };
};

function error(err) {
  return new PluginError('gulp-routes', err, {showStack: true});
}

/**
 * Expose `routes`
 */

module.exports = routes;

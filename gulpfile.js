'use strict';

var gulp = require('gulp')
  , jshint = require('gulp-jshint')
  , uglify = require('gulp-uglify')
  , concat = require('gulp-concat')
  , recess = require('gulp-recess')
  , less = require('gulp-less')
  , path = require('path');

var SCRIPTS = 'scripts.js'
  , JAVASCRIPT_GLOB = '*.js'
  , JAVASCRIPT_GLOB_PATH = 'js/' + JAVASCRIPT_GLOB
  , LESS_GLOB_PATH = 'css/less/*.less';

gulp.task('less', function() {
  return gulp.src([
              '!css/less/variables.less'
            , LESS_GLOB_PATH
          ])
          .pipe(recess())
          .pipe(recess.reporter({
            fail: false,
            minimal: false
          }))
          .pipe(less({
            paths: [path.join(__dirname, 'css/less', 'includes')]
          }))
          .pipe(gulp.dest('css'));
});

gulp.task('lint', function() {
  return gulp.src([
              '!js/' + SCRIPTS
            , JAVASCRIPT_GLOB_PATH
            , JAVASCRIPT_GLOB
          ])
          .pipe(jshint())
          .pipe(jshint.reporter('default'));
});

gulp.task('concat', function() {
  return gulp.src([
              '!js/' + SCRIPTS
            , JAVASCRIPT_GLOB_PATH
          ])
          .pipe(concat(SCRIPTS))
          .pipe(uglify())
          .pipe(gulp.dest('js'));
});

gulp.task('default', ['less', 'lint', 'concat'], function() {
  gulp.watch([LESS_GLOB_PATH], ['less']);
  gulp.watch([JAVASCRIPT_GLOB_PATH, JAVASCRIPT_GLOB], ['lint', 'concat']);
});

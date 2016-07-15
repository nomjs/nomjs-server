'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const spawn = require('child_process').spawn;
const eslint = require('gulp-eslint');
const del = require('del');

gulp.task('clean', function() {
  return del(['dist/**']);
});

gulp.task('lint', function() {
  return gulp.src(['./src/**/*.js', './test/**/*.js', 'gulpfile.js'])
             .pipe(eslint())
             .pipe(eslint.format());
            //  .pipe(eslint.failAfterError());
});

gulp.task('build', ['clean'], function () {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .on('error', function(e) {
      console.error(e.stack);
      this.emit('end');
    })
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

// BEGIN watch stuff
let server;
gulp.task('serve', ['build'], function() {
  if (server) {
    server.kill();
  }
  server = spawn('node', ['--debug', 'app.js'], {
    stdio: 'inherit',
    cwd: 'dist',
    env: process.env
  });
  server.on('close', function (code) {
    if (code > 0) {
      console.error('Error detected, waiting for changes...');
    }
  });
});
process.on('exit', () => {
  if (server) {
    server.kill();
  }
});
gulp.task('watch', ['lint', 'serve'], function() {
  gulp.watch('src/**/*.js', {interval: 1000, mode: 'poll'}, ['lint', 'serve']);
  gulp.watch('.ravelrc', {interval: 1000, mode: 'poll'}, ['serve']);
});
// END watch stuff

gulp.task('default', ['watch']);

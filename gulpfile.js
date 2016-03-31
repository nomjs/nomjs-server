'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const spawn = require('child_process').spawn;
const del = require('del');

gulp.task('clean', function() {
  return del(['dist/**']);
});

gulp.task('build', ['clean'], function () {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});


let server;
gulp.task('serve', ['build'], function() {
  if (server) {
    server.kill();
  }
  server = spawn('node', ['--harmony-rest-parameters', 'app.js'], {
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
gulp.task('watch', ['serve'], function() {

  gulp.watch('src/**/*.js', ['serve']);
});
gulp.task('default', ['watch']);

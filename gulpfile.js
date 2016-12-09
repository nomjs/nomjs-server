'use strict';

// gulp
const gulp = require('gulp');

// gulp plugins
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const sourcemaps = require('gulp-sourcemaps');

// utils
const del = require('del');
const spawn = require('child_process').spawn;

const babelConfig = {
  'retainLines': true
};
if (process.execArgv.indexOf('--harmony_async_await') < 0) {
  console.log('Transpiling async/await...');
  babelConfig.plugins = ['transform-decorators-legacy', 'transform-async-to-generator'];
} else {
  console.log('Using native async/await...');
  babelConfig.plugins = ['transform-decorators-legacy'];
}

gulp.task('clean', function () {
  return del(['dist/**']);
});

gulp.task('lint', function () {
  return gulp.src(['./src/**/*.js', './test/**/*.js', 'gulpfile.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('build', ['clean'], function () {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel(babelConfig))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

// BEGIN watch stuff
let server;
gulp.task('serve', ['build'], function () {
  if (server) {
    server.kill();
  }
  server = spawn('node', ['--harmony_async_await', '--debug', 'app.js'], {
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
gulp.task('watch', ['lint', 'serve'], function () {
  gulp.watch('src/**/*.js', {interval: 1000, mode: 'poll'}, ['lint', 'serve']);
  gulp.watch('.ravelrc', {interval: 1000, mode: 'poll'}, ['serve']);
});
// END watch stuff

gulp.task('default', ['watch']);

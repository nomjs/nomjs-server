'use strict';

//gulp
const gulp = require('gulp');

// plugins
const plugins = require( 'gulp-load-plugins' )();

// utils
const del = require('del');
const spawn = require('child_process').spawn;

const TESTS = ['test-dist/**/*.spec.js'];

gulp.task('lint', function() {
  return gulp.src(['./src/**/*.js', './test/**/*.js', 'gulpfile.js'])
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
});

gulp.task('clean', function() {
  return del([
    'reports', 'dist', 'test-dist'
  ]);
});

gulp.task('transpile-src', ['clean', 'lint'], function() {
  return gulp.src('src/**/*.js')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.typescript({
      typescript: require('typescript'),
      allowJs: true,
      experimentalDecorators: true,
      // emitDecoratorMetadata: true,
      target: 'ES6'
    }))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('transpile-test', ['clean', 'lint'], function() {
  return gulp.src('test/**/*.js')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.typescript({
      typescript: require('typescript'),
      allowJs: true,
      experimentalDecorators: true,
      // emitDecoratorMetadata: true,
      target: 'ES6'
    }))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('test-dist'));
});

gulp.task('test', ['transpile-src', 'transpile-src'], function () {
  const env = plugins.env.set({
    LOG_LEVEL : 'debug'
  });
  return gulp.src(TESTS)
    .pipe(env)
    .pipe(plugins.mocha({
      reporter: 'spec',
      quiet:false,
      colors:true,
      timeout: 10000
    }))
    .pipe(env.reset);
});

gulp.task('build', ['clean', 'transpile-src']);

// BEGIN watch stuff
let server;
gulp.task('serve', ['build'], function () {
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

gulp.task('watch', ['lint', 'serve'], function () {
  gulp.watch('src/**/*.js', {interval: 1000, mode: 'poll'}, ['lint', 'serve']);
  gulp.watch('.ravelrc', {interval: 1000, mode: 'poll'}, ['serve']);
});
// END watch stuff

gulp.task('default', ['watch']);

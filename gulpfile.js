'use strict';

// gulp
const gulp = require('gulp');

// plugins
const plugins = require('gulp-load-plugins')();

// utils
const del = require('del');
const spawn = require('child_process').spawn;

const babelConfig = {
  'retainLines': true
};

if (process.execArgv.indexOf('test') >= 0) {
  console.log('Transpiling async/await...');
  babelConfig.plugins = ['transform-decorators-legacy', 'istanbul'];
} else {
  console.log('Using native async/await...');
  babelConfig.plugins = ['transform-decorators-legacy'];
}

gulp.task('clean', function () {
  return del([
    'reports', 'dist', 'test-dist'
  ]);
});

gulp.task('lint', function () {
  return gulp.src(['./src/**/*.js', './test/**/*.js', 'gulpfile.js'])
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
});

gulp.task('build', ['lint'], function () {
  return gulp.src('src/**/*.js')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel(babelConfig))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

// BEGIN watch stuff
let server;
gulp.task('serve', ['build'], function () {
  if (server) {
    server.kill();
  }
  server = spawn('node', ['--inspect', 'dist/app.js'], {
    stdio: 'inherit',
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
  gulp.watch('src/**/*.js', {
    interval: 1000,
    mode: 'poll'
  }, ['lint', 'serve']);
  gulp.watch('.ravelrc.json', {
    interval: 1000,
    mode: 'poll'
  }, ['serve']);
});

gulp.task('watch-code', ['lint', 'build'], function () {
  gulp.watch('src/**/*.js', {
    interval: 1000,
    mode: 'poll'
  }, ['lint', 'build']);
});
// END watch stuff

gulp.task('default', ['watch']);

gulp.task('dist', ['clean', 'build']);

const mockery = require('mockery');

const spawn = require('child_process').spawn;

describe('Test `npm auth` commands', function () {
  let nomAuth;

  before('setup nom before all tests', function () {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false
    });

    console.info('Firing up nom...');

    return new Promise((resolve) => {
      nomAuth = require('../../dist/app.js');
      nomAuth.start().then(function () {
        console.info('Nom up and running.');
        resolve();
      });
    });
  });

  it('validate that we can call adduser', function () {
    this.timeout(30000);
    console.info('Running \'npm adduser\'');

    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['--loglevel', 'verbose', '--registry', 'http://localhost:9080', 'adduser'], {silent: false});
      npm.stdout.on('data', (data) => {
        if (data.includes('Username:')) {
          console.log('Sending username.');
          npm.stdin.write('nomjs-bot\n');
        } else if (data.includes('Password:')) {
          console.log('Sending password.');
          npm.stdin.write('bo7bo7bo7bo7bo7\n');
        } else if (data.includes('Email:')) {
          console.log('Sending email address.');
          npm.stdin.write('bot@nomjs.com\n');
        }
      });

      npm.stderr.on('data', (data) => {
        if (data.includes('exit [ 1, true ]')) {
          npm.kill('SIGKILL');
          console.error('npm adduser failed.');
          reject(new Error('npm threw an error.'));
        } else if (data.includes('exit [ 0, true ]')) {
          console.info('npm adduser completed successfully.');
          npm.kill('SIGKILL');
          resolve();
        }
      });
    });
  });

  after('cleanup nom after all tests', function () {
    mockery.disable();
    console.info('Shutting down nom...');

    return new Promise((resolve) => {
      if (nomAuth) {
        nomAuth.close().then(function () {
          console.info('Nom shutdown.');
          resolve();
        });
      } else {
        console.info('No nom running, terminating.');
        resolve();
      }
    });
  });
});

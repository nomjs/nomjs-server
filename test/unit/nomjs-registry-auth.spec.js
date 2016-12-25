const log = require('intel');

const spawn = require('child_process').spawn;

describe('Test `npm auth` commands', function () {
  this.timeout('60000');

  let nom;

  before('setup nom before all tests', function () {
    log.info('Firing up nom...');
    nom = require('../../dist/app.js');

    return new Promise((resolve) => {
      nom.on('post init', () => {
        log.info('Nom up and running.');

        setTimeout(() => resolve(), 1000);
      });
      nom.start();
    });
  });

  it('validate that we can call adduser', function (done) {
    log.info('Running \'npm adduser\'');

    const npm = spawn('npm', ['--loglevel', 'verbose', '--registry', 'http://localhost:9080', 'adduser'], {silent: true});
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
        return done(new Error('npm threw an error.'));
      } else if (data.includes('exit [ 0, true ]')) {
        npm.kill('SIGKILL');
        return done();
      }
    });
  });

  after('cleanup nom after all tests', function () {
    log.info('Shutting down nom...');
    return new Promise((resolve) => {
      if (nom) {
        nom.on('end', () => {
          log.info('Nom shutdown.');

          setTimeout(() => resolve(), 1000);
        });
        nom.close();
      } else {
        resolve();
      }
    });
  });
});

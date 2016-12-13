const log = require('intel');

const chai = require('chai');
const expect = chai.expect;

const spawn = require('child_process').spawn;

describe('Test `npm install` commands', function () {
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
    npm.on('error', (err) => {
      console.log('Failed to start child process: ', err);
      done(err);
    });

    npm.on('exit', (code, signal) => {
      console.log(`child process exited with code ${code}`);
      expect(code).to.be(0);
      done();
    });

    npm.stdout.on('data', (data) => {
      // console.log(`>> ${data}`);
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
      console.log(`stderr: ${data}`);

      if (data.includes('verb exit [ 1, true ]')) {
        npm.kill('SIGKILL');
        done(new Error('npm threw an error.'));
      }
    });
  });

  after('cleanup nom after all tests', function (done) {
    log.info('Shutting down nom...');
    if (nom) {
      nom.on('end', () => {
        log.info('Nom shutdown.');
        done();
      });
      nom.close();
    }
  });
});

const chai = require('chai');
const expect = chai.expect;
const mockery = require('mockery');

const shell = require('shelljs');

describe('Test `npm install` commands', function () {
  let nomInstall;

  before('setup nom before all tests', function () {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false
    });

    console.info('Creating temporary directory for npm install');
    shell.mkdir('-p', 'test-node-modules');

    console.info('Firing up nom...');

    return new Promise((resolve) => {
      nomInstall = require('../../src/app.js');
      nomInstall.start().then(function () {
        console.info('Nom up and running.');
        resolve();
      });
    });
  });

  it('validate we can proxy a package', function () {
    return new Promise((resolve) => {
      console.info('Running \'npm install\'');
      shell.exec(`npm --loglevel=info --registry http://127.0.0.1:9080 --prefix ./test-node-modules install leftpad`, (code, stdout, stderr) => {
        expect(code).to.equal(0);
        resolve();
      });
    });
  });

  it('validate we can install a package', function () {
    return new Promise((resolve) => {
      console.info('Running \'npm install\'');
      shell.exec(`npm --loglevel=info --registry http://127.0.0.1:9080 --prefix ./test-node-modules install @mlaccetti/null`, (code, stdout, stderr) => {
        expect(code).to.equal(0);
        resolve();
      });
    });
  });

  after('cleanup nom after all tests', function () {
    mockery.disable();

    console.info('Removing temporary directory after npm install');
    shell.rm('-rf', 'test-node-modules');

    console.info('Shutting down nom...');
    return new Promise((resolve) => {
      if (nomInstall) {
        nomInstall.close().then(function () {
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

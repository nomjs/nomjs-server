const chai = require('chai');
const expect = chai.expect;

const shell = require('shelljs');

const purgeCache = require('./cleanup').purgeCache;

describe('Test `npm install` commands', function () {
  let nomInstall;

  before('setup nom before all tests', function () {
    console.info('Creating temporary directory for npm install');
    shell.mkdir('-p', 'test-node-modules');

    console.info('Firing up nom...');

    return new Promise((resolve) => {
      purgeCache('../../dist/app.js');
      nomInstall = require('../../dist/app.js');
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
    this.timeout(30000);

    console.info('Removing temporary directory after npm install');
    shell.rm('-rf', 'test-node-modules');

    console.info('Shutting down nom...');
    return new Promise((resolve) => {
      if (nomInstall) {
        nomInstall.close().then(function () {
          console.info('Nom shutdown.');
          nomInstall = undefined;
          setTimeout(function () { resolve(); }, 2500);
        });
      } else {
        console.info('No nom running, terminating.');
        nomInstall = undefined;
        resolve();
      }
    });
  });
});

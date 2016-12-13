const log = require('intel');

const chai = require('chai');
const expect = chai.expect;

const shell = require('shelljs');

describe('Test `npm install` commands', function () {
  this.timeout('60000');

  let nom;

  before('setup nom before all tests', function () {
    log.info('Creating temporary directory for npm install');
    shell.mkdir('-p', 'test-node-modules');

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

  it('validate we can proxy a package', function (done) {
    log.info('Running \'npm install\'');
    shell.exec(`npm --loglevel=info --registry http://127.0.0.1:9080 --prefix ./test-node-modules install leftpad`, function (code, stdout, stderr) {
      expect(code).to.equal(0);
      done();
    });
  });

  it('validate we can install a package', function (done) {
    log.info('Running \'npm install\'');
    shell.exec(`npm --loglevel=info --registry http://127.0.0.1:9080 --prefix ./test-node-modules install @mlaccetti/null`, function (code, stdout, stderr) {
      expect(code).to.equal(0);
      done();
    });
  });

  after('cleanup nom after all tests', function (done) {
    log.info('Removing temporary directory after npm install');
    shell.rm('-rf', 'test-node-modules');

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

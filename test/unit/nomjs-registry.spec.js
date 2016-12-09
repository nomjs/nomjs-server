const log = require('intel');

const chai = require('chai');
const expect = chai.expect;

const shell = require('shelljs');

describe('Test `npm install` commands', function () {
  this.timeout('60000');

  let nom;

  before('setup nom before all tests', function (done) {
    log.debug('Firing up nom...');
    nom = require('../../dist/app.js');
    nom.on('post init', () => {
      log.debug('Nom up and running.');
      done();
    });
    nom.start();
  });

  it('validate we can proxy a package', function (done) {
    console.log('Running \'npm install\'');
    shell.exec(`npm --loglevel=verbose --registry http://127.0.0.1:9080 install leftpad`, function (code, stdout, stderr) {
      expect(code).to.equal(0);
      done();
    });
  });

  it('validate we can install a package', function (done) {
    console.log('Running \'npm install\'');
    shell.exec(`npm --loglevel=verbose --registry http://127.0.0.1:9080 install @raveljs/ravel`, function (code, stdout, stderr) {
      expect(code).to.equal(0);
      done();
    });
  });

  after('cleanup nom after all tests', function (done) {
    log.debug('Shutting down nom...');
    if (nom) {
      nom.on('end', () => {
        log.debug('Nom shutdown.');
        done();
      });
      nom.close();
    }
  });
});

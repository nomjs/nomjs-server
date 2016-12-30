const chai = require('chai');
const expect = chai.expect;

const shell = require('shelljs');

describe('Test `npm install` commands', () => {
  let nom;

  before('setup nom before all tests', () => {
    console.info('Creating temporary directory for npm install');
    shell.mkdir('-p', 'test-node-modules');

    console.info('Firing up nom...');
    console.info(`Nom is: ${typeof nom}`);
    nom = require('../../dist/app.js');

    return new Promise((resolve) => {
      nom.start().then(() => {
        console.info('Nom up and running.');
        resolve();
      });
    });
  });

  it('validate we can proxy a package', () => {
    return new Promise((resolve) => {
      console.info('Running \'npm install\'');
      shell.exec(`npm --loglevel=info --registry http://127.0.0.1:9080 --prefix ./test-node-modules install leftpad`, (code, stdout, stderr) => {
        expect(code).to.equal(0);
        resolve();
      });
    });
  });

  it('validate we can install a package', () => {
    return new Promise((resolve) => {
      console.info('Running \'npm install\'');
      shell.exec(`npm --loglevel=info --registry http://127.0.0.1:9080 --prefix ./test-node-modules install @mlaccetti/null`, (code, stdout, stderr) => {
        expect(code).to.equal(0);
        resolve();
      });
    });
  });

  after('cleanup nom after all tests', () => {
    console.info('Removing temporary directory after npm install');
    shell.rm('-rf', 'test-node-modules');

    console.info('Shutting down nom...');
    return new Promise((resolve) => {
      if (nom) {
        nom.close().then(() => {
          console.info('Nom shutdown.');
          nom = undefined;
          resolve();
        });
      } else {
        console.info('No nom running, terminating.');
        nom = undefined;
        resolve();
      }
    });
  });
});

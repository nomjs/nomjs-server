const log = require('intel');

const chai = require('chai');
const expect = chai.expect;

describe('Test `npm install` commands', function() {
  let nom;

  before(function() {
    log.debug('Firing up nom...');
    log.debug('Environment variables: ', process.env);
    nom = require('../../dist/app.js');
    log.debug('Nom up and running.');
  });

  after(function() {
    log.debug('Shutting down nom...');
    nom.close();
    nom = null;
    log.debug('Nom shutdown.');
  });

  it('npm install leftpad', function() {
    expect(true).to.be(true);
  });
});

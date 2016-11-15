const log = require('intel');

const chai = require('chai');
const expect = chai.expect;

describe('Test `npm install` commands', function() {
  let nom;

  before(function() {
    log.debug('Firing up nom...');
    nom = require('../../src/app.js');
    log.debug('Nom up and running.');
  });

  after(function() {
    log.debug('Shutting down nom...');
    nom.close();
    nom = null;
    log.debug('Nom shutdown.');
  });

  it('npm install leftpad', function() {
    expect(true).toBe(true);
  });
});

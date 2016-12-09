'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

/**
 * Endpoints for npm team.
 */
class Packages extends Resource {
  constructor () {
    super('/-/org/:orgId/package');
  }
}

module.exports = Packages;

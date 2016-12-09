'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

/**
 * Endpoints for npm access [grant|revoke].
 */
class TeamPackages extends Resource {
  constructor () {
    super('/-/team/:orgId/:teamId/package');
  }
}

module.exports = TeamPackages;

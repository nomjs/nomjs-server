'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

/**
 * Endpoints for npm team.
 */
class Team extends Resource {
  constructor () {
    super('/-/team/:orgId/:teamId');
  }
}

module.exports = Team;

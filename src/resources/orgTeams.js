'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

/**
 * Endpoints for npm team.
 */
class OrgTeams extends Resource {
  constructor() {
    super('/-/org/:orgId/team');
  }
}

module.exports = OrgTeams;

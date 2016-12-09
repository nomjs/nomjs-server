'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

/**
 * Endpoints for npm access ls-collaborators.
 */
class PackageCollaborators extends Resource {
  constructor () {
    super('/-/package/:packageId/collaborators');
  }
}

module.exports = PackageCollaborators;

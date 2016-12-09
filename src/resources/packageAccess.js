'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

/**
 * Endpoints for npm access [public|restricted].
 */
class PackageAccess extends Resource {
  constructor () {
    super('/-/package/:packageId/access');
  }
}

module.exports = PackageAccess;

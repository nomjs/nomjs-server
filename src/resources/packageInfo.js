'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const before = Resource.before;

/**
 * package info, publishing, etc.
 */
@inject('packages')
class PackageInfoResource extends Resource {
  constructor(packages) {
    super('/');
    this.packages = packages;
  }

  /**
   * Examples:
   *  - https://registry.npmjs.org/ravel
   *  - https://registry.npmjs.org/@raveljs%2fravel
   */
  get(ctx) {
    return this.packages.info(ctx.params.id)
    .catch((err) => {
      switch(err.constructor.name) {
        case 'UnscopedPackageError':
          ctx.set('Location', `https://registry.npmjs.org/${ctx.params.id}`);
        default:
          // rethrow
          return Promise.reject(err);
      }
    });
  }
}

module.exports = PackageInfoResource;

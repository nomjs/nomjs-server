'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const before = Resource.before;

/**
 * package info, publishing, etc.
 */
@inject('packages', 'koa-better-body')
class PackageResource extends Resource {
  constructor(packages, bodyParser) {
    super('/');
    this.packages = packages;
    this.bodyParser = bodyParser();
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
        case 'UnsubmittedPackageError':
          ctx.set('Location', `https://registry.npmjs.org/${this.packages.encode(ctx.params.id)}`);
        default:
          // rethrow
          return Promise.reject(err);
      }
    });
  }

  @before('bodyParser')
  put(ctx) {
    console.log(`user attempting to publish ${ctx.params.id}`);
    console.dir(ctx.request.headers);
    console.dir(ctx.request.body);
    ctx.status = 500;
    ctx.body = {
      error: 'not implemented yet :)'
    };
  }
}

module.exports = PackageResource;

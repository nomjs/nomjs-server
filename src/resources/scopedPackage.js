'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const httpCodes = Ravel.httpCodes;
const before = Resource.before;

/**
 * package info, publishing, etc.
 */
@inject('packages')
class ScopedPackagesResource extends Resource {
  constructor(packages) {
    // TODO according to elephant, this might not be prefixed by /:scope. In which case, change to super();
    super('/:scope');
    this.packages = packages;
  }

  @before('respond')
  get(ctx) {
    // TODO implement package metadata
    //const packageName = ctx.params.id;
    ctx.status = httpCodes.NOT_FOUND;
  }

  @before('respond')
  put(ctx) {
    // TODO implement publish
    //const packageName = ctx.params.id;
    ctx.status = httpCodes.INTERNAL_SERVER_ERROR;
  }
}

module.exports = ScopedPackagesResource;

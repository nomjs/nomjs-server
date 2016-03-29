'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const httpCodes = Ravel.httpCodes;
const before = Resource.before;

/**
 * get package tarball with sha
 */
@inject('packages')
class ScopedPackagesBlobResource extends Resource {
  constructor(packages) {
    //TODO what is something?
    super('/:scope/:name/:something/:filename/');
    this.packages = packages;
  }

  @before('respond')
  get(ctx) {
    // TODO implement
    //const packageScope = ctx.params.scope;
    //const packageName = ctx.params.name;
    //const something = ctx.params.something;
    //const packageFilename = ctx.params.filename;
    //const packageSha = ctx.params.id;
    ctx.status = httpCodes.NOT_FOUND;
  }
}

module.exports = ScopedPackagesBlobResource;

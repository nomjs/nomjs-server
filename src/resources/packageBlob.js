'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;

@inject('packages')
class PackageBlobResource extends Resource {
  constructor (packages) {
    super('/:scope/:name/-/:scope/');
    this.packages = packages;
  }

  get (ctx) {
    const id = ctx.params.id;
    const version = id.substring(id.lastIndexOf('-') + 1, id.length - 4);
    return this.packages.shasum(`${ctx.params.scope}/${ctx.params.name}`, version)
    .then((sum) => {
      if (sum === ctx.request.get('If-None-Match')) {
        ctx.response.status = Ravel.httpCodes.NOT_MODIFIED;
      } else {
        return this.packages.getTarballFromDB(`${ctx.params.scope}/${ctx.params.id}`).then((data) => {
          ctx.response.attachment = ctx.params.id;
          ctx.response.status = 200;
          ctx.response.body = data.buffer;
          ctx.response.etag = sum;
        });
      }
    });
  }
}

module.exports = PackageBlobResource;

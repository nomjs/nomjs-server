'use strict';

const Resource = require('ravel').Resource;

/**
 * Totally not implemented (on purpose). Will respond with NOT IMPLEMENTED.
 */
class PingResource extends Resource {
  constructor() {
    //TODO what is something?
    super('/-/ping');
  }

  getAll(ctx) {
    //TODO what is ctx.params.write?
    ctx.status = 200;
    ctx.body = {};
  }
}

module.exports = PingResource;

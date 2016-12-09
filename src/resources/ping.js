'use strict';

const Resource = require('ravel').Resource;

/**
 * Responds to pings
 */
class PingResource extends Resource {
  constructor () {
    // TODO what is the dash?
    super('/-/ping');
  }

  getAll (ctx) {
    // TODO what is ctx.params.write?
    ctx.status = 200;
    ctx.body = {};
  }
}

module.exports = PingResource;

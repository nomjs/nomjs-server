'use strict';

const Resource = require('ravel').Resource;

/**
 * Totally not implemented (on purpose). Will respond with NOT IMPLEMENTED.
 */
class PackageBlobResource extends Resource {
  constructor() {
    //TODO what is something?
    super('/:name/:something/:filename/');
  }
}

module.exports = PackageBlobResource;

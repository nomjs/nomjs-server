'use strict';

const Resource = require('ravel').Resource;

class PackageBlobResource extends Resource {
  constructor() {
    //TODO what is something?
    super('/package/:scope/:name/:something/:filename/');
  }
}

module.exports = PackageBlobResource;

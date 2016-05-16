'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;

/**
 * We'll store stars differently than npm does.
 * We'll put them in the user document instead of in the
 * packages documents.
 */
@inject('rethink')
class Stars extends Module {
  constructor(rethink) {
    super();
    this.rethink = rethink;
  }

  getStars(userId) {
    return this.rethink.getStars(userId);
  }

  // star(token, packageId) {
  //
  // }
  //
  // unstar(token, packageId) {
  //
  // }
}

module.exports = Stars;

'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;

/**
 * Endpoint for npm stars.
 * npm star and unstar are handled by the Packages resource (unfortunately)
 */
@inject('stars')
class Stars extends Resource {
  constructor(stars) {
    super('/-/_view/starredByUser');
    this.stars = stars;
  }

  getAll(ctx) {
    const id = Number(ctx.query.key.replace(/"/g, ''));
    return this.stars.getStars(id).then((results) => {
      ctx.body = {
        rows: Object.keys(results).map((e) => {return {'value': e};})
      };
    });
  }
}

module.exports = Stars;

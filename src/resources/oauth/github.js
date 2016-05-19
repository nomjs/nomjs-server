'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

class GithubResource extends Resource {
  constructor() {
    super('/oauth/github');
  }

  getAll(ctx) {
    console.log('=== HANDLING GITHUB OAUTH ===');
    console.log(ctx.query);
    var promise = new Promise((resolve) => {
      resolve({test: 'it worked'});
    });
    return promise.then(data => {
      ctx.status = 200;
      ctx.body = data;
    });
  }
}

module.exports = GithubResource;

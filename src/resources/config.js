'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;

class ConfigResource extends Resource {
  constructor() {
    super('/-/config');
  }

  getAll(ctx) {
    let payload = {
      githubOauthClientId: this.params.get('github oauth client id')
    };
    var promise = new Promise((resolve) => {
      resolve(payload);
    });
    return promise.then(data => {
      ctx.status = 200;
      ctx.body = data;
    });
  }
}

module.exports = ConfigResource;

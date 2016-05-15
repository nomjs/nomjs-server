'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const before = Resource.before;

/**
 * Endpoint for npm whoami
 */
@inject('github-auth')
class WhoAmIResource extends Resource {
  constructor(github) {
    super('/-/whoami');
    this.githubProfile = github.profileMiddleware();
  }

  @before('githubProfile')
  getAll(ctx) {
    ctx.status = 200;
    ctx.response.body = {username: ctx.user.login};
  }
}

module.exports = WhoAmIResource;

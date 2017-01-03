'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const before = Resource.before;

-/**
 - * Endpoint for npm logout
 - *
 - * Since we don't store user credentials on our end,
 - * this is a no-op for now. If we ever do store
 - * credentials, then we should delete them here.
 - * Endpoint does verify the credentials before responding
 - * with 'ok' so that the client erases the login in
 - * ~/.npmrc
 - */
@inject('github-auth')
class LogoutResource extends Resource {
  constructor (github) {
    super('/-/user/token');
    this.githubProfile = github.profileMiddleware();
  }

  @before ('githubProfile')
  delete (ctx) {
    ctx.status = 200;
    ctx.response.body = {ok: true};
  }
}

module.exports = LogoutResource;

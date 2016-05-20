'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;

@inject('oauth-github')
class GithubResource extends Resource {
  constructor(oauthGithub) {
    super('/oauth/github');
    this.oauthGithub = oauthGithub;
  }

  getAll(ctx) {
    let sessionCode = ctx.query.code;
    let clientId = this.params.get('github oauth client id');
    let clientSecret = this.params.get('github oauth client secret');

    // temp wip, just return response for now to see how this is working
    // response is like:
    /**
     *
     {
        access_token: "someAlphanumeric",
        token_type: "bearer",
        scope: "user:email"
      }
     */
    // TODO save response.access_token in db, user table?
    return this.oauthGithub.login(sessionCode, clientId, clientSecret)
      .then((response) => {
        ctx.status = 200;
        ctx.body = {
          message: 'success',
          'token_type': response.token_type,
          scope: response.scope
        };
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }
}

module.exports = GithubResource;

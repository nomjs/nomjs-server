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
    // TODO should also include "state"
    let sessionCode = ctx.query.code;
    let clientId = this.params.get('github oauth client id');
    let clientSecret = this.params.get('github oauth client secret');

    // sample response:
    /**
     *
     {
        access_token: "someAlphanumeric",
        token_type: "bearer",
        scope: "user:email"
      }
     */
    return this.oauthGithub.login(sessionCode, clientId, clientSecret)
      .then((response) => {
        this.log.debug(`Received user access token with scope: ${response.scope}`);
        // TODO: Store response.access_token in session
        // TODO: Search web client url should be env var
        ctx.redirect(`http://localhost:9000`);
      })
      .catch(() => {
        ctx.redirect(`http://localhost:9000/#/loginfail`);
      });
  }
}

module.exports = GithubResource;

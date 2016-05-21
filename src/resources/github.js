'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;

@inject('oauth-github', 'jsonwebtoken')
class GithubResource extends Resource {
  constructor(oauthGithub, jwt) {
    super('/-/oauthgithub');
    this.oauthGithub = oauthGithub;
    this.jwt = jwt;
  }

  getAll(ctx) {
    let sessionCode = ctx.query.code;
    let state = ctx.query.state;
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
    return this.oauthGithub.login(sessionCode, state, clientId, clientSecret)
      .then((response) => {
        // experiment. obviously the jwt secret would be env var:
        let jwtSecret = '968133BC0BA1E94369467D4BC625CF7AA70DC47E5F3B8B16C4FAECBB76A57618';
        let jwtPayload = { githuOauthAccessToken: response.access_token };
        let jwtToken = this.jwt.sign(jwtPayload, jwtSecret);

        // experiment - pull it back out
        try {
          let decoded = this.jwt.verify(jwtToken, jwtSecret);
          this.log.debug(`jwt payload: ${JSON.stringify(decoded)}`);
        } catch(err) {
          this.log.error('Failed to verify jwt token', err);
        }

        // TODO: Search web client url should be env var
        ctx.redirect(`http://localhost:9000?jwt=${jwtToken}`);
      })
      .catch(() => {
        ctx.redirect(`http://localhost:9000/#/loginfail`);
      });
  }
}

module.exports = GithubResource;

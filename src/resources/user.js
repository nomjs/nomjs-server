'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const before = Resource.before;

/**
 * Endpoints for user login, etc.
 */
@inject('koa-better-body', 'github-auth', 'users')
class UserResource extends Resource {
  constructor (bodyParser, github, users) {
    // TODO what is the dash?
    super('/-/user/');
    this.bodyParser = bodyParser();
    this.github = github;
    this.users = users;
  }

  @before('bodyParser')
  put (ctx) {
    let promise, token;
    // we use the special username 'oauth' to switch into token mode (for 2fa users)
    if (ctx.request.fields.name === 'oauth') {
      // if in token mode, verify token has the correct scopes
      promise = this.github.verifyToken(
        ctx.request.fields.password
      );
    } else {
      // if in username/password mode, generate a token for nom with the correct scopes
      promise = this.github.generateToken(
        ctx.request.fields.name,
        ctx.request.fields.password
      );
    }
    // now get the user profile
    return promise.then((t) => {
      token = t;
      return this.github.getProfile(t);
    })
    // create a new user in our database (for storing stars, etc.)
    // We don't store the token credential.
    // Web application flow will be used to get a token for nom web UI: https://developer.github.com/v3/oauth/#web-application-flow
    .then((profile) => {
      return this.users.findOrCreateUser(profile, ctx.request.fields.email);
    })
    // respond
    .then(() => {
      ctx.status = Ravel.httpCodes.CREATED;
      ctx.response.body = {
        ok: true,
        id: 'org.couchdb.user:oauth',
        'token': token
      };
    }).catch((err) => {
      this.log.error(err.stack);
    });
  }
}

module.exports = UserResource;

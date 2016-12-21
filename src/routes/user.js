const Ravel = require('ravel');
const Routes = Ravel.Routes;

const inject = Ravel.inject;
const before = Routes.before;
const mapping = Routes.mapping;

/**
 * Endpoints for user login, etc.
 */
@inject('koa-convert', 'koa-better-body', 'github-auth', 'users')
class UserRoutes extends Routes {
  constructor (convert, bodyParser, github, users) {
    super('/-/user/');

    this.bodyParser = convert(bodyParser());
    this.github = github;
    this.users = users;

    this.log.info('User routes created.');
  }

  // bind this method to an endpoint and verb with @mapping. This one will become GET /app
  @mapping(Routes.PUT, '/org.couchdb.user::user')
  @before('bodyParser')
  async putHandler (ctx) {
    this.log.info('Logging in a user.');

    if (!ctx.request.fields.name) {
      return new Promise((resolve, reject) => {
        this.log.warn('No "name" field provided for authentication, faling.');
        ctx.status = Ravel.httpCodes.INTERNAL_SERVER_ERROR;
        reject('No "name" field provided for authentication.');
      });
    }

    let promise, token;
    // we use the special username 'oauth' to switch into token mode (for 2fa users)
    if (ctx.request.fields.name === 'oauth') {
      this.log.info('User is invoking oauth authentication.');
      // if in token mode, verify token has the correct scopes
      promise = this.github.verifyToken(
        ctx.request.fields.password
      );
    } else {
      // if in username/password mode, generate a token for nom with the correct scopes
      this.log.info('User is signing in with their username and password.');
      promise = this.github.generateToken(
        ctx.request.fields.name,
        ctx.request.fields.password
      );
    }
    // now get the user profile
    this.log.info('Retrieving user profile.');
    return promise.then((t) => {
      token = t;
      return this.github.getProfile(t);
    })
    // create a new user in our database (for storing stars, etc.)
    // We don't store the token credential.
    // Web application flow will be used to get a token for nom web UI: https://developer.github.com/v3/oauth/#web-application-flow
      .then((profile) => {
        this.log.debug('Creating user in nomjs-registry.');
        return this.users.findOrCreateUser(profile, ctx.request.fields.email);
      })
      // respond
      .then(() => {
        this.log.debug('User authenticated and signed in, returning information.');
        ctx.status = Ravel.httpCodes.CREATED;
        ctx.response.body = {
          ok: true,
          id: 'org.couchdb.user:oauth',
          'token': token
        };
      }).catch((err) => {
        this.log.error('Could not sign in user.', err);
        ctx.status = Ravel.httpCodes.INTERNAL_SERVER_ERROR;
      });
  }
}

// Export Routes class
module.exports = UserRoutes;

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
    super('/-/user');

    this.bodyParser = convert(bodyParser());
    this.github = github;
    this.githubProfile = github.profileMiddleware();
    this.users = users;

    this.log.info('User routes created.');
  }

  // bind this method to an endpoint and verb with @mapping. This one will become GET /app
  @mapping(Routes.PUT, '/org.couchdb.user::user')
  @before('bodyParser')
  async putHandler (ctx) {
    this.log.info('Logging in a user.');

    // FIXME we should look for all the required fields
    if (!ctx.request.fields.name) {
      this.log.warn('No "name" field provided for authentication, failing.');
      ctx.status = Ravel.httpCodes.INTERNAL_SERVER_ERROR;
      throw new Error('No "name" field provided for authentication.');
    }

    try {
      let token;
      // we use the special username 'oauth' to switch into token mode (for 2fa users)
      if (ctx.request.fields.name === 'oauth') {
        this.log.info('User is invoking oauth authentication.');
        // if in token mode, verify token has the correct scopes
        token = await this.github.verifyToken(ctx.request.fields.password);
      } else {
        // if in username/password mode, generate a token for nom with the correct scopes
        this.log.info('User is signing in with their username and password.');
        token = await this.github.generateToken(ctx.request.fields.name, ctx.request.fields.password);
      }

      console.log(`Token: ${token}`);

      // now get the user profile
      this.log.info('Retrieving user profile.');
      const profile = await this.github.getProfile(token);
      const emails = await this.github.getEmailForUser(token);
      const email = emails.find(e => e.verified === true && e.primary === true).email;
      if (!email) {
        this.log.error('No email found for user, cannot continue.');
        throw new Error('No email found for user, cannot continue.');
      }

      // create a new user in our database (for storing stars, etc.)
      // We don't store the token credential.
      // Web application flow will be used to get a token for nom web UI: https://developer.github.com/v3/oauth/#web-application-flow
      this.log.debug('Creating user in nomjs-registry.');
      await this.users.findOrCreateUser(profile, email);

      this.log.debug('User authenticated and signed in, returning information.');
      ctx.status = 201;
      ctx.body = {
        ok: true,
        id: 'org.couchdb.user:oauth',
        'token': token
      };
      this.log.debug('Status code: ', ctx.status);
    } catch (err) {
      this.log.error('Could not sign in user.', err);
      ctx.status = Ravel.httpCodes.INTERNAL_SERVER_ERROR;
    }
  }
}

// Export Routes class
module.exports = UserRoutes;

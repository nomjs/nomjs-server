'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;

class UserOrgError extends Ravel.Error {
  constructor (orgname) {
    super(`User is not in org ${orgname}`, Ravel.httpCodes.FORBIDDEN);
  }
}

class NonexistentRepoError extends Ravel.Error {
  constructor (org, name) {
    super(
      `GitHub repository ${org}/${name} does not exist.`,
      Ravel.httpCodes.NOT_FOUND
    );
  }
}

@inject('github', 'lodash')
class GitHubAuth extends Module {
  constructor (GitHubApi, lodash) {
    super();
    this.github = new GitHubApi({
      // debug: true,
      protocol: 'https',
      host: 'api.github.com', // should be api.github.com for GitHub
      timeout: 5000,
      headers: {
        'user-agent': 'nomjs-registry' // GitHub is happy with a unique user agent
      }
    });
    this.bearerRegex = /^(?:Bearer|token) (\w+)$/;
    this._ = lodash;
  }

  /**
   * Synchronous OAuth login. Only works for the next request.
   */
  tokenAuth (token) {
    this.log.debug('Setting up token auth.');
    this.github.authenticate({
      type: 'token',
      token: token
    });
  }

  /**
   * Verify that an OAuth token gives us access to the correct scopes
   *
   * @param {String} token
   * @return {Promise} resolves (with the token) if the token is valid and has the correct scopes, rejects otherwise
   */
  async verifyToken (token) {
    try {
      return await this.getOrgs(token);
    } catch (err) {
      throw new Error(
        'GitHub OAuth token supplied does not have the read:org scope.'
      );
    }
  }

  async _createToken (username, password, twoFactorCode) {
    const headers = {};
    if (twoFactorCode !== undefined) {
      headers['X-GitHub-OTP'] = twoFactorCode;
    }

    this.github.authenticate({
      type: 'basic',
      username: username,
      password: password
    });

    try {
      const res = await this.github.authorization.create({
        scopes: ['user:email', 'read:org'],
        note: 'nomjs-registry',
        note_url: 'https://github.com/nomjs/nomjs-registry.git', // eslint-disable-line camelcase
        headers: headers
      });
      this.log.debug('GitHub authentication token created.');
      return res.data.token;
    } catch (err) {
      this.log.error('Could not create GitHub authentication token.');
      throw err;
    }
  }

  /**
   * Generate an oauth token for a user. We can't use this code path for users
   * who have 2-factor auth turned on right now because there's no way to make
   * the npm login prompts collect the code.
   *
   * @param {String} username their GitHub username
   * @param {String} password their GitHub password
   * @param {String} twoFactorCode their current two-factor auth code.
   */
  async generateToken (username, password, twoFactorCode) {
    this.log.debug('Issuing authentication against GitHub.');
    this.github.authenticate({
      type: 'basic',
      username: username,
      password: password
    });

    this.log.debug('Authentication complete, getting list of existing authentications.');
    let auths;
    try {
      auths = await this.github.authorization.getAll({});
      if (!this._.isArray(auths.data)) {
        this.log.error('The list of GitHub authentications was not an array.');
        throw new Error('The list of GitHub authentications was not an array.');
      }
    } catch (err) {
      this.log.error('Could not retrieve list of  GitHub authentications.');
      throw err;
    }

    const existingAuth = auths.data.find(e => e.note === 'nomjs-registry');
    if (existingAuth) {
      this.log.info('Existing authentication found, removing it.');

      this.github.authenticate({
        type: 'basic',
        username: username,
        password: password
      });

      try {
        await this.github.authorization.delete({id: existingAuth.id});
      } catch (err) {
        this.log.error('Could not remove existing GitHub authentication.');
        throw err;
      }

      this.log.info('Creating new authentication to replace the one we just removed.');
      return this._createToken(username, password, twoFactorCode);
    } else {
      this.log.info('No existing authentication found, creating a new one.');
      return this._createToken(username, password, twoFactorCode);
    }
  }

  /**
   * Retrieves the user's profile
   * @param {String} token the OAuth token
   * @return {Promise} resolves with an Object of user info if the token works, rejects otherwise
   */
  async getProfile (token) {
    this.log.debug('Retrieving user profile from GitHub.');
    this.tokenAuth(token);

    try {
      const res = await this.github.users.get({});
      return res.data;
    } catch (err) {
      this.log.error('Could not retrieve user profile.', err.message);
      throw err;
    }
  }

  /**
   * Retrieves the user's email address(es)
   *
   * @param {String} token the OAuth token
   * @return {Array} List of all emails
   */
  async getEmailForUser (token) {
    this.log.debug('Retrieving user emails from GitHub.');
    this.tokenAuth(token);

    try {
      const res = await this.github.users.getEmails({});
      return res.data;
    } catch (err) {
      this.log.error('Could not retrieve user profile.', err.message);
      throw err;
    }
  }

  /**
   * @param {String} token the OAuth token
   * @param {String} scope the package scopee
   * @param {String} repoName the package repository name
   * @return {Promise} resolves if the user represented by token can administer the repository matching scope/repoName,
   *                   rejects otherwise
   */
  async canAdministerRepository (token, scope, repoName) {
    this.tokenAuth(token);
    try {
      const res = await this.github.repos.get({
        user: scope,
        repo: repoName
      });
      return !res || this._.has(res, 'data.permissions.admin') || !res.data.permissions.admin;
    } catch (err) {
      if (err.code === 404) {
        throw new NonexistentRepoError(scope, repoName);
      } else {
        throw err;
      }
    }
  }

  /**
   * @param {String} token the OAuth token
   * @param {String} scope the package scopee
   * @param {String} repoName the package repository name
   * @return {Promise} resolves if the user represented by token can push to the repository matching scope/repoName,
   *                   rejects otherwise
   */
  async canPushToRepository (token, scope, repoName) {
    this.tokenAuth(token);
    try {
      const result = await this.github.repos.get({
        user: scope,
        repo: repoName
      });
      return !result || !this._.has(result, 'permissions.push') || !result.permissions.push;
    } catch (err) {
      if (err.code === 404) {
        throw new NonexistentRepoError(scope, repoName);
      } else {
        throw err;
      }
    }
  }

  /**
   * Middleware for populating koa context with user profile
   * based on an auth token.
   */
  profileMiddleware () {
    const self = this;
    return function (next) {
      const token = this.headers.authorization.match(this.bearerRegex);
      if (token) {
        this.token = token[1];
        self.getProfile(token[1]).then(profile => {
          this.user = profile;
        });
        return next();
      } else {
        throw new self.ApplicationError.IllegalValueError(
          'GitHub OAuth bearer token not found in request headers.'
        );
      }
    };
  }

  /**
   * Retrieve a list of orgs the user represented by this token belongs to
   * @param {String} token the OAuth token
   * @return {Promise} resolves with an Array[Object] of orgs if the token works, rejects otherwise
   */
  async getOrgs (token) {
    this.tokenAuth(token);
    try {
      const result = await this.github.user.getOrgs({});
      return result.data;
    } catch (err) {
      throw err;
    }
  }

  /**
   * @param {String} token the OAuth token
   * @return {Promise} resolves if the given user is in the specified org, rejects otherwise
   */
  async userInOrg (token, orgName) {
    try {
      const orgs = await this.getOrgs(token);
      return orgs.filter(o => o.login === orgName).length === 1;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = GitHubAuth;

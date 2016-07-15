'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;

class UserOrgError extends Ravel.Error {
  constructor(orgname) {
    super(`User is not in org ${orgname}`, Ravel.httpCodes.FORBIDDEN);
  }
}

class NonexistentRepoError extends Ravel.Error {
  constructor(org, name) {
    super(`GitHub repository ${org}/${name} does not exist.`, Ravel.httpCodes.NOT_FOUND);
  }
}

@inject('github')
class GitHubAuth extends Module {
  constructor(GitHubApi) {
    super();
    this.github = new GitHubApi({
      // required
      version: '3.0.0',
      // optional
      // debug: true,
      protocol: 'https',
      host: 'api.github.com', // should be api.github.com for GitHub
      timeout: 5000,
      headers: {
        'user-agent': 'nomjs-registry' // GitHub is happy with a unique user agent
      }
    });
    this.bearerRegex = /^(?:Bearer|token) (\w+)$/;
  }

  /**
   * Synchronous OAuth login. Only works for the next request.
   */
  tokenAuth(token) {
    this.github.authenticate({
      type: 'oauth',
      token: token
    });
  }

  /**
   * Verify that an OAuth token gives us access to the correct scopes
   *
   * @param {String} token
   * @return {Promise} resolves (with the token) if the token is valid and has the correct scopes, rejects otherwise
   */
  verifyToken(token) {
    return this.getOrgs(token)
    .then(() => {
      return token;
    })
    .catch(() => {
      return new Error('GitHub OAuth token supplied does not have the read:org scope.');
    });
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
  generateToken(username, password, twoFactorCode) {
    const headers = {};
    if (twoFactorCode !== undefined) {
      headers['X-GitHub-OTP'] = twoFactorCode;
    }
    return new Promise((resolve, reject) => {
      this.github.authenticate({
        type: 'basic',
        username: username,
        password: password
      });
      this.github.authorization.create({
        scopes: ['read:org'],
        note: 'nomjs-registry',
        note_url: 'https://github.com/nomjs/nomjs-registry.git', //eslint-disable-line camelcase
        headers: headers
      }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.token);
        }
      });
    });
  }

  /**
   * Retrieves the user's profile
   * @param {String} token the OAuth token
   * @return {Promise} resolves with an Object of user info if the token works, rejects otherwise
   */
  getProfile(token) {
    return new Promise((resolve, reject) => {
      this.tokenAuth(token);
      this.github.user.get({}, (err, result) => {
        if (err) {reject(err);} else {resolve(result);}
      });
    });
  }

  /**
   * @param {String} token the OAuth token
   * @param {String} scope the package scopee
   * @param {String} repoName the package repository name
   * @return {Promise} resolves if the user represented by token can administer the repository matching scope/repoName,
   *                   rejects otherwise
   */
  canAdministerRepository(token, scope, repoName) {
    return new Promise((resolve, reject) => {
      this.tokenAuth(token);
      this.github.repos.get({user: scope, repo: repoName}, (err, result) => {
        if (err || !result || !result.permissions.admin) { // { admin: true, push: true, pull: true }
          if (err.code === 404) {
            reject(new NonexistentRepoError(scope,repoName));
          } else {
            reject(err);
          }
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * @param {String} token the OAuth token
   * @param {String} scope the package scopee
   * @param {String} repoName the package repository name
   * @return {Promise} resolves if the user represented by token can push to the repository matching scope/repoName,
   *                   rejects otherwise
   */
  canPushToRepository(token, scope, repoName) {
    return new Promise((resolve, reject) => {
      this.tokenAuth(token);
      this.github.repos.get({user: scope, repo: repoName}, (err, result) => {
        if (err || !result || !result.permissions.push) { // { admin: true, push: true, pull: true }
          if (err.code === 404) {
            reject(new NonexistentRepoError(scope,repoName));
          } else {
            reject(err);
          }
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Middleware for populating koa context with user profile
   * based on an auth token.
   */
  profileMiddleware() {
    const self = this;
    return function*(next) {
      const token = this.headers.authorization.match(this.bearerRegex);
      if (token) {
        this.token = token[1];
        yield self.getProfile(token[1]).then((profile) => {
          this.user = profile;
        });
        yield next;
      } else {
        throw new self.ApplicationError.IllegalValueError('GitHub OAuth bearer token not found in request headers.');
      }
    };
  }

  /**
   * Retrieve a list of orgs the user represented by this token belongs to
   * @param {String} token the OAuth token
   * @return {Promise} resolves with an Array[Object] of orgs if the token works, rejects otherwise
   */
  getOrgs(token) {
    return new Promise((resolve, reject) => {
      this.tokenAuth(token);
      this.github.user.getOrgs({}, (err, result) => {
        if (err) {reject(err);} else {resolve(result);}
      });
    });
  }

  /**
   * @param {String} token the OAuth token
   * @return {Promise} resolves if the given user is in the specified org, rejects otherwise
   */
  userInOrg(token, orgName) {
    return this.getOrgs(token).then((orgs) => {
      if (orgs.filter(o => o.login === orgName).length === 1) {
        return Promise.resolve();
      } else {
        return Promise.reject(new UserOrgError(orgName));
      }
    });
  }
}

module.exports = GitHubAuth;

'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const before = Resource.before;

/**
 * package info, publishing, etc.
 */
@inject('koa-better-body', 'packages', 'github-auth')
class PackageResource extends Resource {
  constructor(bodyParser, packages, github) {
    super('/');
    this.bodyParser = bodyParser();
    this.packages = packages;
    this.github = github;
    this.githubProfile = github.profileMiddleware();
  }

  /**
   * Examples:
   *  - https://registry.npmjs.org/ravel
   *  - https://registry.npmjs.org/@raveljs%2fravel
   */
  get(ctx) {
    return this.packages.info(ctx.params.id)
    .catch((err) => {
      switch(err.constructor.name) {
        case 'UnscopedPackageError':
        case 'UnsubmittedPackageError':
          ctx.set('Location', `https://registry.npmjs.org/${this.packages.encode(ctx.params.id)}`);
        default:
          // rethrow
          return Promise.reject(err);
      }
    });
  }

  @before('githubProfile', 'bodyParser')
  put(ctx) {
    const attachments = (c) => c.request.fields._attachments;
    if (
      ctx.request.fields &&
      typeof attachments(ctx) === 'object' &&
      Object.keys(attachments(ctx)).length === 1 &&
      attachments(ctx)[Object.keys(attachments(ctx))[0]].length <= this.params.get('max package size bytes')
    ) {
      this.log.info(`user ${ctx.user.login} publishing ${ctx.params.id}`);
      const org = this.packages.getScope(ctx.params.id);

      let promise = Promise.resolve();
      // if scope is an org, make sure user is in org, otherwise publish under user scope
      if (org !== ctx.user.login) {
        promise = this.github.userInOrg(ctx.token, org);
      }

      // TODO actually publish package
      return promise.then(() => {
        return this.packages.publish(ctx.request.fields);
      });
    } else {
      throw new this.ApplicationError.IllegalValueError(
        `Package tarball missing or is too big (max size = ${this.params.get('max package size bytes')})`);
    }
  }
}

module.exports = PackageResource;

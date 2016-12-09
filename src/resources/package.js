'use strict';

const Ravel = require('ravel');
const Resource = Ravel.Resource;
const inject = Ravel.inject;
const before = Resource.before;

/**
 * package info, publishing, starring, unstarring etc.
 */
@inject('koa-better-body', 'packages', 'stars', 'github-auth')
class PackageResource extends Resource {
  constructor (bodyParser, packages, stars, github) {
    super('/');
    this.bodyParser = bodyParser();
    this.packages = packages;
    this.stars = stars;
    this.github = github;
    this.githubProfile = github.profileMiddleware();
  }

  /**
   * Examples:
   *  - https://registry.npmjs.org/ravel
   *  - https://registry.npmjs.org/@raveljs%2fravel
   *
   * If a package is in npm and nom should proxy rather than return a redirect:
   *  - https://registry.npmjs.org/ravel?npmproxy=true
   */
  get (ctx) {
    // just redirect if the user asks to search npm directly
    if (ctx.query.proxynpm) {
      ctx.set('Location', `https://registry.npmjs.org/${this.packages.encode(ctx.params.id)}`);
    } else {
      return this.packages.info(ctx.params.id, ctx.query)
        .then((packageInfo) => {
          ctx.status = 200;
          ctx.body = packageInfo;
        })
        .catch((err) => {
          switch (err.constructor.name) {
            case 'UnscopedPackageError':
            case 'UnsubmittedPackageError':
              ctx.set('Location', `https://registry.npmjs.org/${this.packages.encode(ctx.params.id)}`);
              break;
            default:
              // rethrow
              return Promise.reject(err);
          }
        });
    }
  }

  /**
   * Publish a package (either a new package, or a new version of an existing package)
   * also unfortunately used for starring packages :( Stupid npm...
   */
  @before('githubProfile', 'bodyParser')
  put (ctx) {
    if (Object.keys(ctx.request.fields).length === 1 && ctx.request.fields.users) {
      if (Object.keys(ctx.request.fields.users).length > 0) {
        this.log.info(`user ${ctx.user.login} starring ${ctx.params.id}`);
        return this.stars.star(ctx.user.id, ctx.params.id);
      } else {
        this.log.info(`user ${ctx.user.login} unstarring ${ctx.params.id}`);
        return this.stars.unstar(ctx.user.id, ctx.params.id);
      }
    } else {
      this.log.info(`user ${ctx.user.login} publishing ${ctx.params.id}`);
      const packageName = this.packages.getPackageName(ctx.params.id);

      let promise = Promise.resolve();
      // if scope is an org, make sure user is in org, otherwise publish under user scope
      if (packageName.scope !== ctx.user.login) {
        promise = this.github.userInOrg(ctx.token, packageName.scope);
      }

      return promise.then(() => {
        // check if user can admin corresponding repository
        return this.github.canAdministerRepository(ctx.token, packageName.scope, packageName.name);
      }).then(() => {
        // actually publish package
        return this.packages.publish(ctx.user, ctx.request.fields);
      }).then(() => {
        ctx.status = 201;
        ctx.body = {ok: true};
      });
    }
  }
}

module.exports = PackageResource;

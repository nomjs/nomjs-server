'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;

class UnscopedPackageError extends Ravel.Error {
  constructor(msg) {
    super(msg, constructor, 308);
  }
}

class UnsubmittedPackageError extends Ravel.Error {
  constructor(msg) {
    super(msg, constructor, 307);
  }
}

/**
 * Logic for listing, retrieving, publishing packages
 */
@inject('rethink')
class Packages extends Module {

  constructor(rethink) {
    super();
    this.rethink = rethink;
  }

  isScoped(id) {
    // TODO should we check for the slash as well? This is faster, but maybe not sufficient.
    return id[0] === '@';
  }

  getScope(id) {
    const scope = id.match(/^@([\w\-]+)\/([\w\-]+)$/);
    if (scope === null) {
      throw new UnscopedPackageError(`Package id ${id} is not a scoped package`);
    }
    return scope[1];
  }

  _retrieveInfo(id) { //eslint-disable-line no-unused-vars
    return this.rethink.getPackage(id)
      .catch((err) => {
        if (err instanceof this.ApplicationError.NotFound) {
          // create new package;
          return Promise.reject(new UnsubmittedPackageError({
            error: `nom can't find the package you're looking for.\nPlease encourage the developer to submit it to nom!`
          }));
        } else {
          return Promise.reject(err);
        }
      });
  }

  /**
   * Re-encode a package id to use urlencoded format for slashes
   */
  encode(id) {
    return id.replace('/','%2f');
  }

  /**
   * Retrieve package information based on a package name
   * @param id {String} the package name (such as @raveljs/ravel).
   * @return {Promise} resolves if the package is in the nom registry, rejects otherwise.
   */
  info(id) {
    this.log.info(`client asked for info on: ${id}`);

    if (this.isScoped(id)) {
      return this._retrieveInfo(id);
    } else {
      return Promise.reject(new UnscopedPackageError({
        error: 'nom does not permit unscoped packages'
      }));
    }
  }

  getLatestPackageInfo(npmPackageInfo) {
    try {
      const semver = npmPackageInfo['dist-tags'].latest;
      if (semver === null) { throw new Error();}
      return npmPackageInfo.versions[semver];
    } catch (err) {
      throw new Error('no version with tag \'latest\'');
    }
  }

  /**
   * Creates a new package and publishes tarball to blob store
   * @param {Object} publisher a github user profile representing the "publisher"
   * @param {Object} args a package object direct from the npm client, containing:
   *   @param {String} name
   *   @param {String} description
   *   @param {Object} dist-tags
   *   @param {Object} versions
   *   @param {String} readme
   *   @param {Object} _attachments
   * @return {Promise} resolves when package publish is creation, rejects with any errors
   */
  createPackage(publisher, args) {
    console.dir(publisher);
    try {
      const pInfo = Object.create(null);
      const currentTime = new Date();
      const latest = this.getLatestPackageInfo(args);
      // copy over things we need
      pInfo.name = args.name;
      if (args.description) { pInfo.description = args.description; }
      pInfo['dist-tags'] = args['dist-tags'];
      pInfo.versions = args.versions;
      if (args.readme) { pInfo.readme = args.readme; }
      pInfo.maintainers = [{
        id: publisher.id,
        name: publisher.login,
        email: publisher.email,
        profile: publisher.html_url
      }]; // TODO Concat others on update .
      pInfo.time = {
        modified: currentTime.toISOString(),
        created: currentTime.toISOString()
      };
      pInfo.time[latest.version] = currentTime.toISOString();
      if (latest.contributors) { pInfo.contributors = latest.contributors; }
      if (latest.author) { pInfo.author = latest.author; }
      if (latest.readmeFilename) { pInfo.readmeFilename = latest.readmeFilename; }
      if (latest.homepage) { pInfo.homepage = latest.homepage; }
      if (latest.repository) { pInfo.repository = latest.repository; }
      if (latest.bugs) { pInfo.bugs = latest.bugs; }
      if (latest.license) { pInfo.license = latest.license; }
      if (latest.keywords) { pInfo.keywords = latest.keywords; }
      pInfo.users = {}; // TODO what is this?
      // TODO reject attachment if size is too big, but check all of them - not just the first one
      return this.rethink.createPackage(pInfo);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Create or update package info and publish tarballs to blob store
   * @param {Object} publisher a github user profile representing the "publisher"
   * @param {Object} args:
   *   @param {String} name
   *   @param {String} description
   *   @param {Object} dist-tags
   *   @param {Object} versions
   *   @param {String} readme
   *   @param {Object} _attachments
   * @return {Promise} resolves when package publish is complete, rejects with any errors
   */
  publish(publisher,  args) {
    return this.rethink.getPackage(args.name)
      .then(() => {
        // TODO implement package document updating
        console.log('TODO implement package document updating');
      })
      .catch((err) => {
        if (err instanceof this.ApplicationError.NotFound) {
          // create new package;
          return this.createPackage(publisher, args);
        } else {
          return Promise.reject(err);
        }
      });
    // TODO reject attachment if size is too big, but check all of them - not just the first one
  }
}

module.exports = Packages;

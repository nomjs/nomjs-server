# nomjs-registry

> nom is not npm

## Priorities

- Fully open-source, npm-compatible repository implementation
- 100% scoped packages. Non-scoped packages will never be supported or permitted
- No support for user unpublishing (this is not the same as immutability, since it doesn't address litigation). Most reputable package repositories do *not* support unpublishing.
- Zero name reuse. A package with name @org/package will always refer to that package, or result in an **HTTP 451 Unavailable For Legal Reasons**.
  - Broken builds (with a proper response code) are the *correct* and *expected* result of a missing package - not the silent and unintended installation of a different package under the same name, regardless of version tag.
- Backwards compatibility. To maximize adoption, this registry should be compatible with the existing npm client (at least `npm install`), and `package.json`
- Courting and/or forming an open, transparent governance body to administer the repository
- Courting major/popular npm package authors to publish their packages on `nom` (in addition to `npm`, or exclusively if they so wish)

## Anti-priorities

1. Distributed infrastructure for package storage
  - In the absence of anonymity, this puts the legal burden on package publishers. We believe the registry and its governing body should stand between package publishers and legal action.
  - Anonymity for a package repository is both difficult to implement properly, and not desirable. Things are not so far-gone that the community needs a Silk Road for packages.
1. Immutability
  - If a legitimate legal request for package takedown is encountered, the administering body should be able to address it. In the absence of this ability, entities might attack package authors instead. The package name will never be reused, and requests from the npm client will result in **HTTP 451 Unavailable For Legal Reasons**
1. New CLI client development
  - While we would like to add package signatures and validation at some point, it is not an initial priority to alter the npm cli client (or create a new one). There are simply bigger fish to fry in the short-term.
1. Authorization infrastructure
  - Rather than creating a complex registration and accounts system, and since `nom` is meant for open-source packages, we'll rely on GitHub orgs/usernames for namespacing/scoping.

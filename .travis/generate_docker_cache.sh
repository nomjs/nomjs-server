#!/usr/bin/env bash

numfiles=(.travis/docker/*)
numfiles=${#numfiles[@]}

echo "Number of files: $numfiles"

if [ $numfiles -le 2 ]
then
  echo "Backing up Docker images."
  mkdir -p .travis/docker
  docker export rethinkdb | gzip -c > .travis/docker/rethinkdb_export.tgz
  docker export redis | gzip -c > .travis/docker/redis.tgz
else
  echo "Docker images already backed up, skipping."
fi

#!/usr/bin/env bash

if [ -d "docker" ]
then
  for image in `ls docker`
  do
    docker import docker/${image}
  done
fi

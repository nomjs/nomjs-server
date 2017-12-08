#!/usr/bin/env bash

numfiles=(.travis/docker/*)
numfiles=${#numfiles[@]}

echo "Number of files: $numfiles"

if [ $numfiles -ge 2 ]
then
  echo "Rehydrating all Docker images."
  for image in `ls .travis/docker`
  do
    echo "Rehydrating ${image}"
    docker import .travis/docker/${image}
  done
else
    echo "No Docker images to rehydrate."
fi

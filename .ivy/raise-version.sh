#!/bin/bash
set -e

yarn install --ignore-scripts
yarn lerna version ${1/-SNAPSHOT/} --no-git-tag-version --no-push --ignore-scripts --exact --yes
yarn install --ignore-scripts

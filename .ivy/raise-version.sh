#!/bin/bash
set -e

npm install
npx lerna version ${1/-SNAPSHOT/} --no-git-tag-version --no-push --ignore-scripts --exact --yes
npm install

echo "update ivy version in maven.ts"
oldVersion="IVY_ENGINE_VERSION = '[0-9]+.[0-9]+.[0-9]+'"
newVersion="IVY_ENGINE_VERSION = '${1/-SNAPSHOT/}'"
sed -i -E "s|${oldVersion}|${newVersion}|" extension/src/engine/build/maven.ts

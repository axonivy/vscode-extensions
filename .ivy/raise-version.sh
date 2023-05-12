#!/bin/bash

yarn install --ignore-scripts
yarn lerna version ${1/-SNAPSHOT/} --no-git-tag-version --no-push --ignore-scripts --exact --yes
sed -i '' "s/\(\"@axonivy[^\"]*\"\): \"[^\"]*\"/\1: \"~${1}-next\"/" vscode-extensions/*/*/package.json
yarn update:axonivy:next
yarn install --ignore-scripts

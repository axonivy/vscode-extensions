#!/bin/bash
yarn install --ignore-scripts
yarn lerna version ${1/-SNAPSHOT/} --no-git-tag-version --no-push --ignore-scripts --exact --yes
sed -i -E "s/(\"@axonivy[^\"]*\"): \"[^\"]*\"/\1: \"~${1/SNAPSHOT/next}\"/" vscode-extensions/*/*/package.json
yarn update:axonivy:next
if [$2 -eq 0]
then
  yarn install --ignore-scripts
fi

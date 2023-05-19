#!/bin/bash
sed -i -E "s/(\"@axonivy[^\"]*\"): \"[^\"]*\"/\1: \"~${1/SNAPSHOT/next}\"/" vscode-extensions/*/*/package.json
yarn update:axonivy:next
yarn install --ignore-scripts

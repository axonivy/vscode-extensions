#!/bin/bash
sed -i -E "s/(\"@axonivy[^\"]*\"): \"[^\"]*\"/\1: \"~${1/SNAPSHOT/next}\"/" webviews/*/package.json
yarn update:axonivy:next
yarn install --ignore-scripts

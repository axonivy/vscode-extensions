#!/bin/bash

if [[ -z "${IMAGE_TAG}" ]]; then
  IMAGE_TAG="axonivy/playwright-jdk21:local"
fi

if [[ -z "${PUSH}" ]]; then
  PUSH="--load"
fi

docker buildx create --name mymultibuilder --driver docker-container --bootstrap --use
echo "building image ${IMAGE_TAG}"

docker buildx build --no-cache --pull --tag ${IMAGE_TAG} ${PUSH} -f build/integration/base/Dockerfile .

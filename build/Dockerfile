FROM mcr.microsoft.com/playwright:next
# FROM node:18-buster

RUN addgroup --gid 2000 build && adduser --uid 2000 --gid 2000 --disabled-password --gecos "" build

RUN apt-get update && apt-get install -y libx11-dev libxkbfile-dev libsecret-1-dev zip xvfb

USER build

ENV DISPLAY :99

COPY docker-entrypoint.sh /opt/bin/
RUN chmod +x /opt/bin/docker-entrypoint.sh

ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

# FROM node:18-buster

# RUN apt-get update && apt-get install -y libasound2 libgbm1 libgtk-3-0 libnss3 xvfb libgconf-2-4

# FROM mcr.microsoft.com/devcontainers/typescript-node:18-bookworm

# RUN apt-get update && apt-get install -y libsecret-1-dev libxkbfile-dev libkrb5-dev xvfb

# USER node

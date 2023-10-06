# FROM mcr.microsoft.com/playwright:next

# RUN apt-get update && apt-get install -y libx11-dev libxkbfile-dev libsecret-1-dev zip xvfb

# ENV DISPLAY :99

# COPY docker-entrypoint.sh /opt/bin/
# RUN chmod +x /opt/bin/docker-entrypoint.sh

# ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

# FROM node:18-buster

# RUN apt-get update && apt-get install -y libasound2 libgbm1 libgtk-3-0 libnss3 xvfb libgconf-2-4

FROM mcr.microsoft.com/devcontainers/typescript-node:18-bookworm

RUN apt-get update && apt-get install -y libsecret-1-dev libxkbfile-dev libkrb5-dev

USER node
RUN echo 'export DISPLAY="${DISPLAY:-:1}"' | tee -a ~/.bashrc >> ~/.zshrc

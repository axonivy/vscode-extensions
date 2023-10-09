FROM node:18.17.1-bookworm as build-stage

WORKDIR /home/vscode
COPY . .

RUN yarn install --ignore-scripts && yarn clean
RUN yarn build:production
RUN yarn download:engine

FROM mcr.microsoft.com/playwright:focal

WORKDIR /home/vscode
COPY --from=build-stage /home/vscode /home/vscode

ENV DISPLAY :99

COPY docker-entrypoint.sh /opt/bin/
RUN chmod +x /opt/bin/docker-entrypoint.sh

ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

FROM node:18 as build

WORKDIR /home/vscode
COPY . .

RUN yarn

FROM mcr.microsoft.com/playwright:focal

WORKDIR /home/vscode
COPY --from=build /home/vscode /home/vscode

ENV DISPLAY :99
RUN Xvfb :99 -screen 0 1920x1080x24 -dpi 24 -listen tcp -noreset -ac +extension RANDR & yarn test:playwright

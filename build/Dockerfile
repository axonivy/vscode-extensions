FROM mcr.microsoft.com/playwright:next
# FROM node:18-buster

# RUN addgroup --gid 2000 build && adduser --uid 2000 --gid 2000 --disabled-password --gecos "" build

# RUN apt-get update && apt-get install -y libx11-dev libxkbfile-dev libsecret-1-dev zip xvfb


# COPY docker-entrypoint.sh /opt/bin/
# RUN chmod +x /opt/bin/docker-entrypoint.sh

# USER build
# ENV DISPLAY :99
ENV DEBUG=pw:browser*

# ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

# FROM node:18-buster

# RUN apt-get update && apt-get install -y libasound2 libgbm1 libgtk-3-0 libnss3 xvfb libgconf-2-4

# FROM mcr.microsoft.com/devcontainers/typescript-node:18-bookworm

# RUN apt-get update && apt-get install -y libsecret-1-dev libxkbfile-dev libkrb5-dev xvfb

# USER node




# FROM node:18 AS node

# FROM node AS headless
# RUN apt-get update && \
#     apt-get install -y xvfb \
#     libgbm1 \
#     libxss1 \
#     libnss3 \
#     libgtk-3-dev \
#     libasound2-dev \
#     unzip \
#     dos2unix \
#     && rm -rf /var/lib/apt/lists/*

#     # libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

# FROM headless AS final
# ADD docker-entrypoint.sh /docker-entrypoint.sh
# RUN chmod +x /docker-entrypoint.sh
# RUN dos2unix /docker-entrypoint.sh
# ENV ELECTRON_ENABLE_STACK_DUMPING=true
# ENV ELECTRON_ENABLE_LOGGING=true
# ENV DEBUG=pw:browser*
# ENV DISPLAY :99
# ENTRYPOINT [ "/docker-entrypoint.sh" ]
# FROM mcr.microsoft.com/playwright:next

# RUN apt-get update && apt-get install -y libx11-dev libxkbfile-dev libsecret-1-dev zip xvfb

# ENV DISPLAY :99

# COPY docker-entrypoint.sh /opt/bin/
# RUN chmod +x /opt/bin/docker-entrypoint.sh

# ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

FROM node:18-buster

RUN apt-get update && apt-get install -y libasound2 libgbm1 libgtk-3-0 libnss3 xvfb

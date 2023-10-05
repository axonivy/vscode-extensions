FROM mcr.microsoft.com/playwright:next

RUN addgroup --gid 1000 build && adduser --uid 1000 --gid 1000 --disabled-password --gecos "" build

RUN apt-get update && apt-get install -y libx11-dev libxkbfile-dev libsecret-1-dev zip xvfb

ENV DISPLAY :99

COPY docker-entrypoint.sh /opt/bin/
RUN chmod +x /opt/bin/docker-entrypoint.sh

ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

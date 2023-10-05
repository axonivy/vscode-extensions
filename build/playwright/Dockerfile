FROM node:18 AS node

FROM node AS headless
RUN apt-get update && \
    apt-get install -y xvfb \
    libgbm1 \
    libxss1 \
    libnss3 \
    libgtk-3-dev \
    libasound2-dev \
    unzip \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

FROM headless AS final
ENV ELECTRON_ENABLE_STACK_DUMPING=true
ENV ELECTRON_ENABLE_LOGGING=true

COPY docker-entrypoint.sh /opt/bin/
RUN chmod +x /opt/bin/docker-entrypoint.sh

ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

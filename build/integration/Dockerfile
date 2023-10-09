FROM mcr.microsoft.com/playwright:v1.33.0-jammy

RUN apt-get update && apt-get install -y wget apt-transport-https && \
    wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | tee /usr/share/keyrings/adoptium.asc && \
    echo "deb [signed-by=/usr/share/keyrings/adoptium.asc] https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list && \
    apt-get update && apt-get install -y temurin-17-jdk && \
    apt-get purge -y wget && \
    apt-get clean

# ENV DISPLAY :99

# ENV DEBUG pw:browser*

# COPY docker-entrypoint.sh /opt/bin/
# RUN chmod +x /opt/bin/docker-entrypoint.sh

# ENTRYPOINT ["/opt/bin/docker-entrypoint.sh"]

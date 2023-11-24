FROM gitpod/openvscode-server:latest

ENV OPENVSCODE_SERVER_ROOT="/home/.openvscode-server"
ENV OPENVSCODE="${OPENVSCODE_SERVER_ROOT}/bin/openvscode-server"
ENV IVY_EXTENSION="ivy-extension-11.2.0.vsix"

ENV OPENVSCODE_SERVER_HOST="openvscode"

COPY extension/${IVY_EXTENSION} /tmp/exts/
COPY playwright/tests/workspaces/ /home/workspace

SHELL ["/bin/bash", "-c"]
RUN ${OPENVSCODE} --install-builtin-extension /tmp/exts/${IVY_EXTENSION}

USER root
RUN chown -R openvscode-server /home/workspace

RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | tee /usr/share/keyrings/adoptium.asc && \
    echo "deb [signed-by=/usr/share/keyrings/adoptium.asc] https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list && \
    apt update && \
    apt install -y temurin-17-jdk && \
    apt install -y maven && \
    rm -rf /var/lib/apt/lists/*
USER openvscode-server

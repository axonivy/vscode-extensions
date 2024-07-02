FROM docker-registry.ivyteam.io/axonivy/openvscode-server-jdk17:dev

ENV IVY_EXTENSION="designer-11.vsix"
ARG IVY_HOME=/usr/lib/axonivy-engine

COPY extension/${IVY_EXTENSION} /tmp/exts/
COPY playwright/tests/workspaces/ /home/workspace
COPY extension/AxonIvyEngine/ ${IVY_HOME}

SHELL ["/bin/bash", "-c"]
RUN ${OPENVSCODE} --install-builtin-extension /tmp/exts/${IVY_EXTENSION}

USER root
RUN chown -R openvscode-server /home/workspace
RUN mkdir ${IVY_HOME}/logs

ENTRYPOINT [ "/bin/sh", "-c", "/usr/lib/axonivy-engine/bin/AxonIvyEngine startdaemon & exec ${OPENVSCODE_SERVER_ROOT}/bin/openvscode-server --host 0.0.0.0 --without-connection-token \"${@}\"", "--" ]

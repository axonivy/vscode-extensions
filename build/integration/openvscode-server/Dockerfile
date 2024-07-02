FROM docker-registry.ivyteam.io/axonivy/openvscode-server-jdk17:dev

ENV IVY_EXTENSION="designer-11.vsix"

COPY extension/${IVY_EXTENSION} /tmp/exts/
COPY playwright/tests/workspaces/ /home/workspace
COPY extension/AxonIvyEngine/ /usr/lib/axonivy-engine

SHELL ["/bin/bash", "-c"]
RUN ${OPENVSCODE} --install-builtin-extension /tmp/exts/${IVY_EXTENSION}

USER root
RUN chown -R openvscode-server /home/workspace

ENTRYPOINT [ "/bin/sh", "-c", "nohup /usr/lib/axonivy-engine/bin/AxonIvyEngine & exec ${OPENVSCODE_SERVER_ROOT}/bin/openvscode-server --host 0.0.0.0 --without-connection-token \"${@}\"", "--" ]

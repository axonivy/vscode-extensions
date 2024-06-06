FROM docker-registry.ivyteam.io/axonivy/openvscode-server-jdk17:dev

ENV IVY_EXTENSION="designer-11.vsix"

COPY extension/${IVY_EXTENSION} /tmp/exts/
COPY playwright/tests/workspaces/ /home/workspace

SHELL ["/bin/bash", "-c"]
RUN ${OPENVSCODE} --install-builtin-extension /tmp/exts/${IVY_EXTENSION}

USER root
RUN chown -R openvscode-server /home/workspace

USER openvscode-server

#!/bin/bash

RUN Xvfb :99 -screen 0 1920x1080x24 -dpi 24 -listen tcp -noreset -ac +extension RANDR & exec "$@"

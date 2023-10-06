#!/bin/bash

Xvfb :99 -screen 0 1360x1020x24 +extension RANDR & exec "$@"

# Xvfb $DISPLAY -screen 0 1920x1080x24 &

# echo "Starting Xvfb"
# Xvfb :99 -ac &
# sleep 2

# export DISPLAY=:99
# echo "Executing command $@"

# exec "$@"

#!/bin/bash

# Xvfb :99 -screen 0 1360x1020x24 -dpi 24 -listen tcp -noreset -ac +extension RANDR & exec "$@"

echo "Starting Xvfb"
Xvfb :99 -ac &
sleep 2

export DISPLAY=:99
echo "Executing command $@"

exec "$@"

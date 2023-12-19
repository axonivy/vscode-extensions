## Axon Ivy Designer for Visual Studio Code

The Axon Ivy Designer is a state of the art process modelling tool that enables you to turn your business processes into real and fully functional web applications.

## Setup

This extension can be used locally or in a [Dev Container](https://code.visualstudio.com/docs/devcontainers/containers). Different installations are required for the two options, see below.

### Local ussage

Install Java SE 17 and Maven 3.9

Download the [Axon Ivy Dev Engine](https://dev.axonivy.com/permalink/dev/axonivy-engine-slim.zip), unzip it and configure the `Engine Directory` under settings, see:
![Engine Directory Settings](extension/assets/readme/engine-directory-setting.png)

### Dev Container

Install the [Dev Container extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers). You also need to install Docker.

Run `Axon Ivy: Add Dev Container` to add the required configuration files for the Dev Container to your workspace. Then run `Dev Containers: Rebuild and Reopen in Container`, see:
![Launch Dev Container](extension/assets/readme/launch-container.gif)

## Getting started

Add an initial Axon Ivy Project as follows:
![Add Project](extension/assets/readme/add-project.gif)

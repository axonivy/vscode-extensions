## Axon Ivy Designer for Visual Studio Code

The Axon Ivy Designer is a state of the art process modelling tool that enables you to turn your business processes into real and fully functional web applications.

## Setup

This extension can be used locally or in a [Dev Container](https://code.visualstudio.com/docs/devcontainers/containers). Different installations are required for the two options, see below.
[Or simply start by cloning our demo-projects repository into your GitHub codespace.](https://github.com/codespaces/new/axonivy-market/demo-projects)

### Local ussage

Make sure that **Java SE 17** and **Maven 3** are installed on your machine.

After installing the extension, you have to define the **Engine Directory** setting. Proceed as follows:

1. Run **Axon Ivy: Download Dev Engine** command in VS Code
2. Unzip the downloaded Engine on your machine
3. Run **Axon Ivy: Set Engine Directory Configuration** command in VS Code
4. Choose the directory where your unpacked engine is located

See how it works:
![Set Engine Directory](extension/assets/readme/engine-dir.gif)

### Dev Container

Make sure that [Dev Container extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) and **Docker** are installed.

1. Run **Axon Ivy: Add Dev Container** command to add the required configuration files for the Dev Container to your workspace.
2. Run **Dev Containers: Rebuild and Reopen in Container** command

See how it works:
![Launch Dev Container](extension/assets/readme/launch-container.gif)

## Getting started

### From scratch

- Add Axon Ivy Project
- Create Business Process and extend it
- Add Html Dialog
- Preview Process

See how it works:
![Add Project](extension/assets/readme/add-project.gif)

### With existing project

When you open an existing project for the first time, e.g. [demo-projects](https://github.com/axonivy-market/demo-projects), initially run **Build and Deploy all Projects** command.

See how it works:
![Build and Deploy](extension/assets/readme/build-and-deploy.gif)

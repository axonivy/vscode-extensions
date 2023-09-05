# VS Code extensions

The available VS Code extensions can be found under `/vscode-extensions`.

## Available Scripts

`yarn`: install all packages and build the extensions

`yarn download:engine https://link.to.engine.that.you.want/Engine_Slim_All_x64.zip`: download and unpack the engine you define

`yarn package`: package the extensions as .vsix files

## VS Code dev env

Simply run the `Start VSCode Extension` launch config.

## Connect to another Ivy Engine

If you do not want to use the embedded engine as backend, you can define an alternative under `VS Code Settings / Axon Ivy Engine`.

Simply uncheck `Run Embedded Engine` and set `Engine Url` you want to use.

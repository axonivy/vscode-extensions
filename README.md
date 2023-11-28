# VS Code extension

The available VS Code extension can be found under `/extension`.

## Build & Package

- `yarn`: install all packages
- `yarn build`: build the extension and webviews
- `yarn download:engine`: download and unpack the latest master engine
- `yarn package`: package the extension as .vsix file

## VS Code dev env

Simply run the `Start VSCode Extension` launch config.

## Connect to another Ivy Engine

If you do not want to use the embedded engine as backend, you can define an alternative under `VS Code Settings / Axon Ivy`.

Simply uncheck `Run Embedded Engine` and set `Engine Url` you want to use.

## Integration Tests

Playwright tests can be executed against VSCode Insiders or openvscode-server

### VSCode Insiders

- `yarn test:playwright:download:vscode`: download latest VSCode Insiders
- `yarn test:playwright`: run all tests against electron app

### openvscode-server

Build the openvscode-server docker image using the Dockerfile located under `/build/integration/openvscode-server/server/Dockerfile`, e.g.:

- `docker build -t openvscodeserver -f build/integration/openvscode-server/server/Dockerfile .`.

Then run the container using

- `docker run -it --init -p 3000:3000 -p 8080:8080 -p 8081:8081 -p 8082:8082  openvscodeserver --disable-workspace-trust`

Finally

- `yarn test:playwright:browser`: run all tests against openvscode-server in browser

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/axonivy/vscode-extensions)

# VS Code extension

The available VS Code extension can be found under `/extension`.

## Build & Package

- `npm install`: install all packages
- `npm run build`: build the extension and webviews
- `npm run download:engine`: download and unpack the latest master engine
- `npm run package`: package the extension as .vsix file

## Debugging the extension

Make sure that all packages are installed, i.e. run `npm install`. Building and packaging are not needed. Simply start the `Run Extension` launch config, which will also activate the watch mode.

## Connect to another Ivy Engine

If you do not want to use the embedded engine as backend, you can define an alternative under `VS Code Settings / Axon Ivy`. Simply uncheck `Engine: Run By Extension` and set `Engine: Url` you want to use.

## Integration Tests
sdasd
Playwright tests can be executed against VSCode Insiders or openvscode-server

### VS Code Insiders

Make sure that an Engine is running on localhost:8080. It will be used as the backend for testing.

- `npm run test:playwright:download:vscode`: download latest VSCode Insiders
- `npm run test:playwright`: run all tests against electron app

### openvscode-server

Build the openvscode-server docker image using the Dockerfile located under `/build/integration/openvscode-server/server/Dockerfile`, e.g.:

- `docker build -t openvscodeserver -f build/integration/openvscode-server/Dockerfile .`.

Then run the container using

- `docker run -it --init -p 3000:3000 -p 8080:8080 -p 8081:8081 -p 8082:8082  openvscodeserver --disable-workspace-trust`

Finally

- `npm run test:playwright:browser`: run all tests against openvscode-server in browser

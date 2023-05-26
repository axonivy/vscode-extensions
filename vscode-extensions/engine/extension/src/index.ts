import { ChildProcess, execFile } from 'child_process';
import Os from 'os';
import * as vscode from 'vscode';

let child: ChildProcess;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const runEmbeddedEngine = vscode.workspace.getConfiguration().get('runEmbeddedEngine');
  if (runEmbeddedEngine) {
    await startEmbeddedEngine(context.extensionUri);
    return;
  }
  process.env['ENGINE_HOST'] = vscode.workspace.getConfiguration().get('engineHost');
  process.env['ENGINE_PORT'] = vscode.workspace.getConfiguration().get('enginePort');
  process.env['APP_NAME'] = vscode.workspace.getConfiguration().get('appName');
}

async function startEmbeddedEngine(extensionUri: vscode.Uri) {
  process.env['ENGINE_HOST'] = 'localhost';
  process.env['APP_NAME'] = 'web-ide';
  const outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');
  outputChannel.show();
  const executable = Os.platform() === 'win32' ? 'AxonIvyEngineC.exe' : 'AxonIvyEngine';
  var engineLauncherScriptPath = vscode.Uri.joinPath(extensionUri, 'engine', 'AxonIvyEngine', 'bin', executable).fsPath;
  const env = {
    env: { ...process.env, JAVA_OPTS_IVY_SYSTEM: '-Divy.enable.lsp=true -Dglsp.test.mode=true -Divy.engine.testheadless=true' }
  };

  child = execFile(engineLauncherScriptPath, env);
  child.on('error', function (error: any) {
    outputChannel.append(error);
    throw new Error(error);
  });
  return new Promise(resolve => {
    child.stdout?.on('data', function (data: any) {
      const output = data.toString();
      if (output && output.startsWith('Go to http')) {
        const port = output.split(':')[2].split('/')[0];
        process.env['ENGINE_PORT'] = port;
        resolve(port);
      }
      outputChannel.append(output);
    });
  });
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
  if (child) {
    child.kill('SIGKILL');
  }
}

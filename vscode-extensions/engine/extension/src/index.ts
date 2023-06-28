import { ChildProcess, execFile } from 'child_process';
import Os from 'os';
import * as vscode from 'vscode';

let child: ChildProcess;

const webSocketAddressKey = 'WEB_SOCKET_ADDRESS';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const runEmbeddedEngine = vscode.workspace.getConfiguration().get('runEmbeddedEngine');
  process.env['APP_NAME'] = vscode.workspace.getConfiguration().get('appName');
  if (runEmbeddedEngine) {
    await startEmbeddedEngine(context.extensionUri);
    return;
  }
  const engineUrl = vscode.workspace.getConfiguration().get('engineUrl') as string;
  process.env[webSocketAddressKey] = toWebSocketAddress(engineUrl);
}

async function startEmbeddedEngine(extensionUri: vscode.Uri) {
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
        const engineUrl = output.split('Go to ')[1].split(' to see')[0];
        process.env[webSocketAddressKey] = toWebSocketAddress(engineUrl);
        resolve(engineUrl);
      }
      outputChannel.append(output);
    });
  });
}

function toWebSocketAddress(engineUrl: string): string {
  if (engineUrl.startsWith('https://')) {
    return engineUrl.replace('https', 'wss');
  }
  return engineUrl.replace('http', 'ws');
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
  if (child) {
    child.kill('SIGINT');
  }
}

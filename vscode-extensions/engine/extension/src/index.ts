import { ChildProcess, execFile } from 'child_process';
import Os from 'os';
import * as vscode from 'vscode';
import { Commands, executeCommand } from '@axonivy/vscode-base';

let child: ChildProcess;

const webSocketAddressKey = 'WEB_SOCKET_ADDRESS';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(vscode.commands.registerCommand(Commands.ENGINE_RESOLVE_URL, () => resolveEngineUrl(context.extensionUri)));
  const hasIvyProjects = await executeCommand(Commands.PROJECT_EXPLORER_HAS_IVY_PROJECTS);
  if (hasIvyProjects) {
    await resolveEngineUrl(context.extensionUri);
  }
}

async function resolveEngineUrl(extensionUri: vscode.Uri): Promise<void> {
  if (child) {
    return;
  }
  const runEmbeddedEngine = vscode.workspace.getConfiguration().get('runEmbeddedEngine');
  let engineUrl = vscode.workspace.getConfiguration().get('engineUrl') as string;
  if (runEmbeddedEngine) {
    engineUrl = await startEmbeddedEngine(extensionUri);
  }
  process.env[webSocketAddressKey] = toWebSocketAddress(engineUrl);
}

async function startEmbeddedEngine(extensionUri: vscode.Uri): Promise<string> {
  const outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');
  outputChannel.show();
  const executable = Os.platform() === 'win32' ? 'AxonIvyEngineC.exe' : 'AxonIvyEngine';
  var engineLauncherScriptPath = vscode.Uri.joinPath(extensionUri, 'engine', 'AxonIvyEngine', 'bin', executable).fsPath;
  const env = {
    env: { ...process.env, JAVA_OPTS_IVY_SYSTEM: '-Divy.enable.lsp=true -Dglsp.test.mode=true -Divy.engine.testheadless=true' }
  };
  console.log('Start ' + engineLauncherScriptPath);
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
    console.log("Send 'shutdown' to Axon Ivy Engine");
    const shutdown = new Promise<void>(resolve => {
      child.on('exit', function (code: number) {
        console.log('Axon Ivy Engine has shutdown with exit code ' + code);
        resolve();
      });
    });
    if (Os.platform() === 'win32') {
      child.stdin?.write('shutdown\n');
    } else {
      child.kill('SIGINT');
    }
    console.log('Waiting for shutdown of Axon Ivy Engine');
    await shutdown;
    console.log('End waiting for Axon Ivy Engine shutdown');
  }
}

import { ChildProcess, execFile } from 'child_process';
import Os from 'os';
import * as vscode from 'vscode';

let child: ChildProcess;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const executable = Os.platform() === 'win32' ? 'AxonIvyEngineC.exe' : 'AxonIvyEngine';
  console.log('***** executable file: ' + executable);
  console.log('***** os platform: ' + Os.platform());
  var engineLauncherScriptPath = vscode.Uri.joinPath(context.extensionUri, 'engine', 'AxonIvyEngine', 'bin', executable).path;
  const env = {
    env: { ...process.env, JAVA_OPTS_IVY_SYSTEM: '-Divy.enable.lsp=true -Dglsp.test.mode=true' }
  };
  child = execFile(engineLauncherScriptPath, env, (error, stdout, stderr) => {
    if (error) {
      console.error('stderr', stderr);
    }
  });

  const outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');
  outputChannel.show();
  await new Promise(resolve => {
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
  child.kill();
}

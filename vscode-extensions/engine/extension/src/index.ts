import * as vscode from 'vscode';
import { ChildProcess, execFile } from 'child_process';

let child: ChildProcess;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');
  outputChannel.show();

  var engineLauncherScriptPath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'AxonIvyEngine', 'bin', 'launcher.sh').path;
  child = execFile(engineLauncherScriptPath, ['-Divy.enable.lsp=true', '-Dglsp.test.mode=true']);

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

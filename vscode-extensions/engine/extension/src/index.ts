import * as vscode from 'vscode';
import { execFile } from 'child_process';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  var engineLauncherScriptPath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'AxonIvyEngine', 'bin', 'launcher.sh').path;

  var child = execFile(engineLauncherScriptPath, []);

  await new Promise(resolve => {
    child.stdout?.on('data', function (data: any) {
      const output = data.toString();
      if (output && output.startsWith('Go to http')) {
        const port = output.split(':')[2].split('/')[0];
        process.env['ENGINE_PORT'] = port;
        resolve(port);
      }
      console.log(output);
    });
  });
}

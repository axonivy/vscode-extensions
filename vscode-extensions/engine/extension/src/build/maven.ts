import * as vscode from 'vscode';
import { exec } from 'child_process';

export class MavenBuilder {
  private readonly outputChannel: vscode.OutputChannel;
  private readonly buildCommand: string;
  constructor(extensionUri: vscode.Uri) {
    const engineDir = vscode.Uri.joinPath(extensionUri, 'engine', 'AxonIvyEngine').fsPath;
    this.buildCommand = `mvn install -Dmaven.test.skip=true -Divy.engine.directory=${engineDir}`;
    this.outputChannel = vscode.window.createOutputChannel('Ivy Maven');
  }

  public async buildProject(ivyProjectDir: string): Promise<void> {
    this.outputChannel.show();
    const childProcess = exec(this.buildCommand, { cwd: ivyProjectDir });
    childProcess.on('error', (error: any) => {
      this.outputChannel.append(error);
      throw new Error(error);
    });
    childProcess.stdout?.on('data', (data: any) => {
      const output = data.toString();
      this.outputChannel.append(output);
    });
    return new Promise(resolve => {
      childProcess.on('exit', () => {
        resolve();
      });
    });
  }
}

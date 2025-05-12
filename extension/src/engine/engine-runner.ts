import * as vscode from 'vscode';
import { ChildProcess, execFile } from 'child_process';
import Os from 'os';
import { config } from '../base/configurations';
import { downloadEngine } from './download';

export class EngineRunner {
  private childProcess: ChildProcess;
  private _engineUrl: string;
  private outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');
  private engineDirectory: Promise<vscode.Uri | undefined>;

  constructor(readonly globalStorageEngineDirectory: vscode.Uri) {
    this.engineDirectory = this.downloadEngineIfNeeded();
  }

  public async start(): Promise<void> {
    this.outputChannel.show(true);
    this.childProcess = await this.launchEngineChildProcess();
    this.childProcess.on('error', (error: Error) => {
      this.outputChannel.append(error.message);
      throw error;
    });
    return new Promise<void>(resolve => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.childProcess.stdout?.on('data', (data: any) => {
        const output = data.toString() as string;
        if (output && output.startsWith('Go to http')) {
          this._engineUrl = output.split('Go to ')[1].split(' to see')[0];
          resolve();
        }
        this.outputChannel.append(output);
      });
    });
  }

  private async launchEngineChildProcess(): Promise<ChildProcess> {
    const executable = Os.platform() === 'win32' ? 'AxonIvyEngineC.exe' : 'AxonIvyEngine';
    const engineDirectory = await this.engineDirectory;
    if (!engineDirectory) {
      throw new Error('No valid Axon Ivy Engine directory available.');
    }
    const engineLauncherScriptPath = vscode.Uri.joinPath(engineDirectory, 'bin', executable).fsPath;
    const env = {
      env: { ...process.env, JAVA_OPTS_IVY_SYSTEM: '-Ddev.mode=true -Divy.engine.testheadless=true' }
    };
    this.outputChannel.appendLine('Start ' + engineLauncherScriptPath);
    return execFile(engineLauncherScriptPath, env);
  }

  public async reloadEngine() {
    await this.stop();
    await this.deleteEngineDirectory();
    await this.downloadEngineIfNeeded();
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  }

  private async downloadEngineIfNeeded() {
    if (!config.engineRunByExtension()) {
      return;
    }
    const engineDirectory = config.engineDirectory();
    if (engineDirectory) {
      return vscode.Uri.file(engineDirectory);
    }
    const url = await this.resolveEngineDownloadUrl();
    const options = { location: vscode.ProgressLocation.Window, cancellable: false, title: `Downloading Axon Ivy Engine from ${url}` };
    return await vscode.window.withProgress(options, async () => {
      try {
        await downloadEngine(url, this.globalStorageEngineDirectory.fsPath);
        return this.globalStorageEngineDirectory;
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to downlaod Axon Ivy Engine from ${url} Error: ${error}`);
        this.deleteEngineDirectory();
        return;
      }
    });
  }

  private async resolveEngineDownloadUrl() {
    const url = config.engineDownloadUrl();
    if (url) {
      return url;
    }
    const message = 'No Axon Ivy Engine download URL configured. Please set it in the settings.';
    vscode.window.showErrorMessage(message);
    throw new Error(message);
  }

  private deleteEngineDirectory() {
    return vscode.workspace.fs.delete(this.globalStorageEngineDirectory, { recursive: true, useTrash: false });
  }

  public async stop() {
    if (!this.childProcess) {
      return;
    }
    console.log("Send 'shutdown' to Axon Ivy Engine");
    const shutdown = new Promise<void>(resolve => {
      this.childProcess.on('exit', function (code: number) {
        console.log('Axon Ivy Engine has shutdown with exit code ' + code);
        resolve();
      });
    });
    if (Os.platform() === 'win32') {
      this.childProcess.stdin?.write('shutdown\n');
    } else {
      this.childProcess.kill('SIGINT');
    }
    console.log('Waiting for shutdown of Axon Ivy Engine');
    await shutdown;
    console.log('End waiting for Axon Ivy Engine shutdown');
  }

  public get engineUrl(): string {
    return this._engineUrl;
  }
}

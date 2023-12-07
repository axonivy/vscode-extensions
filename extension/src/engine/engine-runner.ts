import * as vscode from 'vscode';
import { ChildProcess, execFile } from 'child_process';
import Os from 'os';
import { config } from '../base/configurations';

export class EngineRunner {
  private childProcess: ChildProcess;
  private _engineUrl: string;
  private outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');

  constructor(private readonly embeddedEngineDirectory: vscode.Uri) {}

  public async start(): Promise<void> {
    this.outputChannel.show(true);
    this.childProcess = this.launchEngineChildProcess();
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

  private launchEngineChildProcess(): ChildProcess {
    const executable = Os.platform() === 'win32' ? 'AxonIvyEngineC.exe' : 'AxonIvyEngine';
    const engineDirectory = this.engineDirectory();
    const engineLauncherScriptPath = vscode.Uri.joinPath(engineDirectory, 'bin', executable).fsPath;
    const env = {
      env: { ...process.env, JAVA_OPTS_IVY_SYSTEM: '-Ddev.mode=true -Divy.engine.testheadless=true' }
    };
    this.outputChannel.appendLine('Start ' + engineLauncherScriptPath);
    return execFile(engineLauncherScriptPath, env);
  }

  private engineDirectory() {
    if (config.engineDirectory) {
      return vscode.Uri.file(config.engineDirectory);
    }
    return this.embeddedEngineDirectory;
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

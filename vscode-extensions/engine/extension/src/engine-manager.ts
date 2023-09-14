import { ChildProcess, execFile } from 'child_process';
import * as vscode from 'vscode';
import { IvyEngineApi } from './engine-api';
import Os from 'os';

export class IvyEngineManager {
  private static readonly WEB_SOCKET_ADDRESS_KEY = 'WEB_SOCKET_ADDRESS';
  private childProcess: ChildProcess;
  private engineUrl: string;
  private ivyEngineApi: IvyEngineApi;
  private devContextPath: string;
  private webSocketAddress: string;
  private extensionUri: vscode.Uri;

  constructor(context: vscode.ExtensionContext) {
    this.extensionUri = context.extensionUri;
  }

  async start(): Promise<void> {
    if (this.engineUrl) {
      return;
    }
    console.log('********** maanager start **** executed');
    this.engineUrl = await this.resolveEngineUrl();
    this.ivyEngineApi = new IvyEngineApi(this.engineUrl);
    this.devContextPath = await this.ivyEngineApi.devContextPath();
    await this.deployPmvs();
    this.webSocketAddress = this.toWebSocketAddress(this.engineUrl.slice(0, -1) + this.devContextPath + '/');
    process.env[IvyEngineManager.WEB_SOCKET_ADDRESS_KEY] = this.webSocketAddress;
  }

  private async resolveEngineUrl(): Promise<string> {
    const runEmbeddedEngine = vscode.workspace.getConfiguration().get('runEmbeddedEngine');
    if (runEmbeddedEngine) {
      return await this.startEmbeddedEngine(this.extensionUri);
    }
    return vscode.workspace.getConfiguration().get('engineUrl') as string;
  }

  private async startEmbeddedEngine(extensionUri: vscode.Uri): Promise<string> {
    const outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');
    outputChannel.show();
    const executable = Os.platform() === 'win32' ? 'AxonIvyEngineC.exe' : 'AxonIvyEngine';
    var engineLauncherScriptPath = vscode.Uri.joinPath(extensionUri, 'engine', 'AxonIvyEngine', 'bin', executable).fsPath;
    const env = {
      env: { ...process.env, JAVA_OPTS_IVY_SYSTEM: '-Ddev.mode=true -Divy.engine.testheadless=true' }
    };
    console.log('Start ' + engineLauncherScriptPath);
    this.childProcess = execFile(engineLauncherScriptPath, env);
    this.childProcess.on('error', function (error: any) {
      outputChannel.append(error);
      throw new Error(error);
    });

    return new Promise(resolve => {
      this.childProcess.stdout?.on('data', function (data: any) {
        const output = data.toString();
        if (output && output.startsWith('Go to http')) {
          const engineUrl = output.split('Go to ')[1].split(' to see')[0];
          resolve(engineUrl);
        }
        outputChannel.append(output);
      });
    });
  }

  public async deployPmvs(): Promise<void> {
    if (this.devContextPath) {
      await this.ivyEngineApi.deployPmvs(this.devContextPath);
    }
  }

  async stop(): Promise<void> {
    if (this.childProcess) {
      this.stopEmbeddedEngine();
    }
  }

  openDevWfUi(): void {
    vscode.env.openExternal(vscode.Uri.parse(this.engineUrl + this.devContextPath));
  }

  openEngineCockpit(): void {
    vscode.env.openExternal(vscode.Uri.parse(this.engineUrl + '/system/engine-cockpit'));
  }

  private async stopEmbeddedEngine(): Promise<void> {
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

  private toWebSocketAddress(engineUrl: string): string {
    if (engineUrl.startsWith('https://')) {
      return engineUrl.replace('https', 'wss');
    }
    return engineUrl.replace('http', 'ws');
  }
}

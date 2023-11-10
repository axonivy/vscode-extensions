import { ChildProcess, execFile } from 'child_process';
import * as vscode from 'vscode';
import Os from 'os';
import { executeCommand, Commands } from '../base/commands';
import { MavenBuilder } from './build/maven';
import { NewProcessParams } from '../project-explorer/new-process';
import { IvyEngineApi } from './api/engine-api';
import { NewProjectParams } from '../project-explorer/new-project';

export class IvyEngineManager {
  private static readonly WEB_SOCKET_ADDRESS_KEY = 'WEB_SOCKET_ADDRESS';
  private childProcess: ChildProcess;
  private engineUrl: Promise<string>;
  private ivyEngineApi: IvyEngineApi;
  private devContextPath: Promise<string>;
  private webSocketAddress: string;
  private extensionUri: vscode.Uri;
  private readonly mavenBuilder: MavenBuilder;
  private started = false;

  constructor(context: vscode.ExtensionContext) {
    this.extensionUri = context.extensionUri;
    this.mavenBuilder = new MavenBuilder(this.extensionUri);
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    this.engineUrl = this.resolveEngineUrl();
    this.ivyEngineApi = new IvyEngineApi(await this.engineUrl);
    this.devContextPath = this.ivyEngineApi.devContextPathRequest();
    await this.initProjects();
    this.webSocketAddress = this.toWebSocketAddress((await this.engineUrl).slice(0, -1) + (await this.devContextPath) + '/');
    process.env[IvyEngineManager.WEB_SOCKET_ADDRESS_KEY] = this.webSocketAddress;
    executeCommand(Commands.PROCESS_EDITOR_ACTIVATE);
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
    var engineLauncherScriptPath = vscode.Uri.joinPath(extensionUri, 'AxonIvyEngine', 'bin', executable).fsPath;
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

  public async initProjects(): Promise<void> {
    if (await this.devContextPath) {
      const ivyProjectDirectories = await this.ivyProjectDirectories();
      await this.ivyEngineApi.initProjects(ivyProjectDirectories);
    }
  }

  public async deployProjects(): Promise<void> {
    if (await this.devContextPath) {
      const ivyProjectDirectories = await this.ivyProjectDirectories();
      await this.ivyEngineApi.deployProjects(ivyProjectDirectories);
    }
  }

  public async buildProjects(): Promise<void> {
    await this.mavenBuilder.buildProjects();
  }

  public async buildProject(ivyProjectDirectory: string): Promise<void> {
    await this.mavenBuilder.buildProject(ivyProjectDirectory);
  }

  public async deployProject(ivyProjectDirectory: string): Promise<void> {
    if (await this.devContextPath) {
      await this.ivyEngineApi.deployProjects([ivyProjectDirectory]);
    }
  }

  public async buildAndDeployProjects(): Promise<void> {
    if (await this.devContextPath) {
      const ivyProjectDirectories = await this.ivyProjectDirectories();
      await this.buildProjects();
      await this.ivyEngineApi.deployProjects(ivyProjectDirectories);
    }
  }

  public async buildAndDeployProject(ivyProjectDirectory: string): Promise<void> {
    if (await this.devContextPath) {
      await this.buildProject(ivyProjectDirectory);
      await this.ivyEngineApi.deployProjects([ivyProjectDirectory]);
    }
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<void> {
    if (await this.devContextPath) {
      await this.ivyEngineApi.createProcess(newProcessParams);
    }
  }

  public async createProject(newProjectParams: NewProjectParams): Promise<void> {
    if (!this.started) {
      await this.start();
    }
    if (await this.devContextPath) {
      await this.ivyEngineApi.createProject(newProjectParams);
      const path = newProjectParams.path;
      if (vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(path))) {
        await this.ivyEngineApi.initProjects([path]);
        await this.deployProject(path);
        await this.createProcess({ name: 'BusinessProcess', kind: 'Business Process', path, namespace: '' });
        await this.buildAndDeployProject(path);
      }
    }
  }

  public async devWfUiUri(): Promise<string> {
    return this.fullUri(await this.devContextPath);
  }

  async ivyProjectDirectories(): Promise<string[]> {
    return (await executeCommand(Commands.PROJECT_EXPLORER_GET_IVY_PROJECTS)) as string[];
  }

  async stop(): Promise<void> {
    if (this.childProcess) {
      this.stopEmbeddedEngine();
    }
  }

  async openDevWfUi(): Promise<void> {
    await this.openInInternalBrowser(await this.devContextPath);
  }

  async openEngineCockpit(): Promise<void> {
    await this.openInInternalBrowser('system/engine-cockpit');
  }

  async startProcess(processStartUri: string): Promise<void> {
    await this.openInInternalBrowser(processStartUri);
  }

  private async openInInternalBrowser(postfix: string): Promise<void> {
    executeCommand(Commands.ENGINE_IVY_BROWSER_OPEN, [await this.fullUri(postfix)]);
  }

  private async fullUri(postfix: string) {
    postfix = postfix.startsWith('/') ? postfix.replace('/', '') : postfix;
    return (await this.engineUrl) + postfix;
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

import { ChildProcess, execFile } from 'child_process';
import * as vscode from 'vscode';
import Os from 'os';
import { executeCommand } from '../base/commands';
import { MavenBuilder } from './build/maven';
import { NewProcessParams } from '../project-explorer/new-process';
import { IvyEngineApi } from './api/engine-api';
import { NewProjectParams } from '../project-explorer/new-project';
import { engineRunEmbedded, engineUrl } from '../base/configurations';
import { NewUserDialogParams } from '../project-explorer/new-user-dialog';
import { setStatusBarMessage } from '../base/status-bar-message';
import { CREATE_PROJECT_REQUEST } from './api/project-request';
import { resolveClientEngineHost, toWebSocketUrl } from '../base/url-util';

export class IvyEngineManager {
  private childProcess: ChildProcess;
  private engineUrl: string;
  private ivyEngineApi: IvyEngineApi;
  private devContextPath: string;
  private extensionUri: vscode.Uri;
  private readonly mavenBuilder: MavenBuilder;
  private started = false;

  constructor(context: vscode.ExtensionContext) {
    this.extensionUri = context.extensionUri;
    this.mavenBuilder = new MavenBuilder(this.extensionUri);
  }

  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    this.engineUrl = await this.resolveEngineUrl();
    this.ivyEngineApi = new IvyEngineApi(this.engineUrl);
    this.devContextPath = await this.ivyEngineApi.devContextPath;
    this.devContextPath += this.devContextPath.endsWith('/') ? '' : '/';
    await this.initProjects();
    this.deployProjects();
    const websocketUrl = new URL(this.devContextPath, toWebSocketUrl(this.engineUrl));
    process.env['WEB_SOCKET_ADDRESS'] = websocketUrl.toString();
    process.env['WEB_SOCKET_ADDRESS_CLIENT'] = resolveClientEngineHost(websocketUrl.toString());
    executeCommand('process-editor.activate');
  }

  private async resolveEngineUrl() {
    const runEmbeddedEngine = engineRunEmbedded;
    if (runEmbeddedEngine) {
      return await this.startEmbeddedEngine(this.extensionUri);
    }
    return engineUrl ?? '';
  }

  private async startEmbeddedEngine(extensionUri: vscode.Uri): Promise<string> {
    const outputChannel = vscode.window.createOutputChannel('Axon Ivy Engine');
    outputChannel.show(true);
    const executable = Os.platform() === 'win32' ? 'AxonIvyEngineC.exe' : 'AxonIvyEngine';
    const engineLauncherScriptPath = vscode.Uri.joinPath(extensionUri, 'AxonIvyEngine', 'bin', executable).fsPath;
    const env = {
      env: { ...process.env, JAVA_OPTS_IVY_SYSTEM: '-Ddev.mode=true -Divy.engine.testheadless=true' }
    };
    console.log('Start ' + engineLauncherScriptPath);
    this.childProcess = execFile(engineLauncherScriptPath, env);
    this.childProcess.on('error', function (error: Error) {
      outputChannel.append(error.message);
      throw error;
    });

    return new Promise(resolve => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.childProcess.stdout?.on('data', function (data: any) {
        const output = data.toString() as string;
        if (output && output.startsWith('Go to http')) {
          const engineUrl = output.split('Go to ')[1].split(' to see')[0];
          resolve(engineUrl);
        }
        outputChannel.append(output);
      });
    });
  }

  private async initProjects() {
    const ivyProjectDirectories = await this.ivyProjectDirectories();
    await this.ivyEngineApi.initProjects(ivyProjectDirectories);
  }

  public async deployProjects() {
    const ivyProjectDirectories = await this.ivyProjectDirectories();
    await this.ivyEngineApi.deployProjects(ivyProjectDirectories);
  }

  public async buildProjects() {
    await this.mavenBuilder.buildProjects();
  }

  public async buildProject(ivyProjectDirectory: string) {
    await this.mavenBuilder.buildProject(ivyProjectDirectory);
  }

  public async deployProject(ivyProjectDirectory: string) {
    await this.ivyEngineApi.deployProjects([ivyProjectDirectory]);
  }

  public async buildAndDeployProjects() {
    const ivyProjectDirectories = await this.ivyProjectDirectories();
    await this.buildProjects();
    await this.ivyEngineApi.deployProjects(ivyProjectDirectories);
  }

  public async buildAndDeployProject(ivyProjectDirectory: string) {
    await this.buildProject(ivyProjectDirectory);
    await this.ivyEngineApi.deployProjects([ivyProjectDirectory]);
  }

  public async createProcess(newProcessParams: NewProcessParams) {
    await this.createAndOpenProcess(newProcessParams);
    await this.ivyEngineApi.deployProjects([newProcessParams.path]);
  }

  public async createUserDialog(newUserDialogParams: NewUserDialogParams) {
    const hdPath = await this.ivyEngineApi.createUserDialog(newUserDialogParams);
    const xhtmlUri = vscode.Uri.joinPath(vscode.Uri.parse(hdPath), newUserDialogParams.name + '.xhtml');
    executeCommand('vscode.open', xhtmlUri);
    this.buildAndDeployProject(newUserDialogParams.projectDir);
  }

  public async createProject(newProjectParams: NewProjectParams) {
    await executeCommand('setContext', 'ivy:hasIvyProjects', true);
    if (!this.started) {
      await this.start();
    }
    await this.ivyEngineApi.createProject(newProjectParams);
    const path = newProjectParams.path;
    await this.ivyEngineApi.initProjects([path]);
    await this.createAndOpenProcess({ name: 'BusinessProcess', kind: 'Business Process', path, namespace: '' });
    await this.buildAndDeployProject(path);
    setStatusBarMessage('Finished: ' + CREATE_PROJECT_REQUEST.description);
  }

  private async createAndOpenProcess(newProcessParams: NewProcessParams) {
    const newProcessUri = await this.ivyEngineApi.createProcess(newProcessParams);
    executeCommand('vscode.open', vscode.Uri.parse(newProcessUri));
  }

  public async deleteProject(ivyProjectDirectory: string) {
    this.ivyEngineApi.deleteProject(ivyProjectDirectory);
  }

  async ivyProjectDirectories() {
    return (await executeCommand('ivyProjects.getIvyProjects')) as string[];
  }

  async stop() {
    if (this.childProcess) {
      await this.stopEmbeddedEngine();
    }
  }

  async openDevWfUi() {
    await this.openInInternalBrowser(this.devContextPath);
  }

  async openEngineCockpit() {
    await this.openInInternalBrowser('system/engine-cockpit');
  }

  async startProcess(processStartUri: string) {
    await this.openInInternalBrowser(processStartUri);
  }

  private async openInInternalBrowser(postfix: string) {
    await executeCommand('engine.ivyBrowserOpen', this.fullUri(postfix));
  }

  private fullUri(postfix: string) {
    postfix = postfix.startsWith('/') ? postfix.replace('/', '') : postfix;
    return this.engineUrl + postfix;
  }

  private async stopEmbeddedEngine() {
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
}

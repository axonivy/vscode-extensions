import * as vscode from 'vscode';
import { executeCommand } from '../base/commands';
import { MavenBuilder } from './build/maven';
import { NewProcessParams } from '../project-explorer/new-process';
import { IvyEngineApi } from './api/engine-api';
import { NewProjectParams } from '../project-explorer/new-project';
import { config } from '../base/configurations';
import { NewUserDialogParams } from '../project-explorer/new-user-dialog';
import { setStatusBarMessage } from '../base/status-bar-message';
import { CREATE_PROJECT_REQUEST } from './api/project-request';
import { resolveClientEngineHost, toWebSocketUrl } from '../base/url-util';
import { EngineRunner } from './engine-runner';

export class IvyEngineManager {
  private engineUrl: string;
  private ivyEngineApi: IvyEngineApi;
  private devContextPath: string;
  private readonly mavenBuilder: MavenBuilder;
  private started = false;
  private engineRunner: EngineRunner;

  constructor(context: vscode.ExtensionContext) {
    const embeddedEngineDirectory = vscode.Uri.joinPath(context.extensionUri, 'AxonIvyEngine');
    this.mavenBuilder = new MavenBuilder(embeddedEngineDirectory);
    this.engineRunner = new EngineRunner(embeddedEngineDirectory);
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
    await this.deployProjects();
    const websocketUrl = new URL(this.devContextPath, toWebSocketUrl(this.engineUrl));
    process.env['WEB_SOCKET_ADDRESS'] = websocketUrl.toString();
    process.env['WEB_SOCKET_ADDRESS_CLIENT'] = resolveClientEngineHost(websocketUrl).toString();
    executeCommand('process-editor.activate');
  }

  private async resolveEngineUrl() {
    let engineUrl = config.engineUrl() ?? '';
    if (config.engineRunByExtension()) {
      await this.engineRunner.start();
      engineUrl = this.engineRunner.engineUrl;
    }
    const url = new URL(engineUrl);
    process.env['ENGINE_HOST'] = url.host;
    process.env['ENGINE_PORT'] = url.port;
    return engineUrl;
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
    await this.engineRunner.stop();
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
}

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import path from 'path';
import { deleteRequest, getRequest, postRequest } from './request';
import { NewProcessParams } from '../../project-explorer/new-process';
import { NewProjectParams } from '../../project-explorer/new-project';
import {
  ACTIVATE_PROJECTS_REQUEST,
  CREATE_PROCESS_REQUEST,
  CREATE_PROJECT_REQUEST,
  DEACTIVATE_PROJECTS_REQUEST,
  DELETE_PROJECT_REQUEST,
  DEPLOY_PROJECTS_REQUEST,
  INIT_PROJECT_REQUEST,
  ProjectRequest
} from './project-request';

export class IvyEngineApi {
  private readonly API_PATH = 'api/web-ide';
  private readonly _devContextPath: Promise<string>;
  private readonly devRequestUrl: Promise<string>;

  constructor(engineUrl: string) {
    this._devContextPath = this.devContextPathRequest(engineUrl);
    this.devRequestUrl = this.devContextPath.then(devContextPath =>
      new URL(path.join(devContextPath, this.API_PATH), engineUrl).toString()
    );
  }

  private async devContextPathRequest(engineUrl: string): Promise<string> {
    const systemRequestUrl = engineUrl + path.join('system', this.API_PATH, 'dev-context-path');
    const sessionId = this.sessionId();
    const params = { sessionId };
    return getRequest(systemRequestUrl, params, { username: 'admin', password: 'admin' });
  }

  private sessionId(): string {
    if (vscode.workspace.workspaceFolders) {
      const workspace = vscode.workspace.workspaceFolders[0].uri;
      return crypto.createHash('sha256').update(workspace.toString()).digest('hex');
    }
    return 'workspace-not-available';
  }

  public async initProjects(ivyProjectDirectories: string[]): Promise<void> {
    let url = await this.toRequestUrl(INIT_PROJECT_REQUEST);
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      const projectName = path.basename(ivyProjectDirectory);
      const params = { projectName, projectDir: ivyProjectDirectory };
      await getRequest(url, params);
    }
    url = await this.toRequestUrl(ACTIVATE_PROJECTS_REQUEST);
    const params = { projectDir: ivyProjectDirectories };
    await getRequest(url, params);
    vscode.window.setStatusBarMessage('Successful Project Initialization', 5_000);
  }

  public async deployProjects(ivyProjectDirectories: string[]): Promise<void> {
    const params = { projectDir: ivyProjectDirectories };
    await getRequest(await this.toRequestUrl(DEACTIVATE_PROJECTS_REQUEST), params);
    await getRequest(await this.toRequestUrl(DEPLOY_PROJECTS_REQUEST), params);
    await getRequest(await this.toRequestUrl(ACTIVATE_PROJECTS_REQUEST), params);
    vscode.window.setStatusBarMessage('Successful Project Deployment', 5_000);
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<string> {
    return postRequest(await this.toRequestUrl(CREATE_PROCESS_REQUEST), newProcessParams);
  }

  public async createProject(newProjectParams: NewProjectParams): Promise<void> {
    return postRequest(await this.toRequestUrl(CREATE_PROJECT_REQUEST), newProjectParams);
  }

  public async deleteProject(projectDir: string): Promise<any> {
    return deleteRequest(await this.toRequestUrl(DELETE_PROJECT_REQUEST), { projectDir });
  }

  private async toRequestUrl(projectRequest: ProjectRequest): Promise<string> {
    return this.devRequestUrl.then(url => url + '/' + projectRequest.sourcePath);
  }

  public get devContextPath(): Promise<string> {
    return this._devContextPath;
  }
}

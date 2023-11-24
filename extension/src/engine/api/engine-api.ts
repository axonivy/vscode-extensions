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
  CREATE_USER_DIALOG_REQUEST,
  DEACTIVATE_PROJECTS_REQUEST,
  DELETE_PROJECT_REQUEST,
  DEPLOY_PROJECTS_REQUEST,
  INIT_PROJECT_REQUEST,
  ProjectRequest,
  toProgressOptions
} from './project-request';
import { NewUserDialogParams } from '../../project-explorer/new-user-dialog';
import { setStatusBarMessage } from '../../base/status-bar-message';

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

  public async initProjects(ivyProjectDirectories: string[]) {
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      await this.initProject(ivyProjectDirectory);
    }
    const params = { projectDir: ivyProjectDirectories };
    await this.get(ACTIVATE_PROJECTS_REQUEST, params);
  }

  public async initProject(projectDir: string) {
    const projectName = path.basename(projectDir);
    const params = { projectName, projectDir };
    await this.get(INIT_PROJECT_REQUEST, params);
  }

  public async deployProjects(ivyProjectDirectories: string[]) {
    const params = { projectDir: ivyProjectDirectories };
    await this.get(DEACTIVATE_PROJECTS_REQUEST, params);
    await this.get(DEPLOY_PROJECTS_REQUEST, params);
    await this.get(ACTIVATE_PROJECTS_REQUEST, params);
    setStatusBarMessage('Finished: ' + DEPLOY_PROJECTS_REQUEST.description);
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<string> {
    return this.post(CREATE_PROCESS_REQUEST, newProcessParams);
  }

  public async createProject(newProjectParams: NewProjectParams) {
    return this.post(CREATE_PROJECT_REQUEST, newProjectParams);
  }

  public async createUserDialog(newUserDialogParams: NewUserDialogParams) {
    return this.post(CREATE_USER_DIALOG_REQUEST, newUserDialogParams);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async deleteProject(projectDir: string): Promise<any> {
    return this.delete(DELETE_PROJECT_REQUEST, { projectDir });
  }

  private async toRequestUrl(projectRequest: ProjectRequest): Promise<string> {
    return this.devRequestUrl.then(url => url + '/' + projectRequest.sourcePath);
  }

  public get devContextPath(): Promise<string> {
    return this._devContextPath;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async get(projectRequest: ProjectRequest, params: { projectDir: string | string[]; projectName?: string }): Promise<any> {
    const url = await this.toRequestUrl(projectRequest);
    return new Promise(resolve =>
      vscode.window.withProgress(toProgressOptions(projectRequest), async () => {
        resolve(await getRequest(url, params));
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async post(projectRequest: ProjectRequest, data: NewProjectParams | NewProcessParams | NewUserDialogParams): Promise<any> {
    const url = await this.toRequestUrl(projectRequest);
    return new Promise(resolve =>
      vscode.window.withProgress(toProgressOptions(projectRequest), async () => {
        resolve(await postRequest(url, data));
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async delete(projectRequest: ProjectRequest, params: { projectDir: string }): Promise<any> {
    const url = await this.toRequestUrl(projectRequest);
    return new Promise(resolve =>
      vscode.window.withProgress(toProgressOptions(projectRequest), async () => {
        resolve(await deleteRequest(url, params));
      })
    );
  }
}

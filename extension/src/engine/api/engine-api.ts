import * as vscode from 'vscode';
import * as crypto from 'crypto';
import path from 'path';
import { deleteRequest, getRequest, pollWithProgress, postRequest } from './request';
import { NewProcessParams } from '../../project-explorer/new-process';
import { NewProjectParams } from '../../project-explorer/new-project';
import { NewUserDialogParams } from '../../project-explorer/new-user-dialog';
import { setStatusBarMessage } from '../../base/status-bar-message';
import {
  ACTIVATE_PROJECTS,
  API_PATH,
  CREATE_PROCESS,
  CREATE_PROJECT,
  CREATE_USER_DIALOG,
  DEACTIVATE_PROJECTS,
  DELETE_PROJECT,
  DEPLOY_PROJECTS,
  DEV_CONTEXT,
  INIT_PROJECT,
  Request
} from './api-constants';

export class IvyEngineApi {
  private readonly _devContextPath: Promise<string>;
  private readonly devRequestUrl: Promise<string>;

  constructor(engineUrl: string) {
    this._devContextPath = this.devContextPathRequest(engineUrl);
    this.devRequestUrl = this.devContextPath.then(devContextPath => new URL(path.join(devContextPath, API_PATH), engineUrl).toString());
  }

  private async devContextPathRequest(engineUrl: string): Promise<string> {
    const baseSystemUrl = engineUrl + 'system/';
    await pollWithProgress(baseSystemUrl, 'Waiting for Axon Ivy Engine to be ready.');
    const systemRequestUrl = baseSystemUrl + path.join(API_PATH, DEV_CONTEXT.path);
    const sessionId = this.sessionId();
    return postRequest(systemRequestUrl, { sessionId }, { username: 'admin', password: 'admin' });
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
    await this.get(ACTIVATE_PROJECTS, params);
  }

  public async initProject(projectDir: string) {
    const projectName = path.basename(projectDir);
    const params = { projectName, projectDir };
    await this.get(INIT_PROJECT, params);
  }

  public async deployProjects(ivyProjectDirectories: string[]) {
    const params = { projectDir: ivyProjectDirectories };
    await this.get(DEACTIVATE_PROJECTS, params);
    await this.get(DEPLOY_PROJECTS, params);
    await this.get(ACTIVATE_PROJECTS, params);
    setStatusBarMessage('Finished: ' + DEPLOY_PROJECTS.description);
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<string> {
    return this.post(CREATE_PROCESS, newProcessParams);
  }

  public async createProject(newProjectParams: NewProjectParams) {
    return this.post(CREATE_PROJECT, newProjectParams);
  }

  public async createUserDialog(newUserDialogParams: NewUserDialogParams) {
    return this.post(CREATE_USER_DIALOG, newUserDialogParams);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async deleteProject(projectDir: string): Promise<any> {
    return this.delete(DELETE_PROJECT, { projectDir });
  }

  private async toRequestUrl(request: Request): Promise<string> {
    return this.devRequestUrl.then(url => url + '/' + request.path);
  }

  private toProgressOptions(request: Request) {
    return {
      location: vscode.ProgressLocation.Window,
      title: request.description,
      cancellable: false
    };
  }

  public get devContextPath(): Promise<string> {
    return this._devContextPath;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async get(request: Request, params: { projectDir: string | string[]; projectName?: string }): Promise<any> {
    const url = await this.toRequestUrl(request);
    return new Promise(resolve =>
      vscode.window.withProgress(this.toProgressOptions(request), async () => {
        resolve(await getRequest(url, params));
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async post(request: Request, data: NewProjectParams | NewProcessParams | NewUserDialogParams): Promise<any> {
    const url = await this.toRequestUrl(request);
    return new Promise(resolve =>
      vscode.window.withProgress(this.toProgressOptions(request), async () => {
        resolve(await postRequest(url, data));
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async delete(request: Request, params: { projectDir: string }): Promise<any> {
    const url = await this.toRequestUrl(request);
    return new Promise(resolve =>
      vscode.window.withProgress(this.toProgressOptions(request), async () => {
        resolve(await deleteRequest(url, params));
      })
    );
  }
}

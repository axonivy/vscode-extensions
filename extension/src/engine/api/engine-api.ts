import * as vscode from 'vscode';
import * as crypto from 'crypto';
import path from 'path';
import { pollWithProgress } from './poll';
import { NewProcessParams } from '../../project-explorer/new-process';
import { NewProjectParams } from '../../project-explorer/new-project';
import { NewUserDialogParams } from '../../project-explorer/new-user-dialog';
import { setStatusBarMessage } from '../../base/status-bar';
import {
  HdBean,
  ProcessBean,
  build,
  createHd,
  createProcess,
  createProject,
  deleteProject,
  deployProjects,
  initProject,
  watch
} from './generated/openapi';
import { getOrCreateDevContext } from './generated/openapi-system';

const progressOptions = (title: string) => {
  return {
    location: vscode.ProgressLocation.Window,
    title,
    cancellable: false
  };
};
const headers = { 'X-Requested-By': 'web-ide' };
const options = { headers, auth: { username: 'Developer', password: 'Developer' }, paramsSerializer: { indexes: null } };

export class IvyEngineApi {
  private readonly _devContextPath: Promise<string>;
  private readonly baseURL: Promise<string>;

  constructor(engineUrl: string) {
    this._devContextPath = this.devContextPathRequest(engineUrl);
    this.baseURL = this.devContextPath.then(devContextPath => new URL(path.join(devContextPath, 'api'), engineUrl).toString());
  }

  private async devContextPathRequest(engineUrl: string): Promise<string> {
    const baseURL = new URL(path.join('system', 'api'), engineUrl).toString();
    await pollWithProgress(engineUrl, 'Waiting for Axon Ivy Engine to be ready.');
    const sessionId = this.sessionId();
    const { data } = await getOrCreateDevContext({ sessionId }, { baseURL, auth: { username: 'admin', password: 'admin' }, headers });
    return data;
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
    await this.watchProjects(ivyProjectDirectories);
  }

  public async initProject(projectDir: string) {
    const projectName = path.basename(projectDir);
    const params = { projectName, projectDir };
    await vscode.window.withProgress(progressOptions('Initialize Ivy Project'), async () => {
      await initProject(params, { baseURL: await this.baseURL, ...options });
    });
  }

  public async deployProjects(ivyProjectDirectories: string[]) {
    const params = { projectDir: ivyProjectDirectories };
    await vscode.window.withProgress(progressOptions('Deploy Ivy Projects'), async () => {
      await deployProjects(params, { baseURL: await this.baseURL, ...options });
    });
    setStatusBarMessage('Finished: Deploy Ivy Projects');
  }

  public async buildProjects(ivyProjectDirectories: string[]) {
    const params = { projectDir: ivyProjectDirectories };
    const baseURL = await this.baseURL;
    await vscode.window.withProgress(progressOptions('Build Projects'), async () => {
      await build(params, { baseURL, ...options });
    });
  }

  public async watchProjects(ivyProjectDirectories: string[]) {
    const params = { projectDir: ivyProjectDirectories };
    const baseURL = await this.baseURL;
    await vscode.window.withProgress(progressOptions('Watch Projects'), async () => {
      await watch(params, { baseURL, ...options });
    });
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<ProcessBean> {
    const baseURL = await this.baseURL;
    return new Promise(resolve =>
      vscode.window.withProgress(progressOptions('Create new Process'), async () => {
        resolve((await createProcess(newProcessParams, { baseURL, ...options })).data);
      })
    );
  }

  public async createProject(newProjectParams: NewProjectParams) {
    const baseURL = await this.baseURL;
    return new Promise(resolve =>
      vscode.window.withProgress(progressOptions('Create new Project'), async () => {
        resolve(await createProject(newProjectParams, { baseURL, ...options }));
      })
    );
  }

  public async createUserDialog(newUserDialogParams: NewUserDialogParams): Promise<HdBean> {
    const baseURL = await this.baseURL;
    return new Promise(resolve =>
      vscode.window.withProgress(progressOptions('Create new User Dialog'), async () => {
        resolve((await createHd(newUserDialogParams, { baseURL, ...options })).data);
      })
    );
  }

  public async deleteProject(projectDir: string) {
    const baseURL = await this.baseURL;
    await vscode.window.withProgress(progressOptions('Delete Project'), async () => {
      await deleteProject({ projectDir }, { baseURL, ...options });
    });
  }

  public get devContextPath(): Promise<string> {
    return this._devContextPath;
  }
}

import * as http from 'http';
import * as vscode from 'vscode';
import * as crypto from 'crypto';
import path from 'path';
import {
  ACTIVATE_PROJECTS_REQUEST,
  CREATE_PROCESS_REQUEST,
  DEACTIVATE_PROJECTS_REQUEST,
  DEPLOY_PROJECTS_REQUEST,
  INIT_PROJECT_REQUEST,
  PROJECT_REQUEST_OPTIONS,
  ProjectRequest,
  makeGetRequest,
  makePostRequest
} from './request';
import { NewProcessParams } from '../../project-explorer/new-process';

export class IvyEngineApi {
  private readonly API_PATH = 'api/web-ide';
  private engineUrl: URL;
  private devContextPath = '';

  constructor(engineUrlString: string) {
    this.engineUrl = new URL(engineUrlString);
  }

  public async devContextPathRequest(): Promise<string> {
    const requestPath = path.join('system', this.API_PATH, 'dev-context-path');
    const url = new URL(requestPath, this.engineUrl);
    const sessionId = this.sessionId();
    url.searchParams.append('sessionId', sessionId);
    const options: http.RequestOptions = {
      auth: 'admin:admin',
      method: 'GET'
    };
    this.devContextPath = await makeGetRequest(url, options);
    return this.devContextPath;
  }

  private sessionId(): string {
    if (vscode.workspace.workspaceFolders) {
      const workspace = vscode.workspace.workspaceFolders[0].uri;
      return crypto.createHash('sha256').update(workspace.toString()).digest('hex');
    }
    return 'workspace-not-available';
  }

  public async initProjects(ivyProjectDirectories: string[]): Promise<void> {
    const searchParams = this.searchParams(ivyProjectDirectories);
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      await this.initProject(ivyProjectDirectory);
    }
    await this.runGetRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, searchParams);
  }

  private async initProject(ivyProjectDirectory: string): Promise<void> {
    const projectName = path.basename(ivyProjectDirectory);
    const searchParams = new URLSearchParams();
    searchParams.append('projectName', projectName);
    searchParams.append('projectDir', ivyProjectDirectory);
    await this.runGetRequestWithProgress(INIT_PROJECT_REQUEST, searchParams);
  }

  public async deployProjects(ivyProjectDirectories: string[]): Promise<void> {
    const searchParams = this.searchParams(ivyProjectDirectories);
    await this.runGetRequestWithProgress(DEACTIVATE_PROJECTS_REQUEST, searchParams);
    await this.runGetRequestWithProgress(DEPLOY_PROJECTS_REQUEST, searchParams);
    await this.runGetRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, searchParams);
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<void> {
    await this.runPostRequestWithProgress(newProcessParams, CREATE_PROCESS_REQUEST);
  }

  private async runGetRequestWithProgress(projectRequest: ProjectRequest, searchParams: URLSearchParams): Promise<void> {
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: projectRequest.description,
      cancellable: false
    };
    const url = this.projectRequestURLWithParams(projectRequest.sourcePath, searchParams);
    await vscode.window.withProgress(progressOptions, async progess => {
      progess.report({ message: url.pathname + url.search });
      await makeGetRequest(url, PROJECT_REQUEST_OPTIONS);
    });
  }

  private projectRequestURLWithParams(sourcePath: string, searchParams: URLSearchParams): URL {
    const url = this.projectRequestURL(sourcePath);
    searchParams.forEach((value, key) => url.searchParams.append(key, value));
    return url;
  }

  private projectRequestURL(sourcePath: string): URL {
    const requestPath = path.join(this.devContextPath, this.API_PATH, sourcePath);
    return new URL(requestPath, this.engineUrl);
  }

  private searchParams(ivyProjectDirectories: string[]): URLSearchParams {
    const searchParams = new URLSearchParams();
    for (const projectDir of ivyProjectDirectories) {
      searchParams.append('projectDir', projectDir);
    }
    return searchParams;
  }

  private async runPostRequestWithProgress(payload: any, projectRequest: ProjectRequest): Promise<void> {
    const data = JSON.stringify(payload);
    const requestOptions = {
      ...PROJECT_REQUEST_OPTIONS,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Requested-By': 'web-ide'
      }
    };
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: projectRequest.description,
      cancellable: false
    };
    const url = this.projectRequestURL(projectRequest.sourcePath);
    await vscode.window.withProgress(progressOptions, async progess => {
      progess.report({ message: url.pathname + url.search });
      await makePostRequest(url, requestOptions, data);
    });
  }
}

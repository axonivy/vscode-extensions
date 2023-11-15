import * as http from 'http';
import * as vscode from 'vscode';
import * as crypto from 'crypto';
import path from 'path';
import {
  ACTIVATE_PROJECTS_REQUEST,
  CREATE_PROCESS_REQUEST,
  CREATE_PROJECT_REQUEST,
  DEACTIVATE_PROJECTS_REQUEST,
  DELETE_PROJECT_REQUEST,
  DEPLOY_PROJECTS_REQUEST,
  INIT_PROJECT_REQUEST,
  PROJECT_REQUEST_OPTIONS,
  ProjectRequest,
  auth,
  headers,
  makeGetRequest,
  makePostRequest
} from './request';
import { NewProcessParams } from '../../project-explorer/new-process';
import { NewProjectParams } from '../../project-explorer/new-project';
import axios from 'axios';

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
    await this.runGetRequest(ACTIVATE_PROJECTS_REQUEST, searchParams);
    vscode.window.setStatusBarMessage('Successful Project Initialization', 5_000);
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
    await this.runGetRequest(DEACTIVATE_PROJECTS_REQUEST, searchParams);
    await this.runGetRequestWithProgress(DEPLOY_PROJECTS_REQUEST, searchParams);
    await this.runGetRequest(ACTIVATE_PROJECTS_REQUEST, searchParams);
    vscode.window.setStatusBarMessage('Successful Project Deployment', 5_000);
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<string> {
    return await this.runPostRequest(newProcessParams, CREATE_PROCESS_REQUEST);
  }

  public async createProject(newProjectParams: NewProjectParams): Promise<void> {
    await this.runPostRequest(newProjectParams, CREATE_PROJECT_REQUEST);
  }

  public async deleteProject(projectDir: string): Promise<any> {
    const params = { projectDir };
    const url = this.projectRequestURL(DELETE_PROJECT_REQUEST.sourcePath).toString();
    return new Promise(resolve => axios.delete(url, { params, headers, auth }).then(response => resolve(response.data)));
  }

  private async runGetRequestWithProgress(projectRequest: ProjectRequest, searchParams: URLSearchParams): Promise<void> {
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: projectRequest.description,
      cancellable: false
    };
    await vscode.window.withProgress(progressOptions, async progess => {
      await this.runGetRequest(projectRequest, searchParams, progess);
    });
  }

  private async runGetRequest(
    projectRequest: ProjectRequest,
    searchParams: URLSearchParams,
    progress?: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<void> {
    const url = this.projectRequestURLWithParams(projectRequest.sourcePath, searchParams);
    const message = url.pathname + url.search;
    progress?.report({ message });
    console.log(projectRequest.description, message);
    await makeGetRequest(url, PROJECT_REQUEST_OPTIONS);
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

  private async runPostRequest(payload: any, projectRequest: ProjectRequest): Promise<string> {
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
    const url = this.projectRequestURL(projectRequest.sourcePath);
    const message = url.pathname + url.search;
    console.log(projectRequest.description, message);
    return await makePostRequest(url, requestOptions, data);
  }
}

import * as http from 'http';
import * as https from 'https';
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
  ProjectRequest
} from './project-request';
import { NewProcessParams } from '../project-explorer/new-process';

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
    this.devContextPath = await this.makeRequest(url, options);
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
    await this.runProjectRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, searchParams);
  }

  private async initProject(ivyProjectDirectory: string): Promise<void> {
    const projectName = path.basename(ivyProjectDirectory);
    const searchParams = new URLSearchParams();
    searchParams.append('projectName', projectName);
    searchParams.append('projectDir', ivyProjectDirectory);
    await this.runProjectRequestWithProgress(INIT_PROJECT_REQUEST, searchParams);
  }

  public async deployProjects(ivyProjectDirectories: string[]): Promise<void> {
    const searchParams = this.searchParams(ivyProjectDirectories);
    await this.runProjectRequestWithProgress(DEACTIVATE_PROJECTS_REQUEST, searchParams);
    await this.runProjectRequestWithProgress(DEPLOY_PROJECTS_REQUEST, searchParams);
    await this.runProjectRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, searchParams);
  }

  public async createProcess(newProcessParams: NewProcessParams): Promise<void> {
    const searchParams = new URLSearchParams();
    searchParams.append('newProcessParams', JSON.stringify(newProcessParams));
    await this.runProjectRequestWithProgress(CREATE_PROCESS_REQUEST, searchParams);
  }

  private async runProjectRequestWithProgress(projectRequest: ProjectRequest, searchParams: URLSearchParams): Promise<void> {
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: projectRequest.description,
      cancellable: false
    };
    const url = this.projectRequestURL(projectRequest.sourcePath, searchParams);
    await vscode.window.withProgress(progressOptions, async progess => {
      progess.report({ message: url.pathname + url.search });
      await this.makeRequest(url, PROJECT_REQUEST_OPTIONS);
    });
  }

  private projectRequestURL(sourcePath: string, searchParams: URLSearchParams): URL {
    const requestPath = path.join(this.devContextPath, this.API_PATH, sourcePath);
    const url = new URL(requestPath, this.engineUrl);
    searchParams.forEach((value, key) => url.searchParams.append(key, value));
    return url;
  }

  private searchParams(ivyProjectDirectories: string[]): URLSearchParams {
    const searchParams = new URLSearchParams();
    for (const projectDir of ivyProjectDirectories) {
      searchParams.append('projectDir', projectDir);
    }
    return searchParams;
  }

  private makeRequest(url: URL, options: http.RequestOptions): Promise<string> {
    if (url.protocol === 'http:') {
      return this.makeHttpRquest(url, options);
    }
    return this.makeHttpsRquest(url, options);
  }

  private makeHttpRquest(url: URL, options: http.RequestOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      http.request(url, options, res => this.callback(res, resolve, reject)).end();
    });
  }

  private makeHttpsRquest(url: URL, options: http.RequestOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      https.request(url, options, res => this.callback(res, resolve, reject)).end();
    });
  }

  private callback(response: http.IncomingMessage, resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) {
    let data = '';
    if (response.statusCode && response.statusCode >= 300) {
      reject('Failed to make http request with status code: ' + response.statusCode);
    }
    response.on('error', error => {
      reject(error.message);
    });
    response.on('data', chunk => {
      data += chunk;
    });
    response.on('end', () => {
      resolve(data);
    });
  }
}

import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as vscode from 'vscode';
import * as crypto from 'crypto';
import path from 'path';
import {
  ACTIVATE_PROJECTS_REQUEST,
  BUILD_PROJECTS_REQUEST,
  DEACTIVATE_PROJECTS_REQUEST,
  DEPLOY_PROJECTS_REQUEST,
  INIT_PROJECT_REQUEST,
  ProjectRequest
} from './project-request';

export class IvyEngineApi {
  private readonly API_PATH = '/api/web-ide/';
  private engineUrl: url.UrlWithStringQuery;
  private requestOptions: { host: string | null; port: string | null };
  private devContextPath = '';

  constructor(engineUrlString: string) {
    this.engineUrl = url.parse(engineUrlString);
    this.requestOptions = {
      host: this.engineUrl.hostname,
      port: this.engineUrl.port
    };
  }

  public async devContextPathRequest(): Promise<string> {
    const sessionId = this.sessionId();
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path: '/system' + this.API_PATH + 'dev-context-path?sessionId=' + encodeURIComponent(sessionId),
      auth: 'admin:admin',
      method: 'GET'
    };
    this.devContextPath = await this.makeRequest(options);
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
    const queryString = this.queryString(ivyProjectDirectories);
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      await this.initProject(ivyProjectDirectory);
    }
    await this.runProjectRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, queryString);
  }

  private async initProject(ivyProjectDirectory: string): Promise<void> {
    const projectName = path.basename(ivyProjectDirectory);
    const params = new URLSearchParams();
    params.append('projectName', projectName);
    params.append('projectDir', ivyProjectDirectory);
    await this.runProjectRequestWithProgress(INIT_PROJECT_REQUEST, '?' + params.toString());
  }

  public async deployProjects(ivyProjectDirectories: string[]): Promise<void> {
    const queryString = this.queryString(ivyProjectDirectories);
    await this.runProjectRequestWithProgress(DEACTIVATE_PROJECTS_REQUEST, queryString);
    await this.runProjectRequestWithProgress(DEPLOY_PROJECTS_REQUEST, queryString);
    await this.runProjectRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, queryString);
  }

  public async buildProjects(ivyProjectDirectories: string[]): Promise<void> {
    const queryString = this.queryString(ivyProjectDirectories);
    await this.runProjectRequestWithProgress(DEACTIVATE_PROJECTS_REQUEST, queryString);
    await this.runProjectRequestWithProgress(BUILD_PROJECTS_REQUEST, queryString);
    await this.runProjectRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, queryString);
  }

  public async buildAndDeployProjects(ivyProjectDirectories: string[]): Promise<void> {
    const queryString = this.queryString(ivyProjectDirectories);
    await this.runProjectRequestWithProgress(DEACTIVATE_PROJECTS_REQUEST, queryString);
    // await this.runProjectRequestWithProgress('Build Ivy Projects', ivyProjectDirectory, this.buildProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress(DEPLOY_PROJECTS_REQUEST, queryString);
    await this.runProjectRequestWithProgress(ACTIVATE_PROJECTS_REQUEST, queryString);
  }

  private async runProjectRequestWithProgress(projectRequest: ProjectRequest, queryString: string): Promise<void> {
    const processOptions = {
      location: vscode.ProgressLocation.Notification,
      title: projectRequest.description,
      cancellable: false
    };
    const projectRequestOptions = this.projectRequestOptions(projectRequest.sourcePath, queryString);
    await vscode.window.withProgress(processOptions, async progess => {
      progess.report({ message: projectRequestOptions.path ?? '' });
      await this.makeRequest(projectRequestOptions);
    });
  }

  private projectRequestOptions(sourcePath: string, queryString: string): http.RequestOptions {
    return {
      ...this.requestOptions,
      path: this.devContextPath + this.API_PATH + sourcePath + queryString,
      auth: 'Developer:Developer',
      method: 'GET'
    };
  }

  private queryString(ivyProjectDirectories: string[]): string {
    const params = new URLSearchParams();
    for (const projectDir of ivyProjectDirectories) {
      params.append('projectDir', projectDir);
    }
    return '?' + params.toString();
  }

  private makeRequest(options: http.RequestOptions): Promise<string> {
    if (this.engineUrl.protocol === 'http:') {
      return this.makeHttpRquest(options);
    }
    return this.makeHttpsRquest(options);
  }

  private makeHttpRquest(options: http.RequestOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      http.request(options, res => this.callback(res, resolve, reject)).end();
    });
  }

  private makeHttpsRquest(options: http.RequestOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      https.request(options, res => this.callback(res, resolve, reject)).end();
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

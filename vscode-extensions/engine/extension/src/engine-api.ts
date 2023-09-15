import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';

type ProjectRequest = (devContextPath: string, projectDir: string) => Promise<void>;

export class IvyEngineApi {
  private readonly API_PATH = '/api/web-ide/';
  private engineUrl: url.UrlWithStringQuery;
  private requestOptions: { host: string | null; port: string | null };

  constructor(engineUrlString: string) {
    this.engineUrl = url.parse(engineUrlString);
    this.requestOptions = {
      host: this.engineUrl.hostname,
      port: this.engineUrl.port
    };
  }

  public async devContextPath(): Promise<string> {
    const sessionId = this.resolveSessionId();
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path: '/system' + this.API_PATH + 'dev-context-path?sessionId=' + encodeURIComponent(sessionId),
      auth: 'admin:admin',
      method: 'GET'
    };
    return this.makeRequest(options);
  }

  private resolveSessionId(): string {
    if (vscode.workspace.workspaceFolders) {
      const workspace = vscode.workspace.workspaceFolders[0].uri;
      return crypto.createHash('sha256').update(workspace.toString()).digest('hex');
    }
    return 'workspace-not-available';
  }

  public async initProjects(devContextPath: string, ivyProjectDirectories: string[]): Promise<void> {
    await this.runProjectActionWithProgress('Initialize Ivy Projects', ivyProjectDirectories, this.initProjectRequest, devContextPath);
  }

  public async deployProjects(devContextPath: string, ivyProjectDirectories: string[]): Promise<void> {
    await this.runProjectActionWithProgress('Deploy Ivy Projects', ivyProjectDirectories, this.deployProjectRequest, devContextPath);
  }

  public async buildProjects(devContextPath: string, ivyProjectDirectories: string[]): Promise<void> {
    await this.runProjectActionWithProgress('Build Ivy Projects', ivyProjectDirectories, this.buildProjectRequest, devContextPath);
  }

  private async runProjectActionWithProgress(
    title: string,
    ivyProjectDirectories: string[],
    action: ProjectRequest,
    devContextPath: string
  ): Promise<void> {
    const options = {
      location: vscode.ProgressLocation.Notification,
      title: title,
      cancellable: false
    };
    vscode.window.withProgress(options, async progess => {
      for (const projectDir of ivyProjectDirectories) {
        progess.report({ message: projectDir });
        await action(devContextPath, projectDir);
      }
    });
  }

  private initProjectRequest = async (devContextPath: string, projectDir: string): Promise<void> => {
    const projectName = path.basename(projectDir);
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path:
        devContextPath +
        this.API_PATH +
        'init-project?projectName=' +
        encodeURIComponent(projectName) +
        '&projectDir=' +
        encodeURIComponent(projectDir),
      auth: 'Developer:Developer',
      method: 'GET'
    };
    await this.makeRequest(options);
  };

  private deployProjectRequest = async (devContextPath: string, projectDir: string): Promise<void> => {
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path: devContextPath + this.API_PATH + 'deploy-project?&projectDir=' + encodeURIComponent(projectDir),
      auth: 'Developer:Developer',
      method: 'GET'
    };
    await this.makeRequest(options);
  };

  private buildProjectRequest = async (devContextPath: string, projectDir: string): Promise<void> => {
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path: devContextPath + this.API_PATH + 'build-project?&projectDir=' + encodeURIComponent(projectDir),
      auth: 'Developer:Developer',
      method: 'GET'
    };
    await this.makeRequest(options);
  };

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

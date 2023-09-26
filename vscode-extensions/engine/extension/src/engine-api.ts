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
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      await this.initProject(devContextPath, ivyProjectDirectory);
    }
  }

  public async initProject(devContextPath: string, ivyProjectDirectory: string): Promise<void> {
    await this.runProjectRequestWithProgress('Initialize Ivy Projects', ivyProjectDirectory, this.initProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress('Activate Ivy Project', ivyProjectDirectory, this.activateProjectRequest, devContextPath);
  }

  public async deployProjects(devContextPath: string, ivyProjectDirectories: string[]): Promise<void> {
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      await this.deployProject(devContextPath, ivyProjectDirectory);
    }
  }

  public async deployProject(devContextPath: string, ivyProjectDirectory: string): Promise<void> {
    await this.runProjectRequestWithProgress('Deactivate Ivy Project', ivyProjectDirectory, this.deactivateProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress('Deploy Ivy Project', ivyProjectDirectory, this.deployProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress('Activate Ivy Project', ivyProjectDirectory, this.activateProjectRequest, devContextPath);
  }

  public async buildProjects(devContextPath: string, ivyProjectDirectories: string[]): Promise<void> {
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      await this.buildProject(devContextPath, ivyProjectDirectory);
    }
  }

  public async buildProject(devContextPath: string, ivyProjectDirectory: string): Promise<void> {
    await this.runProjectRequestWithProgress('Deactivate Ivy Project', ivyProjectDirectory, this.deactivateProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress('Build Ivy Project', ivyProjectDirectory, this.buildProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress('Activate Ivy Project', ivyProjectDirectory, this.activateProjectRequest, devContextPath);
  }

  public async buildAndDeployProjects(devContextPath: string, ivyProjectDirectories: string[]): Promise<void> {
    for (const ivyProjectDirectory of ivyProjectDirectories) {
      await this.buildAndDeployProject(devContextPath, ivyProjectDirectory);
    }
  }

  public async buildAndDeployProject(devContextPath: string, ivyProjectDirectory: string): Promise<void> {
    await this.runProjectRequestWithProgress('Deactivate Ivy Project', ivyProjectDirectory, this.deactivateProjectRequest, devContextPath);
    // await this.runProjectRequestWithProgress('Build Ivy Project', ivyProjectDirectory, this.buildProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress('Deploy Ivy Project', ivyProjectDirectory, this.deployProjectRequest, devContextPath);
    await this.runProjectRequestWithProgress('Activate Ivy Project', ivyProjectDirectory, this.activateProjectRequest, devContextPath);
  }

  private async runProjectRequestWithProgress(
    title: string,
    ivyProjectDirectory: string,
    request: ProjectRequest,
    devContextPath: string
  ): Promise<void> {
    const options = {
      location: vscode.ProgressLocation.Notification,
      title: title,
      cancellable: false
    };
    await vscode.window.withProgress(options, async progess => {
      progess.report({ message: ivyProjectDirectory });
      await request(devContextPath, ivyProjectDirectory);
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

  private deactivateProjectRequest = async (devContextPath: string, projectDir: string): Promise<void> => {
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path: devContextPath + this.API_PATH + 'deactivate-project?&projectDir=' + encodeURIComponent(projectDir),
      auth: 'Developer:Developer',
      method: 'GET'
    };
    await this.makeRequest(options);
  };

  private activateProjectRequest = async (devContextPath: string, projectDir: string): Promise<void> => {
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path: devContextPath + this.API_PATH + 'activate-project?&projectDir=' + encodeURIComponent(projectDir),
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

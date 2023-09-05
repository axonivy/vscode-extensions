import { Commands, executeCommand } from '@axonivy/vscode-base';
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';

export class IvyEngineApi {
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
      path: '/system/api/web-ide/dev-context-path?sessionId=' + sessionId,
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

  public async deployPmvs(devContextPath: string): Promise<void> {
    const ivyProjects = (await executeCommand(Commands.PROJECT_EXPLORER_GET_IVY_PROJECTS)) as vscode.Uri[];
    ivyProjects.map(projectFile => path.dirname(projectFile.fsPath)).forEach(projectDir => this.deployPmv(devContextPath, projectDir));
  }

  public async deployPmv(basePath: string, projectDir: string): Promise<void> {
    const projectName = path.basename(projectDir);
    const options: http.RequestOptions = {
      ...this.requestOptions,
      path: basePath + '/api/web-ide/deploy-pmv?projectName=' + projectName + '&projectDir=' + projectDir,
      auth: 'Developer:Developer',
      method: 'GET'
    };
    await this.makeRequest(options);
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

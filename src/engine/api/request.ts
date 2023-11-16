import { AxiosBasicCredentials } from 'axios';
import * as http from 'http';
import * as https from 'https';

export type ProjectRequest = { sourcePath: string; description: string };

export const INIT_PROJECT_REQUEST: ProjectRequest = { sourcePath: 'init-project', description: 'Initialize Ivy Project' };
export const DEACTIVATE_PROJECTS_REQUEST: ProjectRequest = { sourcePath: 'deactivate-projects', description: 'Deactivate Ivy Projects' };
export const ACTIVATE_PROJECTS_REQUEST: ProjectRequest = { sourcePath: 'activate-projects', description: 'Activate Ivy Project' };
export const DEPLOY_PROJECTS_REQUEST: ProjectRequest = { sourcePath: 'deploy-projects', description: 'Deploy Ivy Projects' };
export const CREATE_PROCESS_REQUEST: ProjectRequest = { sourcePath: 'create-process', description: 'Create new Process' };
export const CREATE_PROJECT_REQUEST: ProjectRequest = { sourcePath: 'create-project', description: 'Create new Project' };
export const DELETE_PROJECT_REQUEST: ProjectRequest = { sourcePath: 'delete-project', description: 'Delete Project' };

export const PROJECT_REQUEST_OPTIONS: http.RequestOptions = {
  auth: 'Developer:Developer',
  method: 'GET'
};

export const headers = { 'X-Requested-By': 'web-ide' };
export const auth: AxiosBasicCredentials = { username: 'Developer', password: 'Developer' };

export function makeGetRequest(url: URL, options: http.RequestOptions): Promise<string> {
  if (url.protocol === 'http:') {
    return makeHttpGetRquest(url, options);
  }
  return makeHttpsGetRquest(url, options);
}

export function makePostRequest(url: URL, options: http.RequestOptions, data: string): Promise<string> {
  if (url.protocol === 'http:') {
    return makeHttpPostRquest(url, options, data);
  }
  return makeHttpsPostRquest(url, options, data);
}

function makeHttpGetRquest(url: URL, options: http.RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    http.request(url, options, res => requestCallback(res, resolve, reject)).end();
  });
}

function makeHttpsGetRquest(url: URL, options: http.RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    https.request(url, options, res => requestCallback(res, resolve, reject)).end();
  });
}

function makeHttpPostRquest(url: URL, options: http.RequestOptions, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = http.request(url, options, res => requestCallback(res, resolve, reject));
    request.write(data);
    request.end();
  });
}

function makeHttpsPostRquest(url: URL, options: http.RequestOptions, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, res => requestCallback(res, resolve, reject));
    request.write(data);
    request.end();
  });
}

function requestCallback(
  response: http.IncomingMessage,
  resolve: (value: string | PromiseLike<string>) => void,
  reject: (reason?: any) => void
) {
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

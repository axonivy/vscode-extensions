import axios, { AxiosBasicCredentials } from 'axios';
import vscode from 'vscode';

const headers = { 'X-Requested-By': 'web-ide' };
const devAuth: AxiosBasicCredentials = { username: 'Developer', password: 'Developer' };
const paramsSerializer = { indexes: null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRequest(url: string, params?: any, auth: AxiosBasicCredentials = devAuth): Promise<any> {
  return axios.get(url, { params, auth, paramsSerializer }).then(response => response.data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function postRequest(url: string, data: any, auth: AxiosBasicCredentials = devAuth, params?: any): Promise<any> {
  return axios.post(url, data, { params, headers, auth }).then(response => response.data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteRequest(url: string, params?: any, auth: AxiosBasicCredentials = devAuth): Promise<any> {
  return axios.delete(url, { params, headers, auth }).then(response => response.data);
}

export async function pollWithProgress(url: string, title: string, expectedStatus = 200, ms = 2000) {
  const options = {
    location: vscode.ProgressLocation.Notification,
    cancellable: true,
    title
  };
  await vscode.window.withProgress(options, async (progress, token) => {
    progress.report({ message: url });
    while (!token.isCancellationRequested) {
      const status = await axios
        .get(url)
        .then(async response => response.status)
        .catch(() => undefined);
      if (status === expectedStatus) {
        return;
      }
      await wait(ms);
    }
    await Promise.reject(`Polling of "${title}" was cancelled.`);
  });
}

const wait = function (ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

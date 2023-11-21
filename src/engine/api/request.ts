import axios, { AxiosBasicCredentials } from 'axios';

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

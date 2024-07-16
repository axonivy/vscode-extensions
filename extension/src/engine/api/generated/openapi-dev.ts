/**
 * Generated by orval v6.31.0 🍺
 * Do not edit manually.
 * Axon Ivy
 */
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
export type WatchParams = {
  projectDir?: string[];
};

export type InitProjectParams = {
  projectName?: string;
  projectDir?: string;
};

export type DeployProjectsParams = {
  projectDir?: string[];
};

export type DeleteProjectParams = {
  projectDir?: string;
};

export type BuildParams = {
  projectDir?: string[];
};

/**
 * The geographic coordinate of the location
 */
export interface GeoPositionBean {
  /** Altitude in meters */
  altitude?: number;
  /** Latitute in degree (south) -90.0d..+90.0d (north) */
  latitude?: number;
  /** Longitude in degree (west) -180.0d..+180.0d (east) */
  longitude?: number;
}

export interface LocationBean {
  /** The address of the location, e.g., Baarerstrasse 12;6403 Zug;Switzerland */
  address?: string;
  /** The name of the location, e.g., Zug, Wien */
  name?: string;
  /** Additional note */
  note?: string;
  position?: GeoPositionBean;
  /** The timestamp when the location was created or updated */
  timestamp?: string;
  /** The type of the location, e.g., UserPosition, HeadQuarter, BranchOffice */
  type?: string;
}

export interface CaseBean {
  description?: string;
  documents?: DocumentBean[];
  id?: number;
  name?: string;
}

export interface TaskBean {
  activatorName?: string;
  case?: CaseBean;
  description?: string;
  expiryTimeStamp?: string;
  fullRequestPath?: string;
  id?: number;
  name?: string;
  offline?: boolean;
  priority?: number;
  startTimeStamp?: string;
  state?: number;
}

export interface StartCustomFieldBean {
  name?: string;
  value?: string;
}

export interface WebStartableBean {
  activatorName?: string;
  customFields?: StartCustomFieldBean[];
  description?: string;
  fullRequestPath?: string;
  id?: string;
  name?: string;
}

export interface ProcessStartBean {
  activatorName?: string;
  description?: string;
  fullRequestPath?: string;
  id?: number;
  name?: string;
}

export interface DocumentBean {
  id?: number;
  name?: string;
  path?: string;
  url?: string;
}

export interface MessageBean {
  document?: DocumentBean;
  message?: string;
  statusCode?: number;
}

export interface AggBean {
  [key: string]: unknown;
}

export interface WorkspaceInit {
  name: string;
}

export interface WorkspaceBean {
  baseUrl: string;
  id: string;
  name: string;
  running: boolean;
}

export interface NewProjectParams {
  defaultNamespace?: string;
  groupId?: string;
  name?: string;
  path?: string;
  projectId?: string;
}

export interface ProcessIdentifier {
  pid: string;
  project: ProjectIdentifier;
}

export type ProcessBeanKind = (typeof ProcessBeanKind)[keyof typeof ProcessBeanKind];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ProcessBeanKind = {
  NORMAL: 'NORMAL',
  WEB_SERVICE: 'WEB_SERVICE',
  CALLABLE_SUB: 'CALLABLE_SUB',
  HTML_DIALOG: 'HTML_DIALOG'
} as const;

export interface ProcessBean {
  kind: ProcessBeanKind;
  name: string;
  namespace: string;
  path?: string;
  processGroup?: string;
  processIdentifier: ProcessIdentifier;
  requestPath?: string;
  type?: string;
  uri?: string;
}

export interface ProjectIdentifier {
  app: string;
  pmv: string;
}

export interface ProcessInit {
  kind: string;
  name: string;
  namespace: string;
  path?: string;
  pid?: string;
  project?: ProjectIdentifier;
}

export interface HdInit {
  layout?: string;
  name: string;
  namespace: string;
  pid?: string;
  project?: ProjectIdentifier;
  projectDir?: string;
  template?: string;
  type?: string;
}

export interface FormIdentifier {
  id: string;
  project: ProjectIdentifier;
}

export interface HdBean {
  identifier: FormIdentifier;
  name: string;
  namespace?: string;
  path: string;
  type?: string;
  uri?: string;
}

export interface EngineInfo {
  engineName?: string;
  minimumSupportedMobileAppVersion?: string;
  version?: string;
}

export interface UserBean {
  emailAddress?: string;
  fullName?: string;
  language?: string;
  name?: string;
  uuid?: string;
}

export interface WebNotificationActionBean {
  link?: string;
  title?: string;
}

export interface WebNotificationBean {
  createdAt?: string;
  details?: WebNotificationActionBean;
  message?: string;
  read?: boolean;
  start?: WebNotificationActionBean;
  uuid?: string;
}

export type WebNotificationOperationOperation = (typeof WebNotificationOperationOperation)[keyof typeof WebNotificationOperationOperation];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const WebNotificationOperationOperation = {
  MARK_AS_READ: 'MARK_AS_READ'
} as const;

export interface WebNotificationOperation {
  operation?: WebNotificationOperationOperation;
}

export const forms = <TData = AxiosResponse<HdBean[]>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/forms`, options);
};

export const deleteForm = <TData = AxiosResponse<unknown>>(
  formIdentifier: FormIdentifier,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.delete(`/web-ide/form`, { data: formIdentifier, ...options });
};

export const createHd = <TData = AxiosResponse<HdBean>>(hdInit: HdInit, options?: AxiosRequestConfig): Promise<TData> => {
  return axios.post(`/web-ide/hd`, hdInit, options);
};

export const getProcesses = <TData = AxiosResponse<ProcessBean[]>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/processes`, options);
};

export const createProcess = <TData = AxiosResponse<ProcessBean>>(
  processInit: ProcessInit,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/process`, processInit, options);
};

export const deleteProcess = <TData = AxiosResponse<unknown>>(
  processIdentifier: ProcessIdentifier,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.delete(`/web-ide/process`, { data: processIdentifier, ...options });
};

export const projects = <TData = AxiosResponse<ProjectIdentifier[]>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/projects`, options);
};

export const watchProjects = <TData = AxiosResponse<unknown>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/projects/watch`, options);
};

export const build = <TData = AxiosResponse<unknown>>(params?: BuildParams, options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/project/build`, {
    ...options,
    params: { ...params, ...options?.params }
  });
};

export const createProject = <TData = AxiosResponse<unknown>>(
  newProjectParams: NewProjectParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/project`, newProjectParams, options);
};

export const deleteProject = <TData = AxiosResponse<unknown>>(
  params?: DeleteProjectParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.delete(`/web-ide/project`, {
    ...options,
    params: { ...params, ...options?.params }
  });
};

export const deployProjects = <TData = AxiosResponse<unknown>>(
  params?: DeployProjectsParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.get(`/web-ide/project/deploy`, {
    ...options,
    params: { ...params, ...options?.params }
  });
};

export const initProject = <TData = AxiosResponse<unknown>>(params?: InitProjectParams, options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/project/init`, {
    ...options,
    params: { ...params, ...options?.params }
  });
};

export const watch = <TData = AxiosResponse<unknown>>(params?: WatchParams, options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/project/watch`, {
    ...options,
    params: { ...params, ...options?.params }
  });
};

export const workspaces = <TData = AxiosResponse<WorkspaceBean[]>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/workspaces`, options);
};

export const createWorkspace = <TData = AxiosResponse<WorkspaceBean>>(
  workspaceInit: WorkspaceInit,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/workspace`, workspaceInit, options);
};

export const deleteWorkspace = <TData = AxiosResponse<unknown>>(
  deleteWorkspaceBody: string,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.delete(`/web-ide/workspace`, { data: deleteWorkspaceBody, ...options });
};

export type FormsResult = AxiosResponse<HdBean[]>;
export type DeleteFormResult = AxiosResponse<unknown>;
export type CreateHdResult = AxiosResponse<HdBean>;
export type GetProcessesResult = AxiosResponse<ProcessBean[]>;
export type CreateProcessResult = AxiosResponse<ProcessBean>;
export type DeleteProcessResult = AxiosResponse<unknown>;
export type ProjectsResult = AxiosResponse<ProjectIdentifier[]>;
export type WatchProjectsResult = AxiosResponse<unknown>;
export type BuildResult = AxiosResponse<unknown>;
export type CreateProjectResult = AxiosResponse<unknown>;
export type DeleteProjectResult = AxiosResponse<unknown>;
export type DeployProjectsResult = AxiosResponse<unknown>;
export type InitProjectResult = AxiosResponse<unknown>;
export type WatchResult = AxiosResponse<unknown>;
export type WorkspacesResult = AxiosResponse<WorkspaceBean[]>;
export type CreateWorkspaceResult = AxiosResponse<WorkspaceBean>;
export type DeleteWorkspaceResult = AxiosResponse<unknown>;

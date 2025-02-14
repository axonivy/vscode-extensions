/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * Axon Ivy
 */
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
export type WebNotificationOperationOperation = (typeof WebNotificationOperationOperation)[keyof typeof WebNotificationOperationOperation];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const WebNotificationOperationOperation = {
  MARK_AS_READ: 'MARK_AS_READ'
} as const;

export interface WebNotificationOperation {
  operation?: WebNotificationOperationOperation;
}

export interface WebNotificationActionBean {
  link?: string;
  title?: string;
}

export interface WebNotificationBean {
  uuid?: string;
  createdAt?: string;
  read?: boolean;
  message?: string;
  details?: WebNotificationActionBean;
  start?: WebNotificationActionBean;
}

export interface UserBean {
  uuid?: string;
  name?: string;
  fullName?: string;
  emailAddress?: string;
  language?: string;
}

export interface EngineInfo {
  version?: string;
  engineName?: string;
  minimumSupportedMobileAppVersion?: string;
}

export interface ConfigurationIdentifier {
  path: string;
  project: ProjectIdentifier;
}

export interface ProjectIdentifier {
  app: string;
  pmv: string;
  isIar?: boolean;
}

export interface ConfigurationBean {
  id: ConfigurationIdentifier;
  content: string;
}

export interface DataClassBean {
  name: string;
  simpleName: string;
  dataClassIdentifier: DataClassIdentifier;
  path: string;
  isEntityClass: boolean;
  isBusinessCaseData: boolean;
}

export interface DataClassIdentifier {
  project: ProjectIdentifier;
  name: string;
}

export interface DataClassInit {
  name: string;
  project?: ProjectIdentifier;
  projectDir?: string;
}

export interface FormIdentifier {
  project: ProjectIdentifier;
  id: string;
}

export interface HdBean {
  identifier: FormIdentifier;
  name: string;
  namespace?: string;
  path: string;
  type?: string;
  uri?: string;
}

export interface HdInit {
  namespace: string;
  name: string;
  type?: string;
  template?: string;
  layout?: string;
  projectDir?: string;
  pid?: string;
  project?: ProjectIdentifier;
  dataClass?: DataClassIdentifier;
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
  name: string;
  namespace: string;
  processIdentifier: ProcessIdentifier;
  path?: string;
  requestPath?: string;
  processGroup?: string;
  kind: ProcessBeanKind;
  type?: string;
  uri?: string;
}

export interface ProcessIdentifier {
  project: ProjectIdentifier;
  pid: string;
}

export interface ProcessInit {
  name: string;
  namespace: string;
  path?: string;
  kind: string;
  pid?: string;
  project?: ProjectIdentifier;
}

export interface ProjectBean {
  artifactId: string;
  groupId: string;
  id: ProjectIdentifier;
  version: string;
  isDeletable: boolean;
  defaultNamespace: string;
}

export interface NewProjectParams {
  name?: string;
  groupId?: string;
  projectId?: string;
  defaultNamespace?: string;
  path?: string;
}

export interface ProjectParams {
  name?: string;
  path?: string;
}

export interface AggBean {
  [key: string]: unknown;
}

export interface DocumentBean {
  id?: number;
  name?: string;
  url?: string;
  path?: string;
}

export interface MessageBean {
  message?: string;
  statusCode?: number;
  document?: DocumentBean;
}

export interface ProcessStartBean {
  id?: number;
  name?: string;
  description?: string;
  activatorName?: string;
  fullRequestPath?: string;
}

export interface StartCustomFieldBean {
  name?: string;
  value?: string;
}

export interface WebStartableBean {
  id?: string;
  name?: string;
  description?: string;
  activatorName?: string;
  fullRequestPath?: string;
  customFields?: StartCustomFieldBean[];
}

export interface CaseBean {
  id?: number;
  name?: string;
  description?: string;
  documents?: DocumentBean[];
}

export interface TaskBean {
  id?: number;
  name?: string;
  description?: string;
  startTimeStamp?: string;
  expiryTimeStamp?: string;
  priority?: number;
  state?: number;
  activatorName?: string;
  fullRequestPath?: string;
  offline?: boolean;
  case?: CaseBean;
}

/**
 * The geographic coordinate of the location
 */
export interface GeoPositionBean {
  /** Latitute in degree (south) -90.0d..+90.0d (north) */
  latitude?: number;
  /** Longitude in degree (west) -180.0d..+180.0d (east) */
  longitude?: number;
  /** Altitude in meters */
  altitude?: number;
}

export interface LocationBean {
  /** The name of the location, e.g., Zug, Wien */
  name?: string;
  /** The type of the location, e.g., UserPosition, HeadQuarter, BranchOffice */
  type?: string;
  /** Additional note */
  note?: string;
  /** The address of the location, e.g., Baarerstrasse 12;6403 Zug;Switzerland */
  address?: string;
  /** The timestamp when the location was created or updated */
  timestamp?: string;
  position?: GeoPositionBean;
}

export type ReadConfigParams = {
  path?: string;
  app?: string;
  pmv?: string;
};

export type DeleteProjectParams = {
  projectDir?: string;
  app?: string;
  pmv?: string;
};

export type StopBpmEngineParams = {
  app?: string;
  pmv?: string;
  projectDir?: string;
};

export const configurations = <TData = AxiosResponse<ConfigurationIdentifier[]>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/configurations`, options);
};

export const readConfig = <TData = AxiosResponse<ConfigurationBean>>(
  params?: ReadConfigParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.get(`/web-ide/configuration`, {
    ...options,
    params: { ...params, ...options?.params }
  });
};

export const writeConfig = <TData = AxiosResponse<ConfigurationBean>>(
  configurationBean: ConfigurationBean,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/configuration`, configurationBean, options);
};

export const dataClasses = <TData = AxiosResponse<DataClassBean[]>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/dataclasses`, options);
};

export const createDataClass = <TData = AxiosResponse<DataClassBean>>(
  dataClassInit: DataClassInit,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/dataclass`, dataClassInit, options);
};

export const deleteDataClass = <TData = AxiosResponse<DataClassIdentifier>>(
  dataClassIdentifier: DataClassIdentifier,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.delete(`/web-ide/dataclass`, { data: dataClassIdentifier, ...options });
};

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

export const buildProjects = <TData = AxiosResponse<unknown>>(
  buildProjectsBody: string[],
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/projects/build`, buildProjectsBody, options);
};

export const deployProjects = <TData = AxiosResponse<unknown>>(
  deployProjectsBody: string[],
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/projects/deploy`, deployProjectsBody, options);
};

export const projects = <TData = AxiosResponse<ProjectBean[]>>(options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/projects`, options);
};

export const createPmvAndProjectFiles = <TData = AxiosResponse<unknown>>(
  newProjectParams: NewProjectParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/project/new`, newProjectParams, options);
};

export const findOrCreatePmv = <TData = AxiosResponse<unknown>>(
  projectParams: ProjectParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/project`, projectParams, options);
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

export const stopBpmEngine = <TData = AxiosResponse<unknown>>(
  params?: StopBpmEngineParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/project/stop-bpm-engine`, undefined, {
    ...options,
    params: { ...params, ...options?.params }
  });
};

export const dependencies = <TData = AxiosResponse<ProjectIdentifier[]>>(
  app: string,
  pmv: string,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.get(`/web-ide/project/${app}/${pmv}/dependencies`, options);
};

export const addDependency = <TData = AxiosResponse<unknown>>(
  app: string,
  pmv: string,
  projectIdentifier: ProjectIdentifier,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/project/${app}/${pmv}/dependency`, projectIdentifier, options);
};

export const removeDependency = <TData = AxiosResponse<unknown>>(
  app: string,
  pmv: string,
  dependencyApp: string,
  dependencyPmv: string,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.delete(`/web-ide/project/${app}/${pmv}/dependency/${dependencyApp}/${dependencyPmv}`, options);
};

export type ConfigurationsResult = AxiosResponse<ConfigurationIdentifier[]>;
export type ReadConfigResult = AxiosResponse<ConfigurationBean>;
export type WriteConfigResult = AxiosResponse<ConfigurationBean>;
export type DataClassesResult = AxiosResponse<DataClassBean[]>;
export type CreateDataClassResult = AxiosResponse<DataClassBean>;
export type DeleteDataClassResult = AxiosResponse<DataClassIdentifier>;
export type FormsResult = AxiosResponse<HdBean[]>;
export type DeleteFormResult = AxiosResponse<unknown>;
export type CreateHdResult = AxiosResponse<HdBean>;
export type GetProcessesResult = AxiosResponse<ProcessBean[]>;
export type CreateProcessResult = AxiosResponse<ProcessBean>;
export type DeleteProcessResult = AxiosResponse<unknown>;
export type BuildProjectsResult = AxiosResponse<unknown>;
export type DeployProjectsResult = AxiosResponse<unknown>;
export type ProjectsResult = AxiosResponse<ProjectBean[]>;
export type CreatePmvAndProjectFilesResult = AxiosResponse<unknown>;
export type FindOrCreatePmvResult = AxiosResponse<unknown>;
export type DeleteProjectResult = AxiosResponse<unknown>;
export type StopBpmEngineResult = AxiosResponse<unknown>;
export type DependenciesResult = AxiosResponse<ProjectIdentifier[]>;
export type AddDependencyResult = AxiosResponse<unknown>;
export type RemoveDependencyResult = AxiosResponse<unknown>;

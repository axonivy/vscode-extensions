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

export interface WorkspaceBean {
  id: string;
  name: string;
  baseUrl: string;
  running: boolean;
}

export interface WorkspaceInit {
  name: string;
  path?: string;
}

export interface MarketInstallResult {
  installedProjects: ProjectIdentifier[];
  demoProcesses: ProcessBean[];
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

export interface ProjectIdentifier {
  app: string;
  pmv: string;
  isIar?: boolean;
}

export interface ProductInstallParams {
  productJson: string;
  dependentProject?: ProjectIdentifier;
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

export type ImportProjectsBody = {
  file?: Blob;
  dependentProject?: Blob;
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

export const exportWorkspace = <TData = AxiosResponse<unknown>>(id: string, options?: AxiosRequestConfig): Promise<TData> => {
  return axios.get(`/web-ide/workspace/${id}`, options);
};

export const importProjects = <TData = AxiosResponse<unknown>>(
  id: string,
  importProjectsBody: ImportProjectsBody,
  options?: AxiosRequestConfig
): Promise<TData> => {
  const formData = new FormData();
  if (importProjectsBody.file !== undefined) {
    formData.append('file', importProjectsBody.file);
  }
  if (importProjectsBody.dependentProject !== undefined) {
    formData.append('dependentProject', importProjectsBody.dependentProject);
  }

  return axios.post(`/web-ide/workspace/${id}`, formData, options);
};

export const deleteWorkspace = <TData = AxiosResponse<unknown>>(id: string, options?: AxiosRequestConfig): Promise<TData> => {
  return axios.delete(`/web-ide/workspace/${id}`, options);
};

export const installMarketProduct = <TData = AxiosResponse<MarketInstallResult>>(
  id: string,
  productInstallParams: ProductInstallParams,
  options?: AxiosRequestConfig
): Promise<TData> => {
  return axios.post(`/web-ide/workspace/install/${id}`, productInstallParams, options);
};

export type WorkspacesResult = AxiosResponse<WorkspaceBean[]>;
export type CreateWorkspaceResult = AxiosResponse<WorkspaceBean>;
export type ExportWorkspaceResult = AxiosResponse<unknown>;
export type ImportProjectsResult = AxiosResponse<unknown>;
export type DeleteWorkspaceResult = AxiosResponse<unknown>;
export type InstallMarketProductResult = AxiosResponse<MarketInstallResult>;

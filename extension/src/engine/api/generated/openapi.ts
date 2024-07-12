/**
 * Generated by orval v6.31.0 🍺
 * Do not edit manually.
 * Axon Ivy
 */
import axios from 'axios'
import type {
  AxiosRequestConfig,
  AxiosResponse
} from 'axios'
export type Stats1Params = {
/**
 * The aggregation query to make bucket (grouping) or metric aggregations like average, max, min, or sum.
You can cluster tasks in buckets, as deep as you like, and optionally a metric as a terminal operation on such buckets.

${field1}:${operation1}:${payload1},${field2}:${operation2}:${payload2},${fieldX}:${operationX}:${payloadX}

All available fields:
- state (string)
- businessState (string)
- priority (string)
- category (string)
- isExpired (bool)
- worker.name (string)
- activator.name (string)
- originalActivator.name (string)
- businessRuntime (number)
- workingTime (number)
- numberOfResumes (number)
- startTimestamp (date)
- modifiedTimestamp (date)
- endTimestamp (date)
- expiryTimestamp (date)
- customFields.strings.* (string)
- customFields.numbers.* (number)
- customFields.timestamps.* (datetime)

Available operations for string fields:
- bucket

Available operations for bool fields:
- bucket

Available operations for datetime fields:
- bucket:interval (interval: year, month, week, day, hour [default: day])
- max
- min
- avg

Available operations for number fields:
- bucket:interval (interval: number [default: 1])
- max
- min
- avg
- sum

Limitations:
In a query,
- You can use a field only once.
- A metrics (avg, max, min, sum) needs to be the last operation.
- You can use one metric aggregation only once.

Result:
- A bucket contains always a 'key' and a 'count'. It may contain sub-aggregations with sub-buckets or metrics.
- A metric contains just a 'value' as a string.
- Datetime strings are always in ISO 8601 format e.g., 2023-02-15T13:06:42Z

 */
agg: string;
/**
 * Filter to limit the tasks on which the aggregation is performed. You can
filter by multiple fields at once. Each expression is AND connected.

${field1}:${expression1},${field2}:${expression2},${fieldX}:${expressionX}

e.g.
- businessState:DONE,activator.name:#alex,numberOfResumes:>5

For string fields, you can use multiple values which (separated by a space) are OR connected, e.g.:
- businessState:DONE DESTROYED

You can make range filters for datetime and number fields with <, >, >= and <=. Datetimes must
be formatted in ISO 8601 format, e.g.:
- numberOfResumes:>5 <10
- numberOfResumes:>=5
- numberOfResumes:<=10
- startTimestamp:>2023-02-15T13:06:42Z

Additional filter canWorkOn:[memberName]
canWorkOn is an additional filter that is only available for filtering but not for aggregation.
If you don't specify a memberName then the canWorkOn filter will be applied to the current user session,
otherwise to the given memberName. The memberName of the role is the role name itself e.g. Everybody.
The memberName of a user is a hashtag # followed by the user name e.g. #alex.

Limitations:
- If you use the canWorkOn filter for a user, then you can not specify a filter for state and worker.name.
- If you use the canWorkOn filter for a role, then you can not specify a filter for state and activator.name.
- You can provide only one member (user or role).

e.g:
- canWorkOn
- canWorkOn:#alex
- canWorkOn:Everybody

Escaping:
If you have values that contains whitespaces then you need to escape the value e.g. canWorkOn:"IT Manager"
If you want to use quotes within such values you need to escape them with " e.g. canWorkOn:"IT"Manager"


 */
filter?: string;
};

export type Paged1Params = {
/**
 * Page number 1..n
 */
page?: number;
/**
 * Page size 1..n. Number of web startables per page
 */
pageSize?: number;
};

export type AddBody = {
  file?: Blob;
};

export type StatsParams = {
/**
 * The aggregation query to make bucket (grouping) or metric aggregations like average, max, min or, sum.
You can cluster cases in buckets, as deep as you like, and optionally a metric as a terminal operation on such buckets.

${field1}:${operation1}:${payload1},${field2}:${operation2}:${payload2},${fieldX}:${operationX}:${payloadX}

All available fields:
- state (string)
- businessState (string)
- priority (string)
- category (string)
- stage (string)
- isBusinessCase (bool)
- creator.name (string)
- owner.name (string)
- businessRuntime (number)
- workingTime (number)
- startTimestamp (date)
- modifiedTimestamp (date)
- endTimestamp (date)
- customFields.strings.* (string)
- customFields.numbers.* (number)
- customFields.timestamps.* (datetime)

Available operations for string fields:
- bucket

Available operations for bool fields:
- bucket

Available operations for datetime fields:
- bucket:interval (interval: year, month, week, day, hour [default: day])
- max
- min
- avg

Available operations for number fields:
- bucket:interval (interval: number [default: 1])
- max
- min
- avg
- sum

Limitations:
In a query,
- You can use a field only once.
- A metrics (avg, max, min, sum) needs to be the last operation.
- You can use one metric aggregation only once.

Result:
- A bucket contains always a 'key' and a 'count'. It may contain sub-aggregations with sub-buckets or metrics.
- A metric contains just a 'value' as a string.
- Datetime strings are always in ISO 8601 format e.g., 2023-02-15T13:06:42Z

 */
agg: string;
/**
 * Filter to limit the cases on which the aggregation is performed. You can
filter by multiple fields at once. Each expression is AND connected.

${field1}:${expression1},${field2}:${expression2},${fieldX}:${expressionX}

e.g.
- businessState:DONE,creator.name:alex,numberOfResumes:>5

For string fields, you can use multiple values which (separated by a space) are OR connected, e.g.:
- businessState:DONE DESTROYED

You can make range filters for datetime and number fields with <, >, >= and <=. Datetimes must
be formatted in ISO 8601 format, e.g.:
- businessRuntime:>5 <10
- businessRuntime:>=5
- businessRuntime:<=10
- startTimestamp:>2023-02-15T13:06:42Z

Additionally, to the fields that are supported in the agg parameter, you can also use all fields supported
by the agg parameter of the /worfklow/task/stats resources. Those parameters are only available for filtering
but not for aggregation. They need to be prefixed with 'tasks.', e.g.:
- tasks.state
- tasks.worker.name
- tasks.customFields.strings.*
- ...

Additional filter tasks.canWorkOn:[memberName]
tasks.canWorkOn is an additional filter that is only available for filtering but not for aggregation.
If you don't specify a memberName then the canWorkOn filter will be applied to the current user session,
otherwise to the given memberName. The memberName of the role is the role name itself e.g. Everybody.
The memberName of a user is a hashtag # followed by the user name e.g. #alex.

Limitations:
- If you use the tasks.canWorkOn filter for a user, then you can not specify a filter for tasks.state and tasks.worker.name.
- If you use the tasks.canWorkOn filter for a role, then you can not specify a filter for tasks.state and tasks.activator.name.
- You can provide only one member (user or role).

e.g:
- tasks.canWorkOn
- tasks.canWorkOn:#alex
- tasks.canWorkOn:Everybody

Additional filter isInvolved:[memberName]
isInvolved is an additional filter that is only available for filtering but not for aggregation.
If you don't specify a memberName then the isInvolved filter will be applied to the current user session,
otherwise to the given memberName. The memberName of the role is the role name itself e.g. Everybody.
The memberName of a user is a hashtag # followed by the user name e.g. #alex.

Limitations:
- If you use the isInvolved filter for a user, then you can not specify a filter for creator.name, tasks.state, and tasks.worker.name.
- If you use the isInvolved filter for a role, then you can not specify a filter for tasks.state and tasks.activator.name.
- You can provide only one member (user or role).

e.g:
- isInvolved
- isInvolved:#alex
- isInvolved:Everybody

Escaping:
If you have values that contains whitespaces then you need to escape the value e.g. owner.name:"IT Manager"
If you want to use quotes within such values you need to escape them with " e.g. owner.name:"IT"Manager"

 */
filter?: string;
};

export type Watch1Params = {
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

export type PagedParams = {
/**
 * Page number 1..n
 */
page?: number;
/**
 * Page size 1..n. Number of web notifications per page
 */
pageSize?: number;
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

export interface AggBean { [key: string]: unknown }

export interface WorkspaceInit {
  name?: string;
}

export interface WorkspaceBean {
  baseUrl?: string;
  id?: string;
  name?: string;
  running?: boolean;
}

export interface NewProjectParams {
  defaultNamespace?: string;
  groupId?: string;
  name?: string;
  path?: string;
  projectId?: string;
}

export interface ProcessIdentifier {
  pid?: string;
  project?: ProjectIdentifier;
}

export type ProcessBeanKind = typeof ProcessBeanKind[keyof typeof ProcessBeanKind];


// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ProcessBeanKind = {
  NORMAL: 'NORMAL',
  WEB_SERVICE: 'WEB_SERVICE',
  CALLABLE_SUB: 'CALLABLE_SUB',
  HTML_DIALOG: 'HTML_DIALOG',
} as const;

export interface ProcessBean {
  kind?: ProcessBeanKind;
  name?: string;
  namespace?: string;
  path?: string;
  processGroup?: string;
  processIdentifier?: ProcessIdentifier;
  requestPath?: string;
  type?: string;
}

export interface ProjectIdentifier {
  app?: string;
  pmv?: string;
}

export interface ProcessInit {
  kind?: string;
  name?: string;
  namespace?: string;
  path?: string;
  pid?: string;
  project?: ProjectIdentifier;
}

export interface HdInit {
  layout?: string;
  name?: string;
  namespace?: string;
  pid?: string;
  project?: ProjectIdentifier;
  projectDir?: string;
  template?: string;
  type?: string;
}

export interface FormIdentifier {
  id?: string;
  project?: ProjectIdentifier;
}

export interface FormBean {
  identifier?: FormIdentifier;
  name?: string;
  namespace?: string;
  path?: string;
  type?: string;
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

export type WebNotificationOperationOperation = typeof WebNotificationOperationOperation[keyof typeof WebNotificationOperationOperation];


// eslint-disable-next-line @typescript-eslint/no-redeclare
export const WebNotificationOperationOperation = {
  MARK_AS_READ: 'MARK_AS_READ',
} as const;

export interface WebNotificationOperation {
  operation?: WebNotificationOperationOperation;
}





  /**
 * Returns web notifications for the current user.
 */
export const paged = <TData = AxiosResponse<WebNotificationBean[]>>(
    params?: PagedParams, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/notifications`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

/**
 * Hides all web notifications for the current user.
 */
export const hideAll = <TData = AxiosResponse<unknown>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.delete(
      `/notifications`,options
    );
  }

/**
 * Returns the total and unread size of web notifications for the current user.
 */
export const head = <TData = AxiosResponse<void>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.head(
      `/notifications`,options
    );
  }

/**
 * Marks all web notifications for the current user as read.
 */
export const operation = <TData = AxiosResponse<unknown>>(
    webNotificationOperation: WebNotificationOperation, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.patch(
      `/notifications`,
      webNotificationOperation,options
    );
  }

/**
 * Returns the web notification for the current user with the given uuid
 */
export const get = <TData = AxiosResponse<WebNotificationBean>>(
    uuid: string, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/notifications/${uuid}`,options
    );
  }

/**
 * Hides the web notification for the current user and the given uuid.
 */
export const hide = <TData = AxiosResponse<unknown>>(
    uuid: string, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.delete(
      `/notifications/${uuid}`,options
    );
  }

/**
 * Marks the web notification for the current user and the given uuid as read.
 */
export const operation1 = <TData = AxiosResponse<unknown>>(
    uuid: string,
    webNotificationOperation: WebNotificationOperation, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.patch(
      `/notifications/${uuid}`,
      webNotificationOperation,options
    );
  }

/**
 * Returns the current user.
 */
export const me = <TData = AxiosResponse<UserBean>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/me`,options
    );
  }

/**
 * Returns the version and the name of the engine
 */
export const getInfo = <TData = AxiosResponse<EngineInfo>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/engine/info`,options
    );
  }

export const forms = <TData = AxiosResponse<FormBean[]>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/forms`,options
    );
  }

export const _delete = <TData = AxiosResponse<unknown>>(
    formIdentifier: FormIdentifier, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.delete(
      `/web-ide/form`,{data:
      formIdentifier, ...options}
    );
  }

export const createHd = <TData = AxiosResponse<unknown>>(
    hdInit: HdInit, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.post(
      `/web-ide/hd`,
      hdInit,options
    );
  }

export const getProcesses = <TData = AxiosResponse<ProcessBean[]>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/processes`,options
    );
  }

export const create = <TData = AxiosResponse<unknown>>(
    processInit: ProcessInit, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.post(
      `/web-ide/process`,
      processInit,options
    );
  }

export const delete1 = <TData = AxiosResponse<unknown>>(
    processIdentifier: ProcessIdentifier, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.delete(
      `/web-ide/process`,{data:
      processIdentifier, ...options}
    );
  }

export const projects = <TData = AxiosResponse<ProjectIdentifier[]>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/projects`,options
    );
  }

export const watch = <TData = AxiosResponse<unknown>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/projects/watch`,options
    );
  }

export const build = <TData = AxiosResponse<unknown>>(
    params?: BuildParams, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/project/build`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

export const createProject = <TData = AxiosResponse<unknown>>(
    newProjectParams: NewProjectParams, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.post(
      `/web-ide/project`,
      newProjectParams,options
    );
  }

export const deleteProject = <TData = AxiosResponse<unknown>>(
    params?: DeleteProjectParams, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.delete(
      `/web-ide/project`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

export const deployProjects = <TData = AxiosResponse<unknown>>(
    params?: DeployProjectsParams, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/project/deploy`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

export const initProject = <TData = AxiosResponse<unknown>>(
    params?: InitProjectParams, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/project/init`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

export const watch1 = <TData = AxiosResponse<unknown>>(
    params?: Watch1Params, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/project/watch`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

export const workspaces = <TData = AxiosResponse<WorkspaceBean[]>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/web-ide/workspaces`,options
    );
  }

export const createWorkspace = <TData = AxiosResponse<WorkspaceBean>>(
    workspaceInit: WorkspaceInit, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.post(
      `/web-ide/workspace`,
      workspaceInit,options
    );
  }

export const deleteWorkspace = <TData = AxiosResponse<unknown>>(
    deleteWorkspaceBody: string, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.delete(
      `/web-ide/workspace`,{data:
      deleteWorkspaceBody, ...options}
    );
  }

/**
 * Returns case statistics.
 */
export const stats = <TData = AxiosResponse<AggBean>>(
    params: StatsParams, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/cases/stats`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

export const add = <TData = AxiosResponse<MessageBean>>(
    caseId: number,
    addBody: AddBody, options?: AxiosRequestConfig
 ): Promise<TData> => {const formData = new FormData();
if(addBody.file !== undefined) {
 formData.append('file', addBody.file)
 }

    return axios.post(
      `/workflow/case/${caseId}/document`,
      formData,options
    );
  }

export const getContent = <TData = AxiosResponse<unknown>>(
    caseId: number,
    documentId: number, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/case/${caseId}/document/${documentId}`,options
    );
  }

export const delete2 = <TData = AxiosResponse<MessageBean>>(
    caseId: number,
    documentId: number, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.delete(
      `/workflow/case/${caseId}/document/${documentId}`,options
    );
  }

/**
 * Deprecated instead use workflow/startables. Returns all process starts that can be started by the current user.
 * @deprecated
 */
export const get1 = <TData = AxiosResponse<ProcessStartBean[]>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/processstarts`,options
    );
  }

/**
 * Returns all web startables that can be started by the current user.
 */
export const paged1 = <TData = AxiosResponse<WebStartableBean[]>>(
    params?: Paged1Params, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/startables`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

/**
 * Returns the total size of web startables that can be started by the current user.
 */
export const head1 = <TData = AxiosResponse<void>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.head(
      `/workflow/startables`,options
    );
  }

/**
 * Returns the number of tasks the current user can work on.
 */
export const count = <TData = AxiosResponse<number>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/tasks/count`,options
    );
  }

/**
 * Returns the tasks the current user can work on.
 */
export const getTasks = <TData = AxiosResponse<TaskBean[]>>(
     options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/tasks`,options
    );
  }

/**
 * Returns the task with the given task identifier.
 */
export const getTask = <TData = AxiosResponse<TaskBean>>(
    taskId: number, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/task/${taskId}`,options
    );
  }

/**
 * Returns the locations of the task with the given taskId.
 */
export const getLocations = <TData = AxiosResponse<LocationBean>>(
    taskId: number, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/task/${taskId}/locations`,options
    );
  }

/**
 * Returns task statistics.
 */
export const stats1 = <TData = AxiosResponse<AggBean>>(
    params: Stats1Params, options?: AxiosRequestConfig
 ): Promise<TData> => {
    return axios.get(
      `/workflow/tasks/stats`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

export type PagedResult = AxiosResponse<WebNotificationBean[]>
export type HideAllResult = AxiosResponse<unknown>
export type HeadResult = AxiosResponse<void>
export type OperationResult = AxiosResponse<unknown>
export type GetResult = AxiosResponse<WebNotificationBean>
export type HideResult = AxiosResponse<unknown>
export type Operation1Result = AxiosResponse<unknown>
export type MeResult = AxiosResponse<UserBean>
export type GetInfoResult = AxiosResponse<EngineInfo>
export type FormsResult = AxiosResponse<FormBean[]>
export type _DeleteResult = AxiosResponse<unknown>
export type CreateHdResult = AxiosResponse<unknown>
export type GetProcessesResult = AxiosResponse<ProcessBean[]>
export type CreateResult = AxiosResponse<unknown>
export type Delete1Result = AxiosResponse<unknown>
export type ProjectsResult = AxiosResponse<ProjectIdentifier[]>
export type WatchResult = AxiosResponse<unknown>
export type BuildResult = AxiosResponse<unknown>
export type CreateProjectResult = AxiosResponse<unknown>
export type DeleteProjectResult = AxiosResponse<unknown>
export type DeployProjectsResult = AxiosResponse<unknown>
export type InitProjectResult = AxiosResponse<unknown>
export type Watch1Result = AxiosResponse<unknown>
export type WorkspacesResult = AxiosResponse<WorkspaceBean[]>
export type CreateWorkspaceResult = AxiosResponse<WorkspaceBean>
export type DeleteWorkspaceResult = AxiosResponse<unknown>
export type StatsResult = AxiosResponse<AggBean>
export type AddResult = AxiosResponse<MessageBean>
export type GetContentResult = AxiosResponse<unknown>
export type Delete2Result = AxiosResponse<MessageBean>
export type Get1Result = AxiosResponse<ProcessStartBean[]>
export type Paged1Result = AxiosResponse<WebStartableBean[]>
export type Head1Result = AxiosResponse<void>
export type CountResult = AxiosResponse<number>
export type GetTasksResult = AxiosResponse<TaskBean[]>
export type GetTaskResult = AxiosResponse<TaskBean>
export type GetLocationsResult = AxiosResponse<LocationBean>
export type Stats1Result = AxiosResponse<AggBean>

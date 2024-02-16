export const API_PATH = 'api/web-ide';

export type SourcePath =
  | 'dev-security-context'
  | 'project'
  | 'project/init'
  | 'project/deploy'
  | 'project/deactivate'
  | 'project/activate'
  | 'process'
  | 'hd';
export type Request = { path: SourcePath; description: string };

export const DEV_CONTEXT: Readonly<Request> = { path: 'dev-security-context', description: 'Init dev Security Context' };
export const INIT_PROJECT: Readonly<Request> = { path: 'project/init', description: 'Initialize Ivy Project' };
export const DEACTIVATE_PROJECTS: Readonly<Request> = { path: 'project/deactivate', description: 'Deactivate Ivy Projects' };
export const ACTIVATE_PROJECTS: Readonly<Request> = { path: 'project/activate', description: 'Activate Ivy Project' };
export const DEPLOY_PROJECTS: Readonly<Request> = { path: 'project/deploy', description: 'Deploy Ivy Projects' };
export const CREATE_PROCESS: Readonly<Request> = { path: 'process', description: 'Create new Process' };
export const CREATE_PROJECT: Readonly<Request> = { path: 'project', description: 'Create new Project' };
export const CREATE_USER_DIALOG: Readonly<Request> = { path: 'hd', description: 'Create User Dialog' };
export const DELETE_PROJECT: Readonly<Request> = { path: 'project', description: 'Delete Project' };

export type ProjectRequest = { sourcePath: string; description: string };

export const INIT_PROJECT_REQUEST = { sourcePath: 'init-project', description: 'Initialize Ivy Project' };
export const DEACTIVATE_PROJECTS_REQUEST = { sourcePath: 'deactivate-projects', description: 'Deactivate Ivy Projects' };
export const ACTIVATE_PROJECTS_REQUEST = { sourcePath: 'activate-projects', description: 'Activate Ivy Project' };
export const DEPLOY_PROJECTS_REQUEST = { sourcePath: 'deploy-projects', description: 'Deploy Ivy Projects' };
export const CREATE_PROCESS_REQUEST = { sourcePath: 'create-process', description: 'Create new Process' };
export const CREATE_PROJECT_REQUEST = { sourcePath: 'create-project', description: 'Create new Project' };
export const DELETE_PROJECT_REQUEST = { sourcePath: 'delete-project', description: 'Delete Project' };

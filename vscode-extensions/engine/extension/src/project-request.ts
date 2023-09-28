export type ProjectRequest = { sourcePath: string; description: string };

export const INIT_PROJECT_REQUEST: ProjectRequest = { sourcePath: 'init-project', description: 'Initialize Ivy Project' };
export const DEACTIVATE_PROJECTS_REQUEST: ProjectRequest = { sourcePath: 'deactivate-projects', description: 'Deactivate Ivy Projects' };
export const ACTIVATE_PROJECTS_REQUEST: ProjectRequest = { sourcePath: 'activate-projects', description: 'Activate Ivy Project' };
export const DEPLOY_PROJECTS_REQUEST: ProjectRequest = { sourcePath: 'deploy-projects', description: 'Deploy Ivy Projects' };
export const BUILD_PROJECTS_REQUEST: ProjectRequest = { sourcePath: 'build-projects', description: 'Build Ivy Projects' };

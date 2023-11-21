import * as vscode from 'vscode';

export type ProjectRequest = { sourcePath: string; description: string };

export const INIT_PROJECT_REQUEST: Readonly<ProjectRequest> = { sourcePath: 'init-project', description: 'Initialize Ivy Project' };
export const DEACTIVATE_PROJECTS_REQUEST: Readonly<ProjectRequest> = {
  sourcePath: 'deactivate-projects',
  description: 'Deactivate Ivy Projects'
};
export const ACTIVATE_PROJECTS_REQUEST: Readonly<ProjectRequest> = { sourcePath: 'activate-projects', description: 'Activate Ivy Project' };
export const DEPLOY_PROJECTS_REQUEST: Readonly<ProjectRequest> = { sourcePath: 'deploy-projects', description: 'Deploy Ivy Projects' };
export const CREATE_PROCESS_REQUEST: Readonly<ProjectRequest> = { sourcePath: 'create-process', description: 'Create new Process' };
export const CREATE_PROJECT_REQUEST: Readonly<ProjectRequest> = { sourcePath: 'create-project', description: 'Create new Project' };
export const DELETE_PROJECT_REQUEST: Readonly<ProjectRequest> = { sourcePath: 'delete-project', description: 'Delete Project' };

export function toProgressOptions(projectRequest: ProjectRequest) {
  return {
    location: vscode.ProgressLocation.Window,
    title: projectRequest.description,
    cancellable: false
  };
}

import * as vscode from 'vscode';

const config = vscode.workspace.getConfiguration();

export const engineRunEmbedded = config.get<boolean>('engine.runEmbedded');
export const engineUrl = config.get<string>('engine.url');
export const projectExcludePattern = config.get<string>('project.excludePattern');
export const projectMaximumNumber = config.get<number>('project.maximumNumber');

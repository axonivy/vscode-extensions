import * as vscode from 'vscode';
import { Entry } from './ivy-project-tree-data-provider';
import { Command, executeCommand } from '../base/commands';
import path from 'path';

export type TreeSelection = Entry | vscode.Uri | undefined;

export async function executeTreeSelectionCommand(command: Command, selection: TreeSelection, ivyProjects: Promise<string[]>) {
  treeSelectionToProjectPath(selection, ivyProjects).then(selectionPath => selectionPath && executeCommand(command, selectionPath));
}

export async function treeSelectionToProjectPath(selection: TreeSelection, ivyProjects: Promise<string[]>): Promise<string | undefined> {
  return treeSelectionToUri(selection).then(uri => findMatchingProject(ivyProjects, uri));
}

export async function treeSelectionToUri(selection: TreeSelection): Promise<vscode.Uri> {
  if (!selection) {
    return selectionFromExplorer();
  }
  if (selection instanceof vscode.Uri) {
    return selection;
  }
  return selection.uri;
}

// no api available yet, see https://github.com/microsoft/vscode/issues/3553
async function selectionFromExplorer(): Promise<vscode.Uri> {
  const originalClipboard = await vscode.env.clipboard.readText();
  await executeCommand('copyFilePath');
  const filePath = await vscode.env.clipboard.readText();
  vscode.env.clipboard.writeText(originalClipboard);
  return vscode.Uri.file(filePath);
}

async function findMatchingProject(ivyProjects: Promise<string[]>, selectedUri: vscode.Uri): Promise<string | undefined> {
  return ivyProjects.then(projects =>
    projects.find(project => selectedUri.fsPath === project || selectedUri.fsPath.startsWith(project + path.sep))
  );
}

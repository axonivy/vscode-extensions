import { executeCommand } from '../base/commands';
import * as vscode from 'vscode';
import { defaultNamespaceOf } from './util';

export type DialogType = 'Html Dialog' | 'Offline Dialog';

const templates = [
  'Page Responsive Grid 2 Columns',
  'Page Responsive Grid 4 Columns',
  'Page Responsive Top Labels',
  'Page Panel Grid',
  'Component',
  'Page'
] as const;
type Template = (typeof templates)[number];

const layouts = ['frame-10', 'frame-10-right', 'frame-10-full-width', 'basic-10'] as const;
type Layout = (typeof layouts)[number];

export interface NewUserDialogParams {
  namespace: string;
  name: string;
  type: DialogType;
  template: Template;
  layout?: Layout;
  projectDir: string;
}

export async function addNewUserDialog(projectDir: string, type: DialogType) {
  const input = await collectNewUserDialogParams(type, projectDir);
  if (input) {
    executeCommand('engine.createUserDialog', input);
  }
}

async function collectNewUserDialogParams(type: DialogType, projectDir: string): Promise<NewUserDialogParams | undefined> {
  const name = await collectName();
  if (!name) {
    return;
  }
  const namespace = await collectNamespace(projectDir);
  if (!namespace) {
    return;
  }
  if (type === 'Offline Dialog') {
    return { name, namespace, type, template: 'Page', projectDir };
  }
  const template = await collectTemplate();
  if (!template) {
    return;
  }
  if (template === 'Component') {
    return { name, namespace, type, template, projectDir };
  }
  const layout = await collectLayout();
  if (!layout) {
    return;
  }
  return { name, namespace, type, template: template, layout, projectDir };
}

async function collectName(): Promise<string | undefined> {
  return vscode.window.showInputBox({
    title: 'User Dialog Name',
    placeHolder: 'Enter a name',
    ignoreFocusOut: true,
    validateInput: validateUserDialogName
  });
}

async function collectNamespace(projectDir: string): Promise<string | undefined> {
  const namespace = await defaultNamespaceOf(projectDir);
  return vscode.window.showInputBox({
    title: 'User Dialog Namespace',
    value: namespace,
    ignoreFocusOut: true,
    validateInput: validateNamespace
  });
}

async function collectTemplate(): Promise<Template> {
  return (await vscode.window.showQuickPick(
    templates.filter(t => t !== 'Page'),
    {
      title: 'Select View Type',
      ignoreFocusOut: true
    }
  )) as Template;
}

async function collectLayout(): Promise<Layout> {
  return (await vscode.window.showQuickPick(layouts, {
    title: 'Select Layout',
    ignoreFocusOut: true
  })) as Layout;
}

function validateUserDialogName(value: string): string | undefined {
  const pattern = /^[\w-]+$/;
  if (pattern.test(value)) {
    return;
  }
  return 'Invalid project name.';
}

function validateNamespace(value: string): string | undefined {
  const pattern = /^\w+(\.\w+)*(-\w+)*$/;
  if (pattern.test(value)) {
    return;
  }
  return 'Invalid namespace.';
}

import { executeCommand } from '../base/commands';
import * as vscode from 'vscode';
import { defaultNamespaceOf, resolveNamespaceFromPath } from './util';
import { InscriptionActionHandler, SendInscriptionNotification } from '../inscription-action-handler';
import { InscriptionActionArgs } from '@axonivy/inscription-protocol';

export type DialogType = 'JSF' | 'JSFOffline';

const layouts = [
  'Page Responsive Grid 2 Columns',
  'Page Responsive Grid 4 Columns',
  'Page Responsive Top Labels',
  'Page Panel Grid',
  'Component',
  'Page'
] as const;
type Layout = (typeof layouts)[number];

const templates = ['frame-10', 'frame-10-right', 'frame-10-full-width', 'basic-10'] as const;
type Template = (typeof templates)[number];

export interface NewUserDialogParams {
  namespace: string;
  name: string;
  type: DialogType;
  template?: Template;
  layout: Layout;
  projectDir: string;
  pid?: string;
}

export class NewHtmlDialogActionHandler implements InscriptionActionHandler {
  actionId = 'newHtmlDialog' as const;
  async handle(actionArgs: InscriptionActionArgs, sendInscriptionNotification: SendInscriptionNotification) {
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    if (tabInput instanceof vscode.TabInputCustom) {
      await executeCommand('ivyProjects.addNewHtmlDialog', tabInput, [], actionArgs.context.pid);
      sendInscriptionNotification('dataChanged');
      sendInscriptionNotification('validation');
    }
  }
}

export async function addNewUserDialog(selectedUri: vscode.Uri, projectDir: string, type: DialogType, pid?: string) {
  const input = await collectNewUserDialogParams(selectedUri, type, projectDir);
  if (input) {
    await executeCommand('engine.createUserDialog', { pid, ...input });
  }
}

async function collectNewUserDialogParams(
  selectedUri: vscode.Uri,
  type: DialogType,
  projectDir: string
): Promise<NewUserDialogParams | undefined> {
  const name = await collectName();
  if (!name) {
    return;
  }
  const namespace = await collectNamespace(selectedUri, projectDir);
  if (!namespace) {
    return;
  }
  if (type === 'JSFOffline') {
    return { name, namespace, type, layout: 'Page', projectDir };
  }
  const layout = await collectLayout();
  if (!layout) {
    return;
  }
  if (layout === 'Component') {
    return { name, namespace, type, layout, projectDir };
  }
  const template = await collectTemplate();
  if (!template) {
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

async function collectNamespace(selectedUri: vscode.Uri, projectDir: string): Promise<string | undefined> {
  const namespaceFromPath = await resolveNamespaceFromPath(selectedUri, projectDir, 'src_hd');
  const namespace = namespaceFromPath ? namespaceFromPath : await defaultNamespaceOf(projectDir);
  return vscode.window.showInputBox({
    title: 'User Dialog Namespace',
    value: namespace,
    valueSelection: [namespace.length, -1],
    ignoreFocusOut: true,
    validateInput: validateNamespace
  });
}

async function collectLayout(): Promise<Layout> {
  return (await vscode.window.showQuickPick(
    layouts.filter(t => t !== 'Page'),
    {
      title: 'Select Layout',
      ignoreFocusOut: true
    }
  )) as Layout;
}

async function collectTemplate(): Promise<Template> {
  return (await vscode.window.showQuickPick(templates, {
    title: 'Select Template',
    ignoreFocusOut: true
  })) as Template;
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

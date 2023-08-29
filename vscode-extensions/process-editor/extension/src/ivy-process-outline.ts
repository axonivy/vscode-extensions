import * as vscode from 'vscode';
import * as path from 'path';
import { IvyVscodeConnector } from './ivy-vscode-connector';
import { SelectAction, SelectAllAction } from '@eclipse-glsp/vscode-integration';
import { JumpAction } from '@axonivy/process-editor-protocol';

type Process = {
  elements: Element[];
  id: string;
};

type Element = {
  id: string;
  type: string;
  name?: string | string[];
  elements?: Element[];
};

export class IvyProcessOutlineProvider implements vscode.TreeDataProvider<Element> {
  private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;

  private tree?: Process;
  private text = '';

  constructor(private context: vscode.ExtensionContext, private ivyGlspConnector: IvyVscodeConnector) {
    this.ivyGlspConnector.onDidChangeActiveGlspEditor(e => this.readProcessFile(e.document.uri.path));
    this.ivyGlspConnector.onDidChangeCustomDocument(e => this.readProcessFile(e.document.uri.path));
  }

  refresh(element?: Element): void {
    this.parseTree();
    if (element) {
      this._onDidChangeTreeData.fire(element);
    } else {
      this._onDidChangeTreeData.fire(undefined);
    }
  }

  private readProcessFile(path: string) {
    vscode.workspace.fs.readFile(vscode.Uri.file(path)).then(content => {
      this.text = content.toString();
      this.refresh();
    });
  }

  private parseTree(): void {
    this.tree = undefined;
    if (this.text && this.text.length > 0) {
      this.tree = JSON.parse(this.text) as Process;
    }
  }

  getChildren(element?: Element): Thenable<Element[]> {
    if (element) {
      return Promise.resolve(element.elements ?? []);
    } else {
      return Promise.resolve(this.tree?.elements ?? []);
    }
  }

  getParent(element: Element) {
    const pid = this.fullPid(element);
    return this.findElementBy(this.parentPid(pid));
  }

  private fullPid(element: Element) {
    return `${this.tree?.id}-${element.id}`;
  }

  private parentPid(pid: string) {
    return pid.substring(0, pid.lastIndexOf('-'));
  }

  getTreeItem(element: Element): vscode.TreeItem {
    if (!this.tree) {
      throw new Error('Invalid tree');
    }
    const pid = this.fullPid(element);
    const treeItem = new vscode.TreeItem(
      this.getLabel(element),
      element.elements ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );
    treeItem.description = element.type;
    treeItem.tooltip = `${element.type}: ${pid}`;
    treeItem.iconPath = this.getIcon(element);
    treeItem.command = { command: 'ivyProcessOutline.selectElement', title: '', arguments: [pid] };
    treeItem.id = pid;
    return treeItem;
  }

  select(pid: string) {
    this.ivyGlspConnector.sendActionToActiveClient(SelectAllAction.create(false));
    this.ivyGlspConnector.sendActionToActiveClient(JumpAction.create({ elementId: this.parentPid(pid) }));
    this.ivyGlspConnector.sendActionToActiveClient(SelectAction.create({ selectedElementsIDs: [pid] }));
  }

  findElementBy(pid: string) {
    return this.tree?.elements.find(e => this.fullPid(e) === pid);
  }

  private getIcon(element: Element) {
    const type = element.type;
    if (type.includes('Start') || type.includes('End')) {
      return {
        light: this.context.asAbsolutePath(path.join('assets', 'light', 'events-group.svg')),
        dark: this.context.asAbsolutePath(path.join('assets', 'dark', 'events-group.svg'))
      };
    }
    if (type === 'Join' || type === 'Split' || type === 'Alternative' || type === 'TaskSwitchGateway') {
      return {
        light: this.context.asAbsolutePath(path.join('assets', 'light', 'gateways-group.svg')),
        dark: this.context.asAbsolutePath(path.join('assets', 'dark', 'gateways-group.svg'))
      };
    }
    return {
      light: this.context.asAbsolutePath(path.join('assets', 'light', 'activities-group.svg')),
      dark: this.context.asAbsolutePath(path.join('assets', 'dark', 'activities-group.svg'))
    };
  }

  private getLabel(element: Element) {
    if (element.name) {
      if (Array.isArray(element.name)) {
        return element.name.join(' ');
      }
      return element.name;
    }
    return element.id;
  }
}

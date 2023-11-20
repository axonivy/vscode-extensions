import * as vscode from 'vscode';
import * as path from 'path';
import { IvyVscodeConnector } from './ivy-vscode-connector';
import { GlspVscodeClient, SelectAction, SelectAllAction } from '@eclipse-glsp/vscode-integration';
import { JumpAction, MoveIntoViewportAction } from '@axonivy/process-editor-protocol';

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

  private client?: GlspVscodeClient<vscode.CustomDocument>;
  private tree?: Process;
  private text = '';

  constructor(private context: vscode.ExtensionContext, private ivyGlspConnector: IvyVscodeConnector) {
    this.ivyGlspConnector.onDidChangeActiveGlspEditor(e => this.readProcessFile(e.client));
  }

  refresh(element?: Element): void {
    this.parseTree();
    if (element) {
      this._onDidChangeTreeData.fire(element);
    } else {
      this._onDidChangeTreeData.fire(undefined);
    }
  }

  private readProcessFile(client: GlspVscodeClient<vscode.CustomDocument>) {
    this.client = client;
    this.client.webviewPanel.onDidDispose(() => {
      this.client = undefined;
      this.text = '';
      this.refresh();
    });
    vscode.workspace.fs.readFile(vscode.Uri.file(client.document.uri.path)).then(content => {
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
    let children = this.tree?.elements ?? [];
    if (element) {
      children = element.elements ?? [];
    }
    children.sort((c1, c2) => {
      const o1 = this.isEventElement(c1) ? 1 : this.isGatewayElement(c1) ? 2 : 3;
      const o2 = this.isEventElement(c2) ? 1 : this.isGatewayElement(c2) ? 2 : 3;
      return o1 - o2;
    });
    return Promise.resolve(children);
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
    if (this.client) {
      const clientId = this.client.clientId;
      this.ivyGlspConnector.sendActionToClient(clientId, SelectAllAction.create(false));
      this.ivyGlspConnector.sendActionToClient(clientId, JumpAction.create({ elementId: this.parentPid(pid) }));
      this.ivyGlspConnector.sendActionToClient(clientId, SelectAction.create({ selectedElementsIDs: [pid] }));
      this.ivyGlspConnector.sendActionToClient(clientId, MoveIntoViewportAction.create({ elementIds: [pid] }));
      this.client.webviewPanel.reveal();
    }
  }

  findElementBy(searchPid: string) {
    if (this.tree) {
      return this.findElement(this.tree, searchPid);
    }
    return undefined;
  }

  findElement(parent: Element | Process, searchPid: string): Element | undefined {
    if (!parent.elements) {
      return undefined;
    }
    for (const child of parent.elements) {
      const childPid = this.fullPid(child);
      if (childPid === searchPid) {
        return child;
      }
      if (searchPid.startsWith(childPid)) {
        return this.findElement(child, searchPid);
      }
    }
    return undefined;
  }

  private getIcon(element: Element) {
    if (this.isEventElement(element)) {
      return {
        light: this.context.asAbsolutePath(path.join('assets', 'light', 'events-group.svg')),
        dark: this.context.asAbsolutePath(path.join('assets', 'dark', 'events-group.svg'))
      };
    }
    if (this.isGatewayElement(element)) {
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

  private isEventElement(element: Element) {
    const type = element.type;
    return type.includes('Start') || type.includes('End') || type.includes('Event');
  }

  private isGatewayElement(element: Element) {
    const type = element.type;
    return type === 'Join' || type === 'Split' || type === 'Alternative' || type === 'TaskSwitchGateway';
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

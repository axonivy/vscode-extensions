import * as vscode from 'vscode';
import { exec } from 'child_process';
import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import path from 'path';

export class MavenBuilder {
  private readonly outputChannel: vscode.OutputChannel;
  private readonly buildCommand: string;
  private readonly xmlParser = new XMLParser();
  constructor(extensionUri: vscode.Uri) {
    const engineDir = vscode.Uri.joinPath(extensionUri, 'engine', 'AxonIvyEngine').fsPath;
    this.buildCommand = `mvn install -Dmaven.test.skip=true -Divy.engine.directory=${engineDir}`;
    this.outputChannel = vscode.window.createOutputChannel('Ivy Maven');
  }

  async buildProject(ivyProjectDir: string): Promise<void> {
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: `Build Project ${ivyProjectDir}`,
      cancellable: false
    };
    return await vscode.window.withProgress(progressOptions, async () => {
      const childProcess = exec(this.buildCommand, { cwd: ivyProjectDir });
      childProcess.on('error', (error: any) => {
        this.outputChannel.append(error);
        this.outputChannel.show();
        throw new Error(error);
      });
      if (childProcess.stdout) {
        childProcess.stdout.setEncoding('utf-8');
        childProcess.stdout.on('data', (data: any) => {
          this.outputChannel.append(data);
        });
      }
      return new Promise(resolve => {
        childProcess.on('exit', () => {
          resolve();
        });
      });
    });
  }

  async buildProjects(): Promise<void> {
    const poms = (await vscode.workspace.findFiles('**/pom.xml')).map(uri => uri.fsPath);
    const moduleProjects = poms.filter(pom => this.containModuels(pom)).map(pom => path.dirname(pom));
    const projectsToBuild = poms.map(pom => path.dirname(pom)).filter(project => !this.isUnderModuleProject(project, moduleProjects));
    for (const project of projectsToBuild) {
      await this.buildProject(project);
    }
  }

  private containModuels(path: string): boolean {
    const contents = fs.readFileSync(path, 'utf-8');
    const pom = this.xmlParser.parse(contents);
    return pom.project && pom.project.modules;
  }

  private isUnderModuleProject(project: string, moduleProjects: string[]): string | undefined {
    return moduleProjects.find(moduleProject => project.startsWith(moduleProject + path.sep) && project !== moduleProject);
  }
}

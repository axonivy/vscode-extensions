import * as vscode from 'vscode';
import { exec } from 'child_process';
import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import path from 'path';
import { projectExcludePattern } from '../../base/configurations';

const IVY_ENGINE_VERSION = '11.2.0';

export class MavenBuilder {
  private readonly outputChannel: vscode.OutputChannel;
  private readonly buildCommand: string;
  private readonly xmlParser = new XMLParser();
  private readonly excludePattern: string;
  constructor(extensionUri: vscode.Uri) {
    const engineDir = vscode.Uri.joinPath(extensionUri, 'AxonIvyEngine').fsPath;
    this.buildCommand = `mvn process-test-classes --batch-mode -Dmaven.test.skip=true -Divy.engine.directory=${engineDir} -Divy.engine.version=${IVY_ENGINE_VERSION} -Dstyle.color=never`;
    this.outputChannel = vscode.window.createOutputChannel('Axon Ivy Maven');
    this.excludePattern = projectExcludePattern ?? '';
  }

  async buildProject(ivyProjectDir: string): Promise<void> {
    const childProcess = exec(this.buildCommand, { cwd: ivyProjectDir });
    this.outputChannel.show();
    childProcess.on('error', (error: Error) => {
      this.outputChannel.append(error.message);
      this.outputChannel.show();
      throw error;
    });
    if (childProcess.stdout) {
      childProcess.stdout.setEncoding('utf-8');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      childProcess.stdout.on('data', (data: any) => {
        this.outputChannel.append(data);
      });
    }
    return new Promise(resolve => {
      childProcess.on('exit', () => {
        resolve();
      });
    });
  }

  async buildProjects() {
    const poms = (await vscode.workspace.findFiles('**/pom.xml', this.excludePattern)).map(uri => uri.fsPath);
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

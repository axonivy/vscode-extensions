import * as path from 'node:path';
import { IvyEngineManager } from '../engine/engine-manager';

export type EditorConnection = {
  websocketUrl: URL;
  workspaceId: string;
};

export type EditorContext = EditorConnection & {
  projectId: string;
  file: string;
};

export const resolveEditorContext = async (connection: EditorConnection, file: string): Promise<EditorContext> => {
  const project = (await IvyEngineManager.instance.projects())?.find(project => {
    const relativePath = path.relative(project.projectDirectory, file);
    return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  });
  if (!project) {
    throw new Error(`Cannot resolve Ivy project for file '${file}'`);
  }
  return { ...connection, projectId: project.id.id, file };
};

import path from 'path';
import * as vscode from 'vscode';

const namespaceKey = '\\:DEFAULT_NAMESPACE=';

const defaultNamespaceOf = (projecDir: string) => {
  const designerPrefs = vscode.Uri.joinPath(vscode.Uri.file(projecDir), '.settings', 'ch.ivyteam.ivy.designer.prefs');
  return vscode.workspace.fs.readFile(designerPrefs).then(
    content => {
      const nameSpaceLine =
        content
          .toString()
          .split(/\r?\n/)
          .find(e => e.includes(namespaceKey)) ?? '';
      return nameSpaceLine.substring(nameSpaceLine.indexOf(namespaceKey) + namespaceKey.length);
    },
    () => ''
  );
};
export const resolveNamespaceFromPath = async (
  selectedUri: vscode.Uri,
  projectDir: string,
  target: 'processes' | 'src_hd' | 'dataclasses'
) => {
  const fileStat = await vscode.workspace.fs.stat(selectedUri);
  const selectedPath = fileStat.type === vscode.FileType.File ? path.dirname(selectedUri.path) : selectedUri.path;
  const processPath = path.join(projectDir, target) + path.sep;
  if (selectedPath.startsWith(processPath)) {
    const namespace = selectedPath.replace(processPath, '').replaceAll(path.sep, target === 'processes' ? '/' : '.');
    return namespace + (target === 'processes' ? '/' : '');
  }
  return defaultNamespaceOf(projectDir);
};

export const validateArtifactName = (value: string) => {
  const pattern = /^[\w-]+$/;
  if (pattern.test(value)) {
    return;
  }
  return 'Invalid name.';
};

export const validateDotSeparatedName = (value: string, errorMessage = 'Invalid namespace.') => {
  const pattern = /^\w+(\.\w+)*(-\w+)*$/;
  if (pattern.test(value)) {
    return;
  }
  return errorMessage;
};

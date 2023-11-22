import * as vscode from 'vscode';

const namespaceKey = '\\:DEFAULT_NAMESPACE=';

export async function defaultNamespaceOf(projecDir: string) {
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
}

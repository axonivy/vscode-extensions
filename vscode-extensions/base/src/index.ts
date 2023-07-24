export const PROCESS_EDITOR_EXTENSION_ID = 'axonivy.vscode-process-editor-extension';

export interface ElementId {
  app: string;
  pmv: string;
  pid: string;
}

export type SelectedElement = ElementId | undefined;

export interface ProcessEditorConnector {
  getSelectedElement(): SelectedElement;
  onSelectedElement(listener: (selectedElement: SelectedElement) => any): void;
}

export interface ProcessEditorExtension {
  connector: ProcessEditorConnector;
}

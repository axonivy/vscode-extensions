export type ElementId = {
  app: string;
  pmv: string;
  pid: string;
};

export type SelectedElement = ElementId | undefined;

export interface ProcessEditorConnector {
  getSelectedElement(): SelectedElement;
  onSelectedElement(listener: (selectedElement: SelectedElement) => void): void;
}

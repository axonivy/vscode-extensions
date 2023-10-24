import { ThemeMode } from '@axonivy/inscription-editor';
import { SelectedElement } from '../../../src/base/process-editor-connector';

export type Message = SelectedElementMessage | ConnectToEngineMessage | SetMonacoThemeMessage;

export type SelectedElementMessage = {
  command: 'selectedElement';
  selectedElement: SelectedElement;
};

export type ConnectToEngineMessage = {
  command: 'connect.to.web.sockets';
  webSocketAddress: string;
};

export type SetMonacoThemeMessage = {
  command: 'theme';
  theme: ThemeMode;
};

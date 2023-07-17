import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { YAMLVariablesTable } from '@axonivy/config-editor';

const vscodeApi = acquireVsCodeApi();

ReactDOM.render(
  <React.StrictMode>
    <YAMLVariablesTable vscodeApi={vscodeApi} />
  </React.StrictMode>,
  document.getElementById('root')
);

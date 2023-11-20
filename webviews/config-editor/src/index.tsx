import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { YAMLVariablesTable } from '@axonivy/config-editor';

const vscodeApi = acquireVsCodeApi();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <YAMLVariablesTable vscodeApi={vscodeApi} />
  </React.StrictMode>
);

vscodeApi.postMessage({ type: 'ready' });

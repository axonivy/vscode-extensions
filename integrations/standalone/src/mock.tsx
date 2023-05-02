import { InscriptionClientMock, MonacoUtil } from '@axonivy/inscription-core';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, ClientContextInstance, MonacoEditorUtil } from '../../../packages/editor/lib';
import './index.css';

export async function start(): Promise<void> {
  MonacoEditorUtil.initMonaco();
  MonacoUtil.initStandalone();
  const root = ReactDOM.createRoot(document.getElementById('root')!);

  console.log('Use Inscription client mock');
  const inscriptionClient = new InscriptionClientMock();

  root.render(
    <React.StrictMode>
      <ClientContextInstance.Provider value={{ client: inscriptionClient }}>
        <App pid={'1'} />
      </ClientContextInstance.Provider>
    </React.StrictMode>
  );
}

start();

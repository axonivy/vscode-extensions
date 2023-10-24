import { App, ClientContextInstance } from '@axonivy/inscription-editor';
import { ElementId } from '../../../src/base/process-editor-connector';
import { InscriptionClient } from '@axonivy/inscription-protocol';
import { useState, useEffect, useCallback } from 'react';
import { Message } from './message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const DEFAULT_ELEMENT: ElementId = { app: '', pmv: '', pid: '' };

const InscriptionView = ({ client, queryClient }: { client: InscriptionClient; queryClient: QueryClient }) => {
  const [element, setElement] = useState<ElementId>(DEFAULT_ELEMENT);
  const updateElement = useCallback((event: MessageEvent<Message>) => {
    if (event.data.command === 'selectedElement') {
      setElement(event.data.selectedElement ?? DEFAULT_ELEMENT);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('message', updateElement);
    return () => window.removeEventListener('message', updateElement);
  }, [updateElement]);

  return (
    <ClientContextInstance.Provider value={{ client }}>
      <QueryClientProvider client={queryClient} contextSharing={true}>
        <App {...element} />
      </QueryClientProvider>
    </ClientContextInstance.Provider>
  );
};

export default InscriptionView;

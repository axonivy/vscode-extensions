import { workspace } from 'vscode';
import {
  LanguageClient,
  RequestType,
  type ExecuteCommandParams,
  type LanguageClientOptions,
  type StreamInfo
} from 'vscode-languageclient/node';
import { createWebSocket, toSocketConnection } from '../../engine/ws-client';
import { onExecuteClientCommand } from './client-commands';
import { formatXhtmlWithHtmlLanguageService } from './xhtml-html-formatter';

const ExecuteClientCommandRequest: RequestType<ExecuteCommandParams, unknown, void> = new RequestType('xml/executeClientCommand');

export const XhtmlLanguageClientProvider = async (webSocketUrl: URL) => {
  const serverOptions = (): Promise<StreamInfo> => {
    const webSocket = createWebSocket(new URL('ivy-xhtml-lsp', webSocketUrl));
    return new Promise((resolve, reject) => {
      webSocket.onopen = () => {
        const connection = toSocketConnection(webSocket);
        resolve(connection as unknown as StreamInfo);
      };
      webSocket.onerror = reject;
    });
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { language: 'ivy-xhtml', scheme: 'file', pattern: '**/*.xhtml' },
      { language: 'html', scheme: 'file', pattern: '**/*.xhtml' }
    ],

    middleware: {
      provideDocumentFormattingEdits: (document, options, token, next) =>
        document.languageId === 'ivy-xhtml'
          ? formatXhtmlWithHtmlLanguageService(document, options)
          : next(document, options, token),
      provideDocumentRangeFormattingEdits: (document, range, options, token, next) =>
        document.languageId === 'ivy-xhtml'
          ? formatXhtmlWithHtmlLanguageService(document, options, range)
          : next(document, range, options, token)
    },

    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher('**/*.{d,p}.json'),
        workspace.createFileSystemWatcher('**/*.xhtml'),
        workspace.createFileSystemWatcher('**/jandex.idx')
      ]
    }
  };

  const languageClient = new LanguageClient('xhtml server', serverOptions, clientOptions);
  languageClient.start();

  languageClient.onRequest(ExecuteClientCommandRequest, params => onExecuteClientCommand(languageClient, params));
  return languageClient;
};

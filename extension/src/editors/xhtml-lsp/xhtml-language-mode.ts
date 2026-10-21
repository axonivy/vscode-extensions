import { languages, workspace, type ExtensionContext, type TextDocument } from 'vscode';

type XhtmlLanguageMode = 'ivy-xhtml' | 'html';

const setting = 'axonivy.xhtml.languageMode';

export const registerXhtmlLanguageMode = (context: ExtensionContext) => {
  const pendingDocuments = new Set<string>();
  const applyLanguageMode = (document: TextDocument) => {
    if (!isXhtmlDocument(document)) {
      return;
    }

    const targetLanguage = getConfiguredLanguageMode();
    if (document.languageId === targetLanguage) {
      return;
    }

    const uri = document.uri.toString();
    if (pendingDocuments.has(uri)) {
      return;
    }
    pendingDocuments.add(uri);

    void languages.setTextDocumentLanguage(document, targetLanguage).then(
      updatedDocument => {
        pendingDocuments.delete(uri);
        if (updatedDocument.languageId !== getConfiguredLanguageMode()) {
          applyLanguageMode(updatedDocument);
        }
      },
      () => pendingDocuments.delete(uri)
    );
  };

  context.subscriptions.push(
    workspace.onDidOpenTextDocument(applyLanguageMode),
    workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(setting)) {
        workspace.textDocuments.forEach(applyLanguageMode);
      }
    })
  );

  workspace.textDocuments.forEach(applyLanguageMode);
};

const getConfiguredLanguageMode = (): XhtmlLanguageMode =>
  workspace.getConfiguration('axonivy').get<XhtmlLanguageMode>('xhtml.languageMode', 'ivy-xhtml') === 'html'
    ? 'html'
    : 'ivy-xhtml';

const isXhtmlDocument = (document: TextDocument) =>
  document.uri.scheme === 'file' && document.uri.path.toLowerCase().endsWith('.xhtml');

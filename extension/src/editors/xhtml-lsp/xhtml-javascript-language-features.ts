import {
  CompletionItem,
  CompletionList,
  Hover,
  Position,
  Range,
  WorkspaceEdit,
  commands,
  extensions,
  languages,
  workspace,
  type CompletionItemProvider,
  type ExtensionContext,
  type HoverProvider,
  type TextDocument as VscodeTextDocument
} from 'vscode';
import { createEmbeddedJavascriptDocument, type JavascriptRegion } from './embedded-javascript-document';

type VirtualJavascriptDocument = { document: VscodeTextDocument; text: string };

class XhtmlJavascriptLanguageFeatures implements CompletionItemProvider, HoverProvider {
  private virtualDocument?: VirtualJavascriptDocument;
  private requestQueue: Promise<void> = Promise.resolve();
  private typescriptExtensionActivation?: Promise<unknown>;

  provideCompletionItems(document: VscodeTextDocument, position: Position) {
    const javascript = createEmbeddedJavascriptDocument(document.getText(), document.offsetAt(position));
    if (!javascript) {
      return;
    }

    return this.serialize(async () => {
      const virtualDocument = await this.updateVirtualDocument(javascript.text);
      const completions = await commands.executeCommand<CompletionList>(
        'vscode.executeCompletionItemProvider',
        virtualDocument.uri,
        position
      );
      if (!completions) {
        return;
      }
      return new CompletionList(
        completions.items.filter(item => isCompletionInRegion(document, item, javascript.region)),
        completions.isIncomplete
      );
    });
  }

  provideHover(document: VscodeTextDocument, position: Position) {
    const javascript = createEmbeddedJavascriptDocument(document.getText(), document.offsetAt(position));
    if (!javascript) {
      return;
    }

    return this.serialize(async () => {
      const virtualDocument = await this.updateVirtualDocument(javascript.text);
      const hovers = await commands.executeCommand<Hover[]>(
        'vscode.executeHoverProvider',
        virtualDocument.uri,
        position
      );
      if (!hovers?.length) {
        return;
      }
      const scriptHovers = hovers.filter(hover => isHoverInRegion(document, hover, javascript.region));
      if (scriptHovers.length === 0) {
        return;
      }

      const contents = scriptHovers.flatMap(hover => (Array.isArray(hover.contents) ? hover.contents : [hover.contents]));
      const range = scriptHovers.find(hover => hover.range)?.range;
      return new Hover(contents, range);
    });
  }

  private serialize<T>(request: () => Promise<T>) {
    const result = this.requestQueue.then(request, request);
    this.requestQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  private async updateVirtualDocument(text: string) {
    const typescriptExtension = extensions.getExtension('vscode.typescript-language-features');
    if (typescriptExtension) {
      this.typescriptExtensionActivation ??= Promise.resolve(typescriptExtension.activate());
      await this.typescriptExtensionActivation;
    }

    if (!this.virtualDocument) {
      const document = await workspace.openTextDocument({ language: 'javascript', content: text });
      this.virtualDocument = { document, text };
      return document;
    }

    if (this.virtualDocument.text !== text) {
      const edit = new WorkspaceEdit();
      const document = this.virtualDocument.document;
      edit.replace(document.uri, new Range(new Position(0, 0), document.positionAt(document.getText().length)), text);
      const applied = await workspace.applyEdit(edit);
      if (!applied) {
        const replacement = await workspace.openTextDocument({ language: 'javascript', content: text });
        this.virtualDocument = { document: replacement, text };
        return replacement;
      }
      const updatedDocument = await workspace.openTextDocument(document.uri);
      this.virtualDocument = { document: updatedDocument, text };
    }
    return this.virtualDocument.document;
  }
}

export const registerXhtmlJavascriptLanguageFeatures = (context: ExtensionContext) => {
  const selector = { language: 'ivy-xhtml', scheme: 'file' };
  const provider = new XhtmlJavascriptLanguageFeatures();
  context.subscriptions.push(
    languages.registerCompletionItemProvider(selector, provider, '.', '(', '[', '"', "'"),
    languages.registerHoverProvider(selector, provider)
  );
};

const isCompletionInRegion = (
  document: VscodeTextDocument,
  item: CompletionItem,
  region: JavascriptRegion
) => {
  if (item.additionalTextEdits?.length) {
    return false;
  }
  if (!item.range) {
    return true;
  }

  const ranges = 'start' in item.range ? [item.range] : [item.range.inserting, item.range.replacing];
  return ranges.every(range => {
    const start = document.offsetAt(range.start);
    const end = document.offsetAt(range.end);
    return start >= region.start && end <= region.end;
  });
};

const isHoverInRegion = (document: VscodeTextDocument, hover: Hover, region: JavascriptRegion) => {
  if (!hover.range) {
    return true;
  }
  const start = document.offsetAt(hover.range.start);
  const end = document.offsetAt(hover.range.end);
  return start >= region.start && end <= region.end;
};

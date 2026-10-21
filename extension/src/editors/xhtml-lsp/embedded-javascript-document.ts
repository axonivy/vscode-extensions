export type JavascriptRegion = { start: number; end: number };

export const createEmbeddedJavascriptDocument = (source: string, offset: number) => {
  const regions = findScriptRegions(source);
  const region = regions.find(candidate => offset >= candidate.start && offset <= candidate.end);
  if (!region || isInsideIvyExpression(source, region, offset)) {
    return;
  }

  const javascriptCharacters = source.split('');
  for (let index = 0; index < source.length; index++) {
    if (source[index] !== '\n' && source[index] !== '\r') {
      javascriptCharacters[index] = ' ';
    }
  }

  for (const scriptRegion of regions) {
    const script = maskNonJavascriptSyntax(source.slice(scriptRegion.start, scriptRegion.end));
    for (let index = 0; index < script.length; index++) {
      javascriptCharacters[scriptRegion.start + index] = script.charAt(index);
    }
  }

  const firstLineEnd = source.indexOf('\n');
  const typecheckDirective = '// @ts-nocheck';
  if (firstLineEnd >= typecheckDirective.length) {
    for (let index = 0; index < typecheckDirective.length; index++) {
      javascriptCharacters[index] = typecheckDirective.charAt(index);
    }
  }

  return { text: javascriptCharacters.join(''), region };
};

const findScriptRegions = (source: string): JavascriptRegion[] => {
  const regions: JavascriptRegion[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const tagStart = source.indexOf('<', cursor);
    if (tagStart < 0) {
      break;
    }

    if (source.startsWith('<!--', tagStart)) {
      cursor = findClosingMarkup(source, '-->', tagStart + 4);
      continue;
    }
    if (source.startsWith('<![CDATA[', tagStart)) {
      cursor = findClosingMarkup(source, ']]>', tagStart + 9);
      continue;
    }
    if (source.startsWith('<!', tagStart) || source.startsWith('<?', tagStart)) {
      cursor = findTagEnd(source, tagStart);
      continue;
    }

    const tagEnd = findTagEnd(source, tagStart);
    const openingTag = source.slice(tagStart, tagEnd);
    if (/^<\s*\//.test(openingTag)) {
      cursor = tagEnd;
      continue;
    }

    const tagName = openingTag.match(/^<\s*([\w:.-]+)/)?.[1]?.toLowerCase();
    if (tagName === 'script' || tagName === 'style') {
      if (/\/\s*>$/.test(openingTag)) {
        cursor = tagEnd;
        continue;
      }
      const closingTag = findClosingElement(source, tagName, tagEnd);
      if (tagName === 'script') {
        regions.push({ start: tagEnd, end: closingTag?.start ?? source.length });
      }
      cursor = closingTag?.end ?? source.length;
      continue;
    }

    cursor = tagEnd;
  }

  return regions;
};

const findTagEnd = (source: string, tagStart: number) => {
  let quote: string | undefined;
  for (let index = tagStart + 1; index < source.length; index++) {
    const character = source.charAt(index);
    if (quote) {
      if (character === quote) {
        quote = undefined;
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index + 1;
    }
  }
  return source.length;
};

const findClosingMarkup = (source: string, closingText: string, fromIndex: number) => {
  const closingIndex = source.indexOf(closingText, fromIndex);
  return closingIndex < 0 ? source.length : closingIndex + closingText.length;
};

const findClosingElement = (source: string, tagName: 'script' | 'style', fromIndex: number) => {
  const closingTag = new RegExp(`<\\/${tagName}\\s*>`, 'i');
  const match = closingTag.exec(source.slice(fromIndex));
  if (!match || match.index === undefined) {
    return;
  }
  return { start: fromIndex + match.index, end: fromIndex + match.index + match[0].length };
};

const maskNonJavascriptSyntax = (javascript: string) =>
  javascript
    .replace(/<!\[CDATA\[|\]\]>/g, maskPreservingLines)
    .replace(/#\{[^}]*\}/g, maskPreservingLines);

const maskPreservingLines = (text: string) => text.replace(/[^\r\n]/g, ' ');

const isInsideIvyExpression = (source: string, region: JavascriptRegion, offset: number) => {
  const regionText = source.slice(region.start, region.end);
  const expression = /#\{[^}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(regionText))) {
    const start = region.start + match.index;
    const end = start + match[0].length;
    if (offset >= start && offset < end) {
      return true;
    }
  }
  return false;
};

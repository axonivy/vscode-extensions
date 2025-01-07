// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();
import DOMPurify from 'dompurify';

function onceDocumentLoaded(func) {
  if (document.readyState === 'loading' || document.readyState === 'uninitialized') {
    document.addEventListener('DOMContentLoaded', func);
  } else {
    func();
  }
}

const iframe = document.querySelector('iframe');
const header = document.querySelector('.header');
const input = header.querySelector('.url-input');
const forwardButton = header.querySelector('.forward-button');
const backButton = header.querySelector('.back-button');
const reloadButton = header.querySelector('.reload-button');
const openHomeButton = header.querySelector('.open-home-button');
const openExternalButton = header.querySelector('.open-external-button');

window.addEventListener('message', e => {
  switch (e.data.type) {
    case 'focus': {
      iframe.focus();
      break;
    }
    case 'didChangeFocusLockIndicatorEnabled': {
      toggleFocusLockIndicatorEnabled(e.data.enabled);
      break;
    }
    case 'frame-onload': {
      input.value = e.data.url;
      break;
    }
    default:
      console.log(`Unknown message event: ${e.data.type}`);
  }
});

onceDocumentLoaded(() => {
  setInterval(() => {
    const iframeFocused = document.activeElement?.tagName === 'IFRAME';
    document.body.classList.toggle('iframe-focused', iframeFocused);
  }, 50);

  input.addEventListener('change', e => {
    const url = e.target.value;
    navigateTo(url);
  });

  forwardButton.addEventListener('click', () => {
    window.history.forward();
  });

  backButton.addEventListener('click', () => {
    window.history.back();
  });

  openHomeButton.addEventListener('click', () => {
    vscode.postMessage({ type: 'openHome' });
  });

  openExternalButton.addEventListener('click', () => {
    vscode.postMessage({
      type: 'openExternal',
      url: input.value
    });
  });

  reloadButton.addEventListener('click', () => {
    navigateTo(input.value);
  });

  function navigateTo(rawUrl) {
    const sanitizedUrl = DOMPurify.sanitize(rawUrl);
    try {
      const url = new URL(sanitizedUrl);

      // Try to bust the cache for the iframe
      // There does not appear to be any way to reliably do this except modifying the url
      url.searchParams.append('vscodeBrowserReqId', Date.now().toString());

      iframe.src = url.toString();
    } catch {
      iframe.src = sanitizedUrl;
    }

    vscode.setState({ url: sanitizedUrl });
  }
});

function toggleFocusLockIndicatorEnabled(enabled) {
  document.body.classList.toggle('enable-focus-lock-indicator', enabled);
}

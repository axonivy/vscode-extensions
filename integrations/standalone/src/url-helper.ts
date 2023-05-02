export namespace URLParams {
  export function getParameter(key: string): string | null {
    return new URLSearchParams(window.location.search).get(key);
  }

  export function getPid(): string {
    return getParameter('pid') ?? '15254DC87A1B183B-f5';
  }

  export function getServer(): string {
    return getParameter('server') ?? 'localhost:8081/designer';
  }
}

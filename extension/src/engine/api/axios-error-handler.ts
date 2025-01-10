import { AxiosError } from 'axios';
import * as vscode from 'vscode';

export const handleAxiosError = (error: unknown) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data.errorMessage ?? error;
    vscode.window.showErrorMessage(message);
    throw message;
  }
  throw error;
};

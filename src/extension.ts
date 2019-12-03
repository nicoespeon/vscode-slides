import * as vscode from "vscode";

import { VSCodeRepository, VSCodeEditor } from "./adapters";
import { FileSystemFolder } from "./adapters";
import { exit, toggle, previous, next } from "./domain";

export function activate(context: vscode.ExtensionContext) {
  const vscodeEditor = new VSCodeEditor(getWorkspaceFolder());
  const repository = new VSCodeRepository(context);

  const toggleSlides = vscode.commands.registerCommand("slides.toggle", () =>
    toggle(vscodeEditor, repository)
  );

  const previousSlide = vscode.commands.registerCommand("slides.previous", () =>
    previous(vscodeEditor, repository)
  );

  const nextSlide = vscode.commands.registerCommand("slides.next", () =>
    next(vscodeEditor, repository)
  );

  const exitSlides = vscode.commands.registerCommand("slides.exit", () =>
    exit(vscodeEditor, repository)
  );

  context.subscriptions.push(toggleSlides);
  context.subscriptions.push(previousSlide);
  context.subscriptions.push(nextSlide);
  context.subscriptions.push(exitSlides);
}

function getWorkspaceFolder(): FileSystemFolder {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length < 1) {
    throw new Error(
      "There are no workspace folder. We can't retrieve VS Code settings."
    );
  }

  return new FileSystemFolder(workspaceFolders[0].uri.fsPath);
}

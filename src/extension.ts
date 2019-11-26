import * as vscode from "vscode";

import { VSCodeRepository, VSCodeEditor } from "./adapters";
import { Folder } from "./adapters";
import { start, exit } from "./domain";

export function activate(context: vscode.ExtensionContext) {
  const repository = new VSCodeRepository(context);
  var curSlideUri: vscode.Uri;
  var curSlideLanguageId: string;
  var useMdPreviewSetting: boolean;

  const toggleSlides = vscode.commands.registerCommand(
    "slides.toggle",
    async () => {
      const vscodeEditor = new VSCodeEditor(getWorkspaceFolder());
      const { isActive } = await repository.get();

      if (isActive) {
        await exit(vscodeEditor, repository);
      } else {
        await start(vscodeEditor, repository);
        useMdPreviewSetting = vscode.workspace.getConfiguration("slides")
          .useMdPreview;
        let activeWindow = vscode.window.activeTextEditor;

        if (useMdPreviewSetting && activeWindow !== undefined) {
          curSlideUri = activeWindow.document.uri;
          curSlideLanguageId = activeWindow.document.languageId;

          if (activeWindow.document.languageId === "markdown") {
            await vscode.commands.executeCommand("markdown.showPreview");
          }
        }
      }
    }
  );

  const previousSlide = vscode.commands.registerCommand(
    "slides.previous",
    async () => {
      const { isActive } = await repository.get();

      if (isActive) {
        if (useMdPreviewSetting && curSlideLanguageId === "markdown") {
          await vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor"
          );
          await vscode.workspace.openTextDocument(curSlideUri);
        }

        await vscode.commands.executeCommand("workbench.action.previousEditor");
        let activeWindow = vscode.window.activeTextEditor;

        if (useMdPreviewSetting && activeWindow !== undefined) {
          curSlideLanguageId = activeWindow.document.languageId;
          if (activeWindow.document.languageId === "markdown") {
            await vscode.commands.executeCommand("markdown.showPreview");
          }
        }
      }
    }
  );

  const nextSlide = vscode.commands.registerCommand("slides.next", async () => {
    const { isActive } = await repository.get();

    if (isActive) {
      if (useMdPreviewSetting && curSlideLanguageId === "markdown") {
        await vscode.commands.executeCommand(
          "workbench.action.closeActiveEditor"
        );
        await vscode.workspace.openTextDocument(curSlideUri);
      }

      await vscode.commands.executeCommand("workbench.action.nextEditor");
      let activeWindow = vscode.window.activeTextEditor;

      if (useMdPreviewSetting && activeWindow !== undefined) {
        curSlideLanguageId = activeWindow.document.languageId;
        if (activeWindow.document.languageId === "markdown") {
          await vscode.commands.executeCommand("markdown.showPreview");
        }
      }
    }
  });

  const exitSlides = vscode.commands.registerCommand(
    "slides.exit",
    async () => {
      const vscodeEditor = new VSCodeEditor(getWorkspaceFolder());
      const { isActive } = await repository.get();

      if (isActive) {
        await exit(vscodeEditor, repository);
      }
    }
  );

  context.subscriptions.push(toggleSlides);
  context.subscriptions.push(previousSlide);
  context.subscriptions.push(nextSlide);
  context.subscriptions.push(exitSlides);
}

function getWorkspaceFolder(): Folder {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length < 1) {
    throw new Error(
      "There are no workspace folder. We can't retrieve VS Code settings."
    );
  }

  return new Folder(workspaceFolders[0].uri.fsPath);
}

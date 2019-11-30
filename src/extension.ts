import * as vscode from "vscode";

import { VSCodeRepository, VSCodeEditor } from "./adapters";
import { Folder } from "./adapters";
import { start, exit } from "./domain";

export function activate(context: vscode.ExtensionContext) {
  const vscodeEditor = new VSCodeEditor(getWorkspaceFolder());
  const repository = new VSCodeRepository(context);

  const toggleSlides = vscode.commands.registerCommand(
    "slides.toggle",
    async () => {
      const { isActive } = await repository.get();

      if (isActive) {
        await exit(vscodeEditor, repository);
      } else {
        await start(vscodeEditor, repository);
        await vscodeEditor.previewIfMarkdown();
      }
    }
  );

  const previousSlide = vscode.commands.registerCommand(
    "slides.previous",
    async () => {
      const { isActive } = await repository.get();

      if (isActive) {
        // Close & open markdown previews glitches on consecutive mardown slides.
        // We could improve that if we know what the previous slide would be.
        await vscodeEditor.closeMarkdownPreview();
        await vscode.commands.executeCommand("workbench.action.previousEditor");
        await vscodeEditor.previewIfMarkdown();
      }
    }
  );

  const nextSlide = vscode.commands.registerCommand("slides.next", async () => {
    const { isActive } = await repository.get();

    if (isActive) {
      // Close & open markdown previews glitches on consecutive mardown slides.
      // We could improve that if we know what the next slide would be.
      await vscodeEditor.closeMarkdownPreview();
      await vscode.commands.executeCommand("workbench.action.nextEditor");
      await vscodeEditor.previewIfMarkdown();
    }
  });

  const exitSlides = vscode.commands.registerCommand(
    "slides.exit",
    async () => {
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

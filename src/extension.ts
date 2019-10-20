import * as vscode from "vscode";

class VSCodeEditor implements Editor {
  async closeAllTabs() {}

  async openAllFiles() {}

  async getSettings() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length < 1) {
      throw new Error(
        "There are no workspace folder. We can't retrieve VS Code settings."
      );
    }

    const rootFolderPath = workspaceFolders[0].uri.path;
    const settingsFileUri = vscode.Uri.file(
      `${rootFolderPath}/.vscode/settings.json`
    );

    const settings = await vscode.workspace.openTextDocument(settingsFileUri);

    // TODO: return null if doesn't exist
    return settings.getText();
  }

  async setSettings(settings: Settings) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length < 1) {
      throw new Error(
        "There are no workspace folder. We can't retrieve VS Code settings."
      );
    }

    const rootFolderPath = workspaceFolders[0].uri.path;
    const settingsFileUri = vscode.Uri.file(
      `${rootFolderPath}/.vscode/settings.json`
    );

    // We perform distinct operations so the combination always work.
    // Sometimes it didn't work when we batched them in one `applyEdit()`.
    const createFile = new vscode.WorkspaceEdit();
    createFile.createFile(settingsFileUri, { overwrite: true });
    await vscode.workspace.applyEdit(createFile);

    const writeSettings = new vscode.WorkspaceEdit();
    writeSettings.insert(settingsFileUri, new vscode.Position(0, 0), settings);
    await vscode.workspace.applyEdit(writeSettings);

    // Save to apply changes directly.
    await vscode.workspace.saveAll();
  }
}

class InMemoryRepository implements Repository {
  private settings: Settings | null = null;

  async store(settings: Settings | null) {
    this.settings = settings;
  }

  async get() {
    return this.settings;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const vscodeEditor = new VSCodeEditor();
  const inMemoryRepository = new InMemoryRepository();

  let isActive = false;

  const toggleSlides = vscode.commands.registerCommand(
    "slides.toggle",
    async () => {
      if (isActive) {
        await restoreSettings(vscodeEditor, inMemoryRepository);
      } else {
        await setSlidesSettings(vscodeEditor, inMemoryRepository);
        await openAllSlides(vscodeEditor);
      }

      isActive = !isActive;
    }
  );

  // TODO: go to prev/next slide when isActive

  context.subscriptions.push(toggleSlides);
}

async function restoreSettings(editor: Editor, repository: Repository) {
  const settings = await repository.get();

  if (settings) {
    await editor.setSettings(settings);
  }
}

import { settings } from "./settings";

async function setSlidesSettings(editor: Editor, repository: Repository) {
  await repository.store(await editor.getSettings());
  await editor.setSettings(settings);
}

async function openAllSlides(editor: Editor) {
  await editor.closeAllTabs();
  await editor.openAllFiles();
}

interface Editor {
  closeAllTabs(): Promise<void>;
  openAllFiles(): Promise<void>;
  getSettings(): Promise<Settings | null>;
  setSettings(settings: Settings): Promise<void>;
}

interface Repository {
  store(settings: Settings | null): Promise<void>;
  get(): Promise<Settings | null>;
}

type Settings = string;

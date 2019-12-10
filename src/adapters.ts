import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { Editor, Settings, Configuration, Repository, State } from "./domain";

export { VSCodeEditor, VSCodeRepository };
export { Folder };

class VSCodeEditor implements Editor {
  private rootFolder: Folder;
  private previewedMarkdownUri: vscode.Uri | null = null;

  constructor(rootFolder: Folder) {
    this.rootFolder = rootFolder;
  }

  async closeAllTabs() {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    // Wait so VS Code closes all tabs before we move on.
    await wait(100);
  }

  async openAllFiles() {
    for (const file of this.filesFolder.visibleFiles) {
      vscode.commands.executeCommand("vscode.open", vscode.Uri.file(file));

      // Wait so VS Code has time to open the file before we move on.
      await wait(50);
    }

    await vscode.commands.executeCommand("workbench.action.openEditorAtIndex1");
  }

  async openPreviousFile() {
    await vscode.commands.executeCommand("workbench.action.previousEditor");
  }

  async openNextFile() {
    await vscode.commands.executeCommand("workbench.action.nextEditor");
  }

  async previewIfMarkdown() {
    const { previewMarkdownFiles } = this.getConfiguration();
    if (!previewMarkdownFiles) return;

    const activeWindow = vscode.window.activeTextEditor;
    if (!activeWindow) return;
    if (activeWindow.document.languageId !== "markdown") return;

    await vscode.commands.executeCommand("markdown.showPreview");
    this.previewedMarkdownUri = activeWindow.document.uri;
  }

  async closeMarkdownPreview() {
    if (this.previewedMarkdownUri && this.isOnMarkdownPreview) {
      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
      await vscode.workspace.openTextDocument(this.previewedMarkdownUri);
    }

    this.previewedMarkdownUri = null;
  }

  private get isOnMarkdownPreview(): boolean {
    // Preview is not an active text editor
    return !vscode.window.activeTextEditor;
  }

  async hideSideBar() {
    await vscode.commands.executeCommand("workbench.action.maximizeEditor");
  }

  async showSideBar() {
    await vscode.commands.executeCommand(
      "workbench.action.toggleSidebarVisibility"
    );
  }

  async getSettings(): Promise<Settings> {
    if (!fs.existsSync(this.pathToSettings)) {
      return "{}";
    }

    const settings = await vscode.workspace.openTextDocument(
      this.pathToSettings
    );
    return settings.getText();
  }

  async setSettings(settings: Settings) {
    const settingsFileUri = vscode.Uri.file(this.pathToSettings);

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

    // Wait so VS Code adopts new settings before we move on.
    await wait(200);
  }

  showError(message: string) {
    vscode.window.showErrorMessage(message);
  }

  showMessage(message: string) {
    vscode.window.showInformationMessage(message);
  }

  getConfiguration(): Configuration {
    const configuration = vscode.workspace.getConfiguration("slides");

    return {
      theme: configuration.get("theme"),
      fontFamily: configuration.get("fontFamily"),
      previewMarkdownFiles: configuration.get<boolean>(
        "previewMarkdownFiles",
        false
      )
    };
  }

  private get filesFolder(): Folder {
    const configuration = vscode.workspace.getConfiguration("slides");
    const relativePathToFolder = configuration.get<string>("folder", "");

    return this.rootFolder.goTo(relativePathToFolder);
  }

  private get pathToSettings(): Path {
    return this.rootFolder.pathTo(path.join(".vscode", "settings.json"));
  }
}

function wait(delayInMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayInMs));
}

class VSCodeRepository implements Repository {
  private memento: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    this.memento = context.workspaceState;
  }

  async store(newState: Partial<State>): Promise<void> {
    const storedState = { ...this.state, ...newState };
    this.memento.update("state", storedState);
  }

  async get(): Promise<State> {
    return this.state;
  }

  private get state(): State {
    const defaultState: State = { settings: null, isActive: false };
    const storedState = this.memento.get("state");

    return this.isValidState(storedState) ? storedState : defaultState;
  }

  private isValidState(data: unknown): data is State {
    return (
      typeof data === "object" &&
      data !== null &&
      "settings" in data &&
      // @ts-ignore https://github.com/microsoft/TypeScript/issues/21732
      (typeof data.settings === "string" || data.settings === null) &&
      "isActive" in data &&
      // @ts-ignore https://github.com/microsoft/TypeScript/issues/21732
      typeof data.isActive === "boolean"
    );
  }
}

class Folder {
  private path: Path;

  constructor(path: Path) {
    this.path = path;
  }

  get visibleFiles(): File[] {
    return fs
      .readdirSync(this.path)
      .filter(
        fileOrDirectory =>
          !fs.statSync(this.pathTo(fileOrDirectory)).isDirectory()
      )
      .filter(file => !file.startsWith("."))
      .map(file => this.pathTo(file));
  }

  pathTo(relativePath: Path): Path {
    return path.join(this.path, relativePath);
  }

  goTo(relativePath: Path): Folder {
    return new Folder(this.pathTo(relativePath));
  }
}

type Path = string;
type File = string;

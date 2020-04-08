import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import util, { TextDecoder } from "util";

import {
  Editor,
  Settings,
  Configuration,
  Repository,
  State,
  AnyObject
} from "./domain";

export { VSCodeEditor, VSCodeRepository };
export { Folder };

const wait = util.promisify(setTimeout);

class VSCodeEditor implements Editor {
  private rootFolder: Folder;

  constructor(rootFolder: Folder) {
    this.rootFolder = rootFolder;
  }

  async closeAllTabs() {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    // Wait so VS Code closes all tabs before we move on.
    await wait(100);
  }

  async openAllFiles() {
    const { previewMarkdownFiles } = this.getConfiguration();

    for (const file of this.filesFolder.visibleFiles) {
      if (previewMarkdownFiles && file.isMarkdown) {
        await this.openMarkdownPreview(file);
      } else {
        vscode.commands.executeCommand("vscode.open", file.uri);
      }

      // Wait so VS Code has time to open the file before we move on.
      await wait(50);
    }

    await vscode.commands.executeCommand("workbench.action.openEditorAtIndex1");
  }

  private async openMarkdownPreview(file: File) {
    // Signature of the command we use:
    // https://github.com/microsoft/vscode/blob/f44dc0853786a1a1c9f5dce5cd94941c2a795655/extensions/markdown-language-features/src/commands/showPreview.ts#L61
    const uri = file.uri;
    const allUris = null;
    const settings = {
      // Lock the Preview so it doesn't replace the ones already open.
      locked: true
    };

    await vscode.commands.executeCommand(
      "markdown.showPreview",
      uri,
      allUris,
      settings
    );
  }

  async openPreviousFile() {
    await vscode.commands.executeCommand("workbench.action.previousEditor");
  }

  async openNextFile() {
    await vscode.commands.executeCommand("workbench.action.nextEditor");
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

    // Give VS Code enough time to create the settings before saving.
    await wait(500);

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
      previewMarkdownFiles: configuration.get<boolean>(
        "previewMarkdownFiles",
        false
      ),
      editorSettings: {}
    };
  }

  getProjectConfiguration(): AnyObject {
    const NO_CONFIG = {};
    const pathToProjectConfiguration = this.rootFolder.pathTo(".slidesrc");
    const hasProjectConfiguration = fs.existsSync(pathToProjectConfiguration);

    if (!hasProjectConfiguration) {
      return NO_CONFIG;
    }

    try {
      return this.tryToReadJSON(pathToProjectConfiguration);
    } catch (err) {
      this.showError(`I failed to read .slidesrc because "${err}"`);
      return NO_CONFIG;
    }
  }

  private tryToReadJSON(pathToSlidesRc: string) {
    const buffer = fs.readFileSync(pathToSlidesRc);
    const slidestr = new TextDecoder().decode(buffer);
    return JSON.parse(slidestr);
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
      .map(file => new File(this.pathTo(file)));
  }

  pathTo(relativePath: Path): Path {
    return path.join(this.path, relativePath);
  }

  goTo(relativePath: Path): Folder {
    return new Folder(this.pathTo(relativePath));
  }
}

class File {
  private path: Path;

  constructor(path: Path) {
    this.path = path;
  }

  get uri(): vscode.Uri {
    return vscode.Uri.file(this.path);
  }

  get isMarkdown(): boolean {
    return this.path.endsWith(".md");
  }
}

type Path = string;

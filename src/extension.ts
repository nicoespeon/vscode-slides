import * as vscode from "vscode";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  const fsRepository = new FileSystemRepository(getWorkspaceFolder());

  const toggleSlides = vscode.commands.registerCommand(
    "slides.toggle",
    async () => {
      const vscodeEditor = new VSCodeEditor(getWorkspaceFolder());
      const { isActive } = await fsRepository.get();

      if (isActive) {
        await exit(vscodeEditor, fsRepository);
      } else {
        await start(vscodeEditor, fsRepository);
      }
    }
  );

  const previousSlide = vscode.commands.registerCommand(
    "slides.previous",
    async () => {
      const { isActive } = await fsRepository.get();

      if (isActive) {
        await vscode.commands.executeCommand("workbench.action.previousEditor");
      }
    }
  );

  const nextSlide = vscode.commands.registerCommand("slides.next", async () => {
    const { isActive } = await fsRepository.get();

    if (isActive) {
      await vscode.commands.executeCommand("workbench.action.nextEditor");
    }
  });

  const exitSlides = vscode.commands.registerCommand(
    "slides.exit",
    async () => {
      const vscodeEditor = new VSCodeEditor(getWorkspaceFolder());
      const { isActive } = await fsRepository.get();

      if (isActive) {
        await exit(vscodeEditor, fsRepository);
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

  return new Folder(workspaceFolders[0].uri.path);
}

// Adapters

import * as path from "path";

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
    this.rootFolder.visibleFiles.forEach(file => this.openFile(file));

    // Wait so VS Code opens every file before we focus on the first one.
    await wait(100);

    await vscode.commands.executeCommand("workbench.action.openEditorAtIndex1");
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
      fontFamily: configuration.get("fontFamily")
    };
  }

  private openFile(file: Path): void {
    vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.file(this.rootFolder.pathTo(file))
    );
  }

  private get pathToSettings(): Path {
    return this.rootFolder.pathTo(".vscode/settings.json");
  }
}

function wait(delayInMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayInMs));
}

class FileSystemRepository implements Repository {
  private rootFolder: Folder;
  private encoding = "utf-8";

  constructor(rootFolder: Folder) {
    this.rootFolder = rootFolder;
  }

  async store(newState: Partial<State>) {
    const storedState = { ...this.state, ...newState };
    fs.writeFileSync(this.pathToState, JSON.stringify(storedState), {
      encoding: this.encoding
    });
  }

  async get(): Promise<State> {
    return this.state;
  }

  private get state(): State {
    const defaultState: State = { settings: null, isActive: false };

    if (!fs.existsSync(this.pathToState)) {
      return defaultState;
    }

    const storedState = JSON.parse(
      fs.readFileSync(this.pathToState, {
        encoding: this.encoding
      })
    );

    if (!this.isValidState(storedState)) {
      return defaultState;
    }

    return storedState;
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

  private get pathToState(): Path {
    return this.rootFolder.pathTo(".vscode-slides.json");
  }
}

class Folder {
  private path: Path;

  constructor(path: Path) {
    this.path = path;
  }

  get visibleFiles(): Path[] {
    return fs
      .readdirSync(this.path)
      .filter(
        fileOrDirectory =>
          !fs.statSync(this.pathTo(fileOrDirectory)).isDirectory()
      )
      .filter(file => !file.startsWith("."));
  }

  pathTo(relativePath: Path): Path {
    return path.join(this.path, relativePath);
  }
}

type Path = string;

// Domain

async function exit(editor: Editor, repository: Repository) {
  await restoreSettings(editor, repository);
  await editor.showSideBar();
  await repository.store({ isActive: false });
}

async function restoreSettings(editor: Editor, repository: Repository) {
  const { settings } = await repository.get();

  if (settings) {
    await editor.setSettings(settings);
  }
}

async function start(editor: Editor, repository: Repository) {
  await setSlidesSettings(editor, repository);

  try {
    await openAllSlides(editor);
  } catch (error) {
    editor.showMessage(
      "I kept the sidebar open so you can open files manually!"
    );
    editor.showError(`I failed to open all slides because: ${error}`);
    await repository.store({ isActive: true });
    return;
  }

  await editor.hideSideBar();
  await repository.store({ isActive: true });
}

async function setSlidesSettings(editor: Editor, repository: Repository) {
  await repository.store({
    settings: await editor.getSettings()
  });
  await editor.setSettings(getSlidesSettings(editor));
}

import { settings as defaults } from "./settings";

function getSlidesSettings(editor: Editor): Settings {
  const configured = editor.getConfiguration();

  return JSON.stringify({
    ...defaults,
    "workbench.colorTheme":
      configured.theme || defaults["workbench.colorTheme"],
    "editor.fontFamily": configured.fontFamily || defaults["editor.fontFamily"],
    "terminal.integrated.fontFamily":
      configured.fontFamily || defaults["terminal.integrated.fontFamily"]
  });
}

async function openAllSlides(editor: Editor) {
  await editor.closeAllTabs();
  await editor.openAllFiles();
}

interface Editor {
  closeAllTabs(): Promise<void>;
  openAllFiles(): Promise<void>;
  hideSideBar(): Promise<void>;
  showSideBar(): Promise<void>;
  getSettings(): Promise<Settings | null>;
  setSettings(settings: Settings): Promise<void>;
  showError(message: string): void;
  showMessage(message: string): void;
  getConfiguration(): Configuration;
}

interface Configuration {
  theme: string | null | undefined;
  fontFamily: string | null | undefined;
}

interface Repository {
  store(state: Partial<State>): Promise<void>;
  get(): Promise<State>;
}

interface State {
  settings: Settings | null;
  isActive: boolean;
}

type Settings = string;

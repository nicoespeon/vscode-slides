import * as vscode from "vscode";
import * as fs from "fs";

class VSCodeEditor implements Editor {
  private rootFolderPath: Path;

  constructor(rootFolderPath: Path) {
    this.rootFolderPath = rootFolderPath;
  }

  async closeAllTabs() {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  }

  async openAllFiles() {
    const files = fs
      .readdirSync(this.rootFolderPath)
      .filter(
        fileOrDirectory =>
          !fs.statSync(this.pathTo(fileOrDirectory)).isDirectory()
      )
      .filter(file => !file.startsWith("."));

    await Promise.all(
      files.map(async file => {
        const document = await vscode.workspace.openTextDocument(
          this.pathTo(file)
        );

        return vscode.window.showTextDocument(document, {
          preview: false
        });
      })
    );

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

  async getSettings() {
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
  }

  private get pathToSettings(): Path {
    return this.pathTo("/.vscode/settings.json");
  }

  private pathTo(relativePath: Path): Path {
    return `${this.rootFolderPath}/${relativePath}`;
  }
}

type Path = string;

class FileSystemRepository implements Repository {
  private rootFolderPath: Path;
  private encoding = "utf-8";

  constructor(rootFolderPath: Path) {
    this.rootFolderPath = rootFolderPath;
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
    return `${this.rootFolderPath}/.vscode-slides.json`;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const fsRepository = new FileSystemRepository(getWorkspacePath());

  const toggleSlides = vscode.commands.registerCommand(
    "slides.toggle",
    async () => {
      const vscodeEditor = new VSCodeEditor(getWorkspacePath());
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
      const vscodeEditor = new VSCodeEditor(getWorkspacePath());
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

function getWorkspacePath(): Path {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length < 1) {
    throw new Error(
      "There are no workspace folder. We can't retrieve VS Code settings."
    );
  }

  return workspaceFolders[0].uri.path;
}

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

import { settings } from "./settings";

async function start(editor: Editor, repository: Repository) {
  await setSlidesSettings(editor, repository);
  await openAllSlides(editor);
  await editor.hideSideBar();
  await repository.store({ isActive: true });
}

async function setSlidesSettings(editor: Editor, repository: Repository) {
  await repository.store({
    settings: await editor.getSettings()
  });
  await editor.setSettings(settings);
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

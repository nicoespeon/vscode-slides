import * as vscode from "vscode";
import * as fs from "fs";

class VSCodeEditor implements Editor {
  private rootFolderPath: string;

  constructor(rootFolderPath: string) {
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

class InMemoryRepository implements Repository {
  private state: State = { settings: null, isActive: false };

  constructor(initialState: Partial<State>) {
    this.store(initialState);
  }

  async store(newState: Partial<State>) {
    this.state = { ...this.state, ...newState };
  }

  async get(): Promise<State> {
    return this.state;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const inMemoryRepository = new InMemoryRepository({ isActive: false });

  const toggleSlides = vscode.commands.registerCommand(
    "slides.toggle",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length < 1) {
        throw new Error(
          "There are no workspace folder. We can't retrieve VS Code settings."
        );
      }

      const vscodeEditor = new VSCodeEditor(workspaceFolders[0].uri.path);

      const { isActive } = await inMemoryRepository.get();

      if (isActive) {
        await restoreSettings(vscodeEditor, inMemoryRepository);
        await vscodeEditor.showSideBar();
      } else {
        await setSlidesSettings(vscodeEditor, inMemoryRepository);
        await openAllSlides(vscodeEditor);
        await vscodeEditor.hideSideBar();
      }

      inMemoryRepository.store({ isActive: !isActive });
    }
  );

  const previousSlide = vscode.commands.registerCommand(
    "slides.previous",
    async () => {
      const { isActive } = await inMemoryRepository.get();

      if (isActive) {
        await vscode.commands.executeCommand("workbench.action.previousEditor");
      }
    }
  );

  const nextSlide = vscode.commands.registerCommand("slides.next", async () => {
    const { isActive } = await inMemoryRepository.get();

    if (isActive) {
      await vscode.commands.executeCommand("workbench.action.nextEditor");
    }
  });

  context.subscriptions.push(toggleSlides);
  context.subscriptions.push(previousSlide);
  context.subscriptions.push(nextSlide);
}

async function restoreSettings(editor: Editor, repository: Repository) {
  const { settings } = await repository.get();

  if (settings) {
    await editor.setSettings(settings);
  }
}

import { settings } from "./settings";

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

export { exit, start };
export { Editor, Configuration, Repository, State, Settings };

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

import * as vscode from "vscode";

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
      configured.fontFamily || defaults["terminal.integrated.fontFamily"],
    "workbench.useMdPreview": configured.useMdPreview || false,
    "workbench.slidesFolder": configured.slidesFolder || ""
  });
}

/*
 *   The previous version of this method used the editor interface's
 *   open all files method to open the files in the root folder. To
 *   make sure that another settings file wasn't created, I had to
 *   use a more manual process.
 */
async function openAllSlides(editor: Editor) {
  var workspace = vscode.workspace;
  var workspaceFolders = workspace.workspaceFolders;
  const slidesFolder = workspace
    .getConfiguration("slides")
    .slidesFolder.replace(/.\/|\/$/g, "");

  await editor.closeAllTabs();
  if (workspaceFolders !== undefined && workspaceFolders.length >= 1) {
    var newUri = vscode.Uri.parse(
      workspaceFolders[0].uri.path + "/" + slidesFolder
    );
    try {
      var files = await workspace.fs.readDirectory(newUri);
    } catch (e) {
      console.error(e);
      throw new Error(
        "There was an error reading the slides directory. Please ensure that it exists."
      );
    }

    //This iterates and opens all of the files in the active folder
    for (let i = 0; i < files.length; i++) {
      console.log("Loading file " + files[i][0]);
      var openUri = vscode.Uri.parse(newUri.path + "/" + files[i][0]);
      try {
        await vscode.window.showTextDocument(openUri, {
          preserveFocus: true,
          preview: false,
          viewColumn: vscode.ViewColumn.Active
        });
      } catch (e) {
        console.error("There was an error loading file " + openUri.path);
        console.error(e);
        throw new Error("There was an error loading the file " + openUri.path);
      }
    }

    //This is needed to make the first-opened document the active one
    await vscode.window.showTextDocument(
      vscode.Uri.parse(newUri.path + "/" + files[0][0])
    );
  }
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
  useMdPreview:
    | boolean
    | false
    | "Specifies whether or not to use the MarkDown Preview Pane to view .md files";
  slidesFolder: string | "" | "Project subfolder where the slides are located.";
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

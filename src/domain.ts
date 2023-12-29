export { toggle, previous, next, exit };
export { Editor, Configuration, AnyObject, Repository, State, Settings };

async function toggle(editor: Editor, repository: Repository) {
  const { isActive } = await repository.get();

  if (isActive) {
    await exit(editor, repository);
  } else {
    await start(editor, repository);
  }
}

async function previous(editor: Editor, repository: Repository) {
  const { isActive } = await repository.get();

  if (isActive) {
    await editor.openPreviousFile();
  }
}

async function next(editor: Editor, repository: Repository) {
  const { isActive } = await repository.get();

  if (isActive) {
    await editor.openNextFile();
  }
}

async function exit(editor: Editor, repository: Repository) {
  const { isActive } = await repository.get();

  if (isActive) {
    await restoreSettings(editor, repository);
    await editor.showSideBar();
    await repository.store({ isActive: false });
  }
}

async function restoreSettings(editor: Editor, repository: Repository) {
  const { settings } = await repository.get();

  if (settings) {
    editor.setSettings(settings);
  }
}

async function start(editor: Editor, repository: Repository) {
  // Get editor configuration before we override it with Slides settings.
  const configuration = editor.getConfiguration();

  await setSlidesSettings(editor, repository);

  // Save the fact Slides is active so we can toggle settings back
  await repository.store({
    isActive: true
  });

  await openAllSlides(editor, configuration);
  await editor.hideSideBar();
}

async function setSlidesSettings(editor: Editor, repository: Repository) {
  await repository.store({
    settings: editor.getSettings()
  });

  editor.setSettings(getSlidesSettings(editor));
}

import { settings as defaults } from "./settings";

function getSlidesSettings(editor: Editor): Settings {
  const { editorSettings } = editor.getConfiguration();

  return JSON.stringify({
    ...defaults,
    ...editorSettings
  });
}

async function openAllSlides(editor: Editor, configuration: Configuration) {
  await editor.closeAllTabs();
  await editor.openAllFiles(configuration);
}

interface Editor {
  closeAllTabs(): Promise<void>;
  openAllFiles(configuration: Configuration): Promise<void>;
  openPreviousFile(): Promise<void>;
  openNextFile(): Promise<void>;
  hideSideBar(): Promise<void>;
  showSideBar(): Promise<void>;
  getSettings(): Settings | null;
  setSettings(settings: Settings): void;
  showError(message: string): void;
  showMessage(message: string): void;
  getConfiguration(): Configuration;
}

// Note: considering current usage, we might split Slides
// config (folder, previewMarkdownFiles) from editor settings.
interface Configuration {
  previewMarkdownFiles: boolean;
  folder: string;
  editorSettings: AnyObject;
}

type AnyObject = { [key: string]: any };

interface Repository {
  store(state: Partial<State>): Promise<void>;
  get(): Promise<State>;
}

interface State {
  settings: Settings | null;
  isActive: boolean;
}

type Settings = string;

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
    await editor.setSettings(settings);
  }
}

async function start(editor: Editor, repository: Repository) {
  // Get editor configuration before we override it with Slides settings.
  const configuration = editor.getConfiguration();

  await setSlidesSettings(editor, repository);

  try {
    await openAllSlides(editor, configuration);
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
  const { previewMarkdownFiles, editorSettings } = editor.getConfiguration();

  return JSON.stringify({
    ...defaults,
    ...(previewMarkdownFiles && {
      "slides.previewMarkdownFiles": true
    }),
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
  getSettings(): Promise<Settings | null>;
  setSettings(settings: Settings): Promise<void>;
  showError(message: string): void;
  showMessage(message: string): void;
  getConfiguration(): Configuration;
}

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

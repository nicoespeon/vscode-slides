import { toggle, previous, next, exit } from "./domain";
import { Editor, Settings, Configuration, Repository, State } from "./domain";

import { settings as defaultSettings } from "./settings";

describe("toggle", () => {
  it("should store current editor settings", async () => {
    const editorSettings: Settings = "{}";
    const editor = new FakeEditor(editorSettings);
    const repository = new InMemoryRepository();
    repository.store({ settings: "" });

    await toggle(editor, repository);

    const { settings } = await repository.get();
    expect(settings).toBe(editorSettings);
  });

  it("should set default slide settings", async () => {
    const editorSettings: Settings = "{}";
    const editor = new FakeEditor(editorSettings);
    const repository = new InMemoryRepository();

    await toggle(editor, repository);

    const settings = JSON.parse((await editor.getSettings()) || "");
    expect(settings).toEqual(defaultSettings);
  });

  it("should override default slide settings with editor configuration", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    const configuration = {
      theme: "A custom theme",
      fontFamily: "Helvetica",
      previewMarkdownFiles: true
    };
    jest.spyOn(editor, "getConfiguration").mockReturnValue(configuration);

    await toggle(editor, repository);

    const settings = JSON.parse((await editor.getSettings()) || "");
    expect(settings["workbench.colorTheme"]).toBe(configuration.theme);
    expect(settings["editor.fontFamily"]).toBe(configuration.fontFamily);
    expect(settings["terminal.integrated.fontFamily"]).toBe(
      configuration.fontFamily
    );
    expect(settings["slides.previewMarkdownFiles"]).toBe(
      configuration.previewMarkdownFiles
    );
  });
  it("should override default slide settings with slidesrc configuration", async () => {
    const editor = new FakeEditor(undefined, { "markdown.fontSize": 24 });
    const repository = new InMemoryRepository();

    await toggle(editor, repository);

    const settings = JSON.parse((await editor.getSettings()) || "");
    expect(settings["markdown.fontSize"]).toEqual(24);
  });
  it("should close all editor tabs", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    jest.spyOn(editor, "closeAllTabs");

    await toggle(editor, repository);

    expect(editor.closeAllTabs).toBeCalled();
  });

  it("should open all editor files", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    jest.spyOn(editor, "openAllFiles");

    await toggle(editor, repository);

    expect(editor.openAllFiles).toBeCalled();
  });

  describe("failed to open all editor files", () => {
    const errorMessage = "Files can't be open.";

    it("should show the error in a message", async () => {
      const editor = createEditorThatCantOpenFiles();
      const repository = new InMemoryRepository();
      jest.spyOn(editor, "showError");

      await toggle(editor, repository);

      expect(editor.showError).toBeCalledWith(
        expect.stringContaining(errorMessage)
      );
    });

    it("should not hide editor sidebar", async () => {
      const editor = createEditorThatCantOpenFiles();
      const repository = new InMemoryRepository();
      jest.spyOn(editor, "hideSideBar");

      await toggle(editor, repository);

      expect(editor.hideSideBar).not.toBeCalled();
    });

    it("should still store activated state", async () => {
      const editor = createEditorThatCantOpenFiles();
      const repository = new InMemoryRepository();
      repository.store({ isActive: false });

      await toggle(editor, repository);

      const { isActive } = await repository.get();
      expect(isActive).toBe(true);
    });

    function createEditorThatCantOpenFiles(): Editor {
      const editor = new FakeEditor();
      jest.spyOn(editor, "openAllFiles").mockRejectedValue(errorMessage);

      return editor;
    }
  });

  describe("successfully open all editor files", () => {
    it("should hide editor sidebar", async () => {
      const editor = new FakeEditor();
      const repository = new InMemoryRepository();
      jest.spyOn(editor, "hideSideBar");

      await toggle(editor, repository);

      expect(editor.hideSideBar).toBeCalled();
    });

    it("should store activated state", async () => {
      const editor = new FakeEditor();
      const repository = new InMemoryRepository();
      repository.store({ isActive: false });

      await toggle(editor, repository);

      const { isActive } = await repository.get();
      expect(isActive).toBe(true);
    });
  });

  describe("slides mode was already toggled", () => {
    shouldExitSlidesMode(async () => {
      const editor = new FakeEditor();
      const repository = new InMemoryRepository();

      await toggle(editor, repository);

      return {
        editor,
        repository,
        execute: () => toggle(editor, repository)
      };
    });
  });
});

describe("previous", () => {
  it("should open previous file", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    repository.store({ isActive: true });
    jest.spyOn(editor, "openPreviousFile");

    await previous(editor, repository);

    expect(editor.openPreviousFile).toBeCalled();
  });

  it("should not open previous file if slides is not active", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    repository.store({ isActive: false });
    jest.spyOn(editor, "openPreviousFile");

    await previous(editor, repository);

    expect(editor.openPreviousFile).not.toBeCalled();
  });
});

describe("next", () => {
  it("should open next file", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    repository.store({ isActive: true });
    jest.spyOn(editor, "openNextFile");

    await next(editor, repository);

    expect(editor.openNextFile).toBeCalled();
  });

  it("should not open next file if slides is not active", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    repository.store({ isActive: false });
    jest.spyOn(editor, "openNextFile");

    await next(editor, repository);

    expect(editor.openNextFile).not.toBeCalled();
  });
});

describe("exit", () => {
  shouldExitSlidesMode(async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    repository.store({ isActive: true });

    return {
      editor,
      repository,
      execute: () => exit(editor, repository)
    };
  });
});

function shouldExitSlidesMode(
  createContext: () => Promise<{
    execute: () => Promise<void>;
    editor: Editor;
    repository: Repository;
  }>
) {
  it("should restore settings from repository", async () => {
    const { editor, repository, execute } = await createContext();
    const settings: Settings = "{}";
    jest.spyOn(editor, "setSettings");
    repository.store({ settings });

    await execute();

    expect(editor.setSettings).toBeCalledWith(settings);
  });

  it("should not restore settings if none are stored", async () => {
    const { editor, execute } = await createContext();
    jest.spyOn(editor, "setSettings");

    await execute();

    expect(editor.setSettings).not.toBeCalled();
  });

  it("should show editor sidebar", async () => {
    const { editor, execute } = await createContext();
    jest.spyOn(editor, "showSideBar");

    await execute();

    expect(editor.showSideBar).toBeCalled();
  });

  it("should store deactivated state", async () => {
    const { repository, execute } = await createContext();

    await execute();

    const { isActive } = await repository.get();
    expect(isActive).toBe(false);
  });
}

class FakeEditor implements Editor {
  private settings: Settings | null;
  private _fakeRC: any;
  constructor(settings?: Settings, fakeRC?: any) {
    this.settings = settings || null;
    this._fakeRC = fakeRC || null;
  }

  async closeAllTabs() {}
  async openAllFiles() {}
  async openPreviousFile() {}
  async openNextFile() {}

  async hideSideBar() {}
  async showSideBar() {}

  async getSettings() {
    return this.settings;
  }
  async setSettings(settings: Settings) {
    this.settings = settings;
  }

  showError() {}
  showMessage() {}

  getConfiguration(): Configuration {
    return {
      theme: null,
      fontFamily: null,
      previewMarkdownFiles: false,
      ...(this.slidesRcExist() && this._fakeRC)
    };
  }
  slidesRcExist(): boolean {
    return this._fakeRC !== null;
  }
}

class InMemoryRepository implements Repository {
  private state: State = { settings: null, isActive: false };

  async store(newState: Partial<State>) {
    this.state = { ...this.state, ...newState };
  }

  async get() {
    return this.state;
  }
}

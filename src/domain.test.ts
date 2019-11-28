import { start, exit } from "./domain";
import { Editor, Settings, Configuration, Repository, State } from "./domain";

import { settings as defaultSettings } from "./settings";

describe("start", () => {
  it("should store current editor settings", async () => {
    const editorSettings: Settings = "{}";
    const editor = new FakeEditor(editorSettings);
    const repository = new InMemoryRepository();
    repository.store({ settings: "" });

    await start(editor, repository);

    const { settings } = await repository.get();
    expect(settings).toBe(editorSettings);
  });

  it("should set default slide settings", async () => {
    const editorSettings: Settings = "{}";
    const editor = new FakeEditor(editorSettings);
    const repository = new InMemoryRepository();

    await start(editor, repository);

    const settings = JSON.parse((await editor.getSettings()) || "");
    expect(settings).toEqual(defaultSettings);
  });

  it("should override default slide settings with editor configuration", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    const configuration = {
      theme: "A custom theme",
      fontFamily: "Helvetica",
      useMdPreview: false,
      slidesFolder: ""
    };
    jest.spyOn(editor, "getConfiguration").mockReturnValue(configuration);

    await start(editor, repository);

    const settings = JSON.parse((await editor.getSettings()) || "");
    expect(settings["workbench.colorTheme"]).toBe(configuration.theme);
    expect(settings["editor.fontFamily"]).toBe(configuration.fontFamily);
    expect(settings["terminal.integrated.fontFamily"]).toBe(
      configuration.fontFamily
    );
    expect(settings["workbench.useMdPreview"]).toBe(false);
    expect(settings["workbench.slidesFolder"]).toBe("");
  });

  it("should close all editor tabs", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    jest.spyOn(editor, "closeAllTabs");

    await start(editor, repository);

    expect(editor.closeAllTabs).toBeCalled();
  });

  it("should open all editor files", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    jest.spyOn(editor, "openAllFiles");

    await start(editor, repository);

    expect(editor.openAllFiles).toBeCalled();
  });

  describe("failed to open all editor files", () => {
    const errorMessage = "Files can't be open.";

    it("should show the error in a message", async () => {
      const editor = createEditorThatCantOpenFiles();
      const repository = new InMemoryRepository();
      jest.spyOn(editor, "showError");

      await start(editor, repository);

      expect(editor.showError).toBeCalledWith(
        expect.stringContaining(errorMessage)
      );
    });

    it("should not hide editor sidebar", async () => {
      const editor = createEditorThatCantOpenFiles();
      const repository = new InMemoryRepository();
      jest.spyOn(editor, "hideSideBar");

      await start(editor, repository);

      expect(editor.hideSideBar).not.toBeCalled();
    });

    it("should still store activated state", async () => {
      const editor = createEditorThatCantOpenFiles();
      const repository = new InMemoryRepository();
      repository.store({ isActive: false });

      await start(editor, repository);

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

      await start(editor, repository);

      expect(editor.hideSideBar).toBeCalled();
    });

    it("should store activated state", async () => {
      const editor = new FakeEditor();
      const repository = new InMemoryRepository();
      repository.store({ isActive: false });

      await start(editor, repository);

      const { isActive } = await repository.get();
      expect(isActive).toBe(true);
    });
  });
});

describe("exit", () => {
  it("should restore settings from repository", async () => {
    const settings: Settings = "{}";
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    jest.spyOn(editor, "setSettings");
    repository.store({ settings });

    await exit(editor, repository);

    expect(editor.setSettings).toBeCalledWith(settings);
  });

  it("should not restore settings if none are stored", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    jest.spyOn(editor, "setSettings");

    await exit(editor, repository);

    expect(editor.setSettings).not.toBeCalled();
  });

  it("should show editor sidebar", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    jest.spyOn(editor, "showSideBar");

    await exit(editor, repository);

    expect(editor.showSideBar).toBeCalled();
  });

  it("should store deactivated state", async () => {
    const editor = new FakeEditor();
    const repository = new InMemoryRepository();
    repository.store({ isActive: true });

    await exit(editor, repository);

    const { isActive } = await repository.get();
    expect(isActive).toBe(false);
  });
});

class FakeEditor implements Editor {
  private settings: Settings | null;

  constructor(settings?: Settings) {
    this.settings = settings || null;
  }

  async closeAllTabs() {}
  async openAllFiles() {}

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
      useMdPreview: false,
      slidesFolder: ""
    };
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

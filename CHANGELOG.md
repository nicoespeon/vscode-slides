# Changelog

All notable changes to the **Slides** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Make path to settings OS agnostic, so the extension can work on Windows too

## [2.0.1] - 2019-11-03

### Fixed

- When you have a large number of slides (like 60+), Slides will open all of them in the correct order. It won't be instant, but it will be in the correct order (and still quite fast).

## [2.0.0] - 2019-10-26

### Breaking changes

- Leverage VS Code workspace data storage to persist the state. Slides won't create a `.vscode-slides.json` in your workspace anymore, which is great! But that means it won't rely on the existing ones, so **it will consider current settings to be the default ones**. You might need to reset them manually.

### Added

- Make **theme** and **font family** configurable.

## [1.0.0] - 2019-10-24

### Added

- Improve README instructions to get started with the Extension

## [0.2.1] - 2019-10-24

### Fixed

- Specify macOS shortcuts for navigation so they work too

## [0.2.0] - 2019-10-23

### Breaking changes

- Change navigation shortcuts to use `Ctrl` instead of `Alt`, so we don't override standard shortcuts as it's a less common combination.

### Fixed

- Make the extension work when workspace has no settings set.
- Gracefully handle when files can't be open.
- Give VS Code enough time so we're sure we open all slides & we focus on the first one.

## [0.1.0] - 2019-10-22

### Added

- **Toggle Slides mode**. It applies optimized settings for VS Code when activated, and reset original settings when deactivated.
- **Open all files in alphabetical order** when activated.
- **Shortcuts to navigate between slides** when activated.
- **Shortcut to deactivate Slides** when activated.

[unreleased]: https://github.com/nicoespeon/vscode-slides/compare/2.0.1...HEAD
[2.0.1]: https://github.com/nicoespeon/vscode-slides/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/nicoespeon/vscode-slides/compare/1.0.0...2.0.0
[1.0.0]: https://github.com/nicoespeon/vscode-slides/compare/0.2.1...1.0.0
[0.2.1]: https://github.com/nicoespeon/vscode-slides/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/nicoespeon/vscode-slides/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/nicoespeon/vscode-slides/compare/8fdc599d586b5ad4614d038d232c840eeebe2412...0.1.0

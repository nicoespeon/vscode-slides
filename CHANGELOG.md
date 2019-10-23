# Changelog

All notable changes to the **Slides** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Breaking changes

- Change navigation shortcuts to use `Ctrl` instead of `Alt`, so we don't override standard shortcuts as it's a less common combination.

### Fixed

- Make the extension work when workspace has no settings set.
- Gracefully handle when files can't be open.

## [0.1.0] - 2019-10-22

### Added

- **Toggle Slides mode**. It applies optimized settings for VS Code when activated, and reset original settings when deactivated.
- **Open all files in alphabetical order** when activated.
- **Shortcuts to navigate between slides** when activated.
- **Shortcut to deactivate Slides** when activated.

[unreleased]: https://github.com/nicoespeon/vscode-slides/compare/0.1.0...HEAD
[0.1.0]: https://github.com/nicoespeon/vscode-slides/compare/8fdc599d586b5ad4614d038d232c840eeebe2412...0.1.0

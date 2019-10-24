# 👩‍🏫 VS Code Slides

Slides is a Visual Studio Code extension that helps you use your editor as a presentation tool.

![Demo of Slides features][slides-showcase]

This is inspired from [André Staltz's post][andre-staltz-post] where he explained how you can use VS Code **only** to give a pleasant, "live coding"-like presentation.

[> Give a feedback][create-new-issue]

## Features

- ⚡ Toggle Slides mode with a shortcut
- 🎨 Apply optimized settings for presentation
- 👐 Handy shortcuts to navigate between slides

### Toggle Slides mode

Use `Ctrl Alt p` (`⌘ ⌥ p` on Mac) to toggle Slides mode.

**When you activate Slides**, a few things happen:

- Your settings got stored, so they can be reset
- Settings get replaced with others that are optimized for presentation
- All files are open in the alphabetical order, as tabs
- You can navigate between each tab with convenient shortcuts (see below)

**When you deactivate Slides**, your original settings get restored.

### Navigate between tabs (when Slides is active)

| Shortcut   | Shortcut on Mac | Operation            |
| ---------- | --------------- | -------------------- |
| `Ctrl →`   | `⌘ →`           | Go to next slide     |
| `Ctrl ←`   | `⌘ ←`           | Go to previous slide |
| `Ctrl Esc` | `⌘ Esc`         | Deactivate Slides    |

You can also re-use _Toggle Slides mode_ to deactivate Slides.

## Pre-requisite

Slides is opinionated. To work efficiently, you first need to install:

1. [The "GitHub Clean White" theme][recommended-theme] on VS Code
1. [The "SF Mono" font][recommended-font] on your machine

## Installation

1. Click on the Extensions icon (usually on the left-hand side of your editor).
1. Search for "Slides".
1. Find the extension in the list and click the install button.

## How to use best

1. Create one file per "slide"
1. Name them by number: `01.md`, `02.js`, `03.01.md`, `03.02.png`, etc.
1. Toggle Slides before you start your talk 🎤

### Tips

- Prefer to keep coding files empty, or with easy content supposed to be known.

## Release Notes

[Have a look at our CHANGELOG][changelog] to get the details of all changes between versions.

### Versioning

We follow [SemVer][semver] convention for versionning.

That means our releases use the following format:

```
<major>.<minor>.<patch>
```

- Breaking changes bump `<major>` (and reset `<minor>` & `<patch>`)
- Backward compatible changes bump `<minor>` (and reset `<patch>`)
- Bug fixes bump `<patch>`

## Contributing

### [Contributing Guide][contributing]

Read our [contributing guide][contributing] to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Abracadabra.

### [Good First Issues][good-first-issues]

To help you get your feet wet and become familiar with our contribution process, we have a list of [good first issues][good-first-issues] that contains things with a relatively limited scope. This is a great place to get started!

## Contributors ✨

Thanks goes to these wonderful people ([emoji key][all-contributors-emoji]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://nicoespeon.com"><img src="https://avatars.githubusercontent.com/u/1094774?v=3" width="100px;" alt="Nicolas Carlo"/><br /><sub><b>Nicolas Carlo</b></sub></a><br /><a href="#question-nicoespeon" title="Answering Questions">💬</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Code">💻</a> <a href="https://github.com/nicoespeon/abracadabra/commits?author=nicoespeon" title="Documentation">📖</a><br /><a href="#review-nicoespeon" title="Reviewed Pull Requests">👀</a> <a href="#ideas-nicoespeon" title="Ideas">🤔</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.

Contributions of any kind are welcome!

## License

💁 [MIT][license]

<!-- Links -->

[andre-staltz-post]: https://staltz.com/your-ide-as-a-presentation-tool.html
[change-keybindings]: https://code.visualstudio.com/docs/getstarted/keybindings
[semver]: http://semver.org/
[all-contributors]: https://allcontributors.org
[all-contributors-emoji]: https://allcontributors.org/docs/en/emoji-key
[recommended-theme]: https://marketplace.visualstudio.com/items?itemName=saviorisdead.Theme-GitHubCleanWhite
[recommended-font]: https://github.com/ZulwiyozaPutra/SF-Mono-Font

<!-- Repo links -->

[changelog]: https://github.com/nicoespeon/vscode-slides/blob/master/CHANGELOG.md
[contributing]: https://github.com/nicoespeon/vscode-slides/blob/master/CONTRIBUTING.md
[license]: https://github.com/nicoespeon/vscode-slides/blob/master/LICENSE.md
[good-first-issues]: https://github.com/nicoespeon/vscode-slides/issues?q=is%3Aissue+is%3Aopen+label%3A%22%3Awave%3A+Good+first+issue%22
[create-new-issue]: https://github.com/nicoespeon/vscode-slides/issues/new/choose

<!-- Assets -->

[slides-showcase]: https://github.com/nicoespeon/vscode-slides/blob/master/assets/showcase.gif?raw=true

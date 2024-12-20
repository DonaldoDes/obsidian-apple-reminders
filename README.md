# Obsidian Apple Reminders Plugin

A plugin for [Obsidian](https://obsidian.md) that seamlessly integrates your todos with Apple Reminders.

## Features

-   Sync todos between Obsidian and Apple Reminders
-   Add due dates to your reminders
-   Quick-add button next to todos
-   Automatic sync checking every hour
-   Bidirectional sync: updates in Apple Reminders are reflected in Obsidian
-   Support for multiple languages (English, French)
-   Keyboard shortcuts for quick actions

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Apple Reminders"
4. Click Install, then Enable

### Manual Installation

1. Download the latest release from the releases page
2. Extract the files into your vault's plugins folder: `<vault>/.obsidian/plugins/obsidian-apple-reminders/`
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

## Usage

### Basic Usage

1. Create a todo in Obsidian using the checkbox syntax: `- [ ] Your todo`
2. Use Ctrl+Enter (or Cmd+Enter on macOS) to send it to Apple Reminders
3. Optionally add a due date when prompted
4. The todo will be synced with Apple Reminders and marked with a link

### Settings

-   **Default List**: Choose which Apple Reminders list to use
-   **Quick Add Button**: Toggle visibility of quick-add buttons next to todos
-   **Mark as Done**: Automatically check completed todos
-   **Custom Hotkeys**: Configure keyboard shortcuts

## Development

### Prerequisites

-   Node.js >= 16
-   npm or yarn
-   macOS (for Apple Reminders integration)

### Local Setup

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev` to start compilation in watch mode
4. Create a symbolic link from your repo to your vault's plugin folder:
    ```bash
    ln -s /path/to/repo /path/to/vault/.obsidian/plugins/obsidian-apple-reminders
    ```

### Building

-   `npm run build` - Production build
-   `npm run dev` - Development build with watch mode

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

-   Follow TypeScript best practices
-   Use ESLint for code quality
-   Write meaningful commit messages
-   Add documentation for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

-   Report bugs on the [GitHub issues page](https://github.com/your-username/obsidian-apple-reminders/issues)
-   Request features through issues
-   Check the [documentation](docs/README.md) for detailed guides

## Credits

Created and maintained by the Obsidian community. Special thanks to all contributors!

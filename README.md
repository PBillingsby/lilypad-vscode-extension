# Lilypad Code Helper

A Visual Studio Code extension that allows you to select code blocks and query Lilypad AI about them.

## Features

- Highlight any code in your editor and ask Lilypad AI questions about it
- View responses in a clean, formatted webview panel
- Configure API token securely
- Context menu integration for quick access

## Installation

### From the VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Lilypad Code Helper"
4. Click Install

### From VSIX file

1. Download the `.vsix` file from the releases page
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click on the "..." menu (top-right of the Extensions view)
4. Select "Install from VSIX..."
5. Navigate to the downloaded file and select it

## Setup

Before using the extension, you need to configure your Lilypad API token:

1. Get your API token from [Lilypad](https://anura-testnet.lilypad.tech/)
2. In VS Code, open the Command Palette (Ctrl+Shift+P)
3. Type and select "Configure Lilypad API Token"
4. Enter your API token when prompted

Alternatively, you can set the `LILYPAD_API_TOKEN` environment variable.

## Usage

1. Select a block of code in your editor
2. Right-click and select "Ask Lilypad about this code" from the context menu, or:
3. Open the Command Palette (Ctrl+Shift+P) and select "Ask Lilypad about this code"
4. Enter your question about the selected code
5. Wait for Lilypad AI to process your query
6. View the response in the webview panel that opens

## Configuration

The extension supports the following configuration options:

- `lilypad-helper.apiToken`: Your Lilypad API token (stored securely)
- `lilypad-helper.model`: The Lilypad model to use (default: "llama2:13b")
- `lilypad-helper.maxTokens`: Maximum number of tokens in the response (default: 2048)

You can modify these settings in VS Code's settings (File > Preferences > Settings).

## Building from Source

To build the extension from source:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile TypeScript
4. Press F5 in VS Code to launch a new window with the extension loaded

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

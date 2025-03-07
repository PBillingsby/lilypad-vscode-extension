import * as vscode from "vscode";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const API_URL = "https://anura-testnet.lilypad.tech/api/v1/chat/completions";
const MODELS_URL = "https://anura-testnet.lilypad.tech/api/v1/models";
const API_TOKEN = process.env.LILYPAD_API_TOKEN;

export function activate(context: vscode.ExtensionContext) {
  console.log("🐸 Lilypad Helper extension activated.");

  const askQueryCommand = vscode.commands.registerCommand(
    "lilypad-helper.askQuery",
    async () => {
      await handleAskQuery();
    }
  );

  const configureTokenCommand = vscode.commands.registerCommand(
    "lilypad-helper.configureToken",
    async () => {
      const token = await vscode.window.showInputBox({
        prompt: "Enter your Lilypad API token",
        password: true,
      });

      if (token) {
        await context.secrets.store("lilypad-api-token", token);
        vscode.window.showInformationMessage("Lilypad API token saved!");
      }
    }
  );

  vscode.window.showInformationMessage("🐸 Lilypad code helper is now active!");

  context.subscriptions.push(askQueryCommand, configureTokenCommand);
}

async function handleAskQuery() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active text editor found.");
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  if (!selectedText) {
    vscode.window.showWarningMessage("Please select some code first.");
    return;
  }

  const models = await fetchModels();
  if (!models || models.length === 0) {
    vscode.window.showErrorMessage("Failed to fetch available models.");
    return;
  }

  const selectedModel = await vscode.window.showQuickPick(models, {
    placeHolder: "Select a Lilypad AI model",
  });

  if (!selectedModel) return;

  const userQuery = await vscode.window.showInputBox({
    prompt: "🐸 Enter your query about the selected code",
    placeHolder: "E.g., What does this function do?",
  });

  if (!userQuery) return;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "🐸 Querying Lilypad...",
      cancellable: true,
    },
    async (_, token) => {
      try {
        const responseText = await sendToLilypad(selectedText, userQuery, selectedModel, token);
        if (responseText) {
          displayResponseInWebview(responseText, userQuery, selectedModel);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    }
  );
}

async function fetchModels(): Promise<string[]> {
  try {
    const response = await fetch(MODELS_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data?.data?.models || [];
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error fetching models: ${error.message}`);
    return [];
  }
}

async function sendToLilypad(
  code: string,
  query: string,
  model: string,
  cancelToken: vscode.CancellationToken
): Promise<string> {
  const apiToken = vscode.workspace.getConfiguration("lilypad-helper").get("apiToken") || API_TOKEN;

  if (!apiToken) {
    throw new Error("Lilypad API token is missing. Please configure it first.");
  }

  const messages = [
    { role: "system", content: "You are an AI assistant analyzing code." },
    { role: "user", content: `Code:\n\`\`\`\n${code}\n\`\`\`\nQuestion: ${query}` },
  ];

  const requestBody = {
    model,
    messages,
    max_tokens: 2048,
    temperature: 0.7,
    stream: false
  };

  const controller = new AbortController();
  cancelToken.onCancellationRequested(() => controller.abort());

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Authorization": `Bearer ${apiToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal as any,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    const messages = responseText.split("\n").filter((line) => line.startsWith("data: "));
    for (const line of messages) {
      try {
        const parsedData = JSON.parse(line.replace("data: ", ""));
        if (parsedData?.message?.role === "assistant") {
          return parsedData.message.content.trim();
        }
      } catch {
        continue;
      }
    }

    return "No valid response received from Lilypad.";
  } catch (error: any) {
    throw new Error(`Lilypad API Error: ${error.message}`);
  }
}

function displayResponseInWebview(response: string, query: string, model: string) {
  const panel = vscode.window.createWebviewPanel(
    "lilypadResponse",
    `Lilypad Response - ${model}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Lilypad Response</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background: #121212;
                color: #e0e0e0;
            }
            .container {
                max-width: 800px;
                margin: auto;
            }
            .query-container, .response-container {
                background: #1e1e1e;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 20px;
                border: 1px solid #333;
            }
            h3 {
                margin-top: 0;
                color: #ffffff;
            }
            pre {
                background: #2d2d2d;
                color: #d4d4d4;
                padding: 12px;
                border-radius: 4px;
                white-space: pre-wrap; 
                word-wrap: break-word;
                overflow: auto;
                max-height: 400px;
            }
            code {
                font-family: 'Courier New', monospace;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="query-container">
                <h3>Selected Model: ${model}</h3>
                <p><strong>Your Query:</strong> ${query}</p>
            </div>
            <div class="response-container">
                <h3>Lilypad Response</h3>
                <pre><code>${response.replace(/\n/g, "<br>")}</code></pre>
            </div>
        </div>
    </body>
    </html>
  `;
}

export function deactivate() {
  console.log("Lilypad Helper extension deactivated.");
}

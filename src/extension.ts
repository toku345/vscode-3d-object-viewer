import * as vscode from 'vscode';

class ViewerPanelManager {
	private static currentPanel: vscode.WebviewPanel | undefined;

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (ViewerPanelManager.currentPanel) {
			ViewerPanelManager.currentPanel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			'3dViewer',
			'3D Viewer',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		ViewerPanelManager.currentPanel = panel;

		// Set the webview's initial html content
		panel.webview.html = ViewerPanelManager.getWebviewContent(panel.webview, extensionUri);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		panel.onDidDispose(
			() => {
				ViewerPanelManager.currentPanel = undefined;
			},
			null,
			[]
		);
	}

	private static getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net;">
				<title>3D Viewer</title>
				<style>
					body {
						margin: 0;
						padding: 0;
						overflow: hidden;
						background-color: #1e1e1e;
					}
					#canvas-container {
						width: 100vw;
						height: 100vh;
					}
				</style>
			</head>
			<body>
				<div id="canvas-container"></div>
				<script nonce="${nonce}" src="https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js"></script>
				<script nonce="${nonce}">
					// Basic Three.js setup will be implemented here
					const container = document.getElementById('canvas-container');
					
					// Placeholder message for now
					const message = document.createElement('div');
					message.style.color = '#ffffff';
					message.style.padding = '20px';
					message.style.fontFamily = 'monospace';
					message.textContent = '3D Viewer initialized. Three.js scene will be implemented here.';
					container.appendChild(message);
				</script>
			</body>
			</html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('3D Object Viewer extension is now active!');

	// Register the command for opening the 3D viewer
	const disposable = vscode.commands.registerCommand('3d-object-viewer-kiro.open3DViewer', () => {
		ViewerPanelManager.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	// Clean up resources when the extension is deactivated
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
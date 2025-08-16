import * as vscode from 'vscode';

export class ViewerPanelManager {
	private static panels: Map<string, vscode.WebviewPanel> = new Map();
	private static panelCounter: number = 0;

	/**
	 * Create a new 3D Viewer panel or show an existing one
	 */
	public static createPanel(extensionUri: vscode.Uri): string {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// Generate unique panel ID
		const panelId = `3d-viewer-${++ViewerPanelManager.panelCounter}`;

		// Create a new panel
		const panel = vscode.window.createWebviewPanel(
			'3dViewer',
			`3D Viewer ${ViewerPanelManager.panelCounter}`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri]
			}
		);

		// Store the panel
		ViewerPanelManager.panels.set(panelId, panel);

		// Set the webview's initial html content
		panel.webview.html = ViewerPanelManager.getWebviewContent(panel.webview, extensionUri);

		// Handle panel disposal
		panel.onDidDispose(
			() => {
				ViewerPanelManager.disposePanel(panelId);
			},
			null,
			[]
		);

		// Handle panel visibility changes
		panel.onDidChangeViewState(
			e => {
				if (e.webviewPanel.visible) {
					// Panel became visible
					ViewerPanelManager.onPanelVisible(panelId);
				}
			},
			null,
			[]
		);

		return panelId;
	}

	/**
	 * Get a panel by ID
	 */
	public static getPanel(panelId: string): vscode.WebviewPanel | undefined {
		return ViewerPanelManager.panels.get(panelId);
	}

	/**
	 * Show an existing panel
	 */
	public static showPanel(panelId: string, column?: vscode.ViewColumn): boolean {
		const panel = ViewerPanelManager.panels.get(panelId);
		if (panel) {
			panel.reveal(column);
			return true;
		}
		return false;
	}

	/**
	 * Dispose a specific panel
	 */
	public static disposePanel(panelId: string): boolean {
		const panel = ViewerPanelManager.panels.get(panelId);
		if (panel) {
			ViewerPanelManager.panels.delete(panelId);
			// Note: The actual disposal is handled by VS Code
			// We just remove it from our tracking
			return true;
		}
		return false;
	}

	/**
	 * Dispose all panels
	 */
	public static disposeAll(): void {
		ViewerPanelManager.panels.forEach((panel) => {
			panel.dispose();
		});
		ViewerPanelManager.panels.clear();
	}

	/**
	 * Get all active panel IDs
	 */
	public static getActivePanelIds(): string[] {
		return Array.from(ViewerPanelManager.panels.keys());
	}

	/**
	 * Update panel content
	 */
	public static updatePanel(panelId: string, content: string): boolean {
		const panel = ViewerPanelManager.panels.get(panelId);
		if (panel) {
			panel.webview.html = content;
			return true;
		}
		return false;
	}

	/**
	 * Send a message to a panel's webview
	 */
	public static async postMessageToPanel(panelId: string, message: any): Promise<boolean> {
		const panel = ViewerPanelManager.panels.get(panelId);
		if (panel) {
			return await panel.webview.postMessage(message);
		}
		return false;
	}

	/**
	 * Handle panel becoming visible
	 */
	private static onPanelVisible(panelId: string): void {
		// This can be used for refreshing content or other visibility-related actions
		console.log(`Panel ${panelId} became visible`);
	}

	/**
	 * Generate webview content
	 */
	private static getWebviewContent(webview: vscode.Webview, _extensionUri: vscode.Uri): string {
		// Use a nonce to only allow specific scripts to be run
		const nonce = ViewerPanelManager.getNonce();

		// Get Three.js from CDN
		const threejsUri = 'https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js';

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
						font-family: var(--vscode-font-family);
					}
					#canvas-container {
						width: 100vw;
						height: 100vh;
						position: relative;
					}
					#info {
						position: absolute;
						top: 10px;
						left: 10px;
						color: var(--vscode-foreground);
						background: var(--vscode-editor-background);
						padding: 10px;
						border-radius: 4px;
						font-size: 12px;
						opacity: 0.9;
					}
					#error-message {
						color: var(--vscode-errorForeground);
						padding: 20px;
						text-align: center;
					}
				</style>
			</head>
			<body>
				<div id="canvas-container">
					<div id="info">
						3D Viewer initialized<br>
						Use mouse to interact
					</div>
				</div>
				<script nonce="${nonce}" src="${threejsUri}"></script>
				<script nonce="${nonce}">
					// Initialize Three.js scene
					const container = document.getElementById('canvas-container');
					
					// Check WebGL support
					if (!window.WebGLRenderingContext) {
						const errorDiv = document.createElement('div');
						errorDiv.id = 'error-message';
						errorDiv.textContent = 'WebGL is not supported in your browser.';
						container.innerHTML = '';
						container.appendChild(errorDiv);
					} else {
						// Placeholder for Three.js scene initialization
						// This will be implemented in the next tasks
						console.log('Three.js loaded, ready for scene initialization');
					}

					// Listen for messages from the extension
					window.addEventListener('message', event => {
						const message = event.data;
						console.log('Received message:', message);
						// Handle messages from the extension here
					});
				</script>
			</body>
			</html>`;
	}

	/**
	 * Generate a nonce for CSP
	 */
	private static getNonce(): string {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
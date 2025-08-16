import * as vscode from 'vscode';
import { WebviewContentProvider } from './webviewContentProvider';

export class ViewerPanelManager {
	private static panels: Map<string, vscode.WebviewPanel> = new Map();
	private static panelCounter: number = 0;
	private static contentProvider: WebviewContentProvider;

	/**
	 * Initialize the ViewerPanelManager with context
	 */
	public static initialize(context: vscode.ExtensionContext): void {
		ViewerPanelManager.contentProvider = new WebviewContentProvider(context);
	}

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

		// Set the webview's initial html content using WebviewContentProvider
		panel.webview.html = ViewerPanelManager.contentProvider.getHtmlContent(panel.webview);

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
	public static updatePanel(panelId: string): boolean {
		const panel = ViewerPanelManager.panels.get(panelId);
		if (panel) {
			panel.webview.html = ViewerPanelManager.contentProvider.getHtmlContent(panel.webview);
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
}
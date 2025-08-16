import * as vscode from 'vscode';
import { ViewerPanelManager } from './ViewerPanelManager';

export function activate(context: vscode.ExtensionContext) {
	console.log('3D Object Viewer extension is now active!');

	// Initialize the ViewerPanelManager with context
	ViewerPanelManager.initialize(context);

	// Register the command for opening the 3D viewer
	const disposable = vscode.commands.registerCommand('3d-object-viewer-kiro.open3DViewer', () => {
		const panelId = ViewerPanelManager.createPanel(context.extensionUri);
		console.log(`Created 3D Viewer panel with ID: ${panelId}`);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	// Clean up resources when the extension is deactivated
	ViewerPanelManager.disposeAll();
}
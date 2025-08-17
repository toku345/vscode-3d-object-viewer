import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { ViewerPanelManager } from '../ViewerPanelManager';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('ViewerPanelManager resource cleanup', () => {
		// Test that ViewerPanelManager can be disposed without errors
		const initialPanelCount = ViewerPanelManager.getActivePanelIds().length;
		
		// Dispose all panels (should not throw errors even if no panels exist)
		ViewerPanelManager.disposeAll();
		
		// Verify all panels are cleared
		const finalPanelCount = ViewerPanelManager.getActivePanelIds().length;
		assert.strictEqual(finalPanelCount, 0, 'All panels should be disposed');
		
		// Test should complete without throwing errors
		assert.ok(true, 'Resource cleanup completed successfully');
	});
});

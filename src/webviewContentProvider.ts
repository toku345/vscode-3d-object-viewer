import * as vscode from 'vscode';

export class WebviewContentProvider {
    constructor(
        _context: vscode.ExtensionContext
    ) {}

    getHtmlContent(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        
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
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #error-message {
            color: #f48771;
            font-family: sans-serif;
            text-align: center;
            padding: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div id="canvas-container">
        <div id="error-message"></div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js"></script>
    <script nonce="${nonce}">
        ${this.getViewerScript()}
    </script>
</body>
</html>`;
    }

    private getViewerScript(): string {
        return `
        // Global variables for resource management
        let viewerResources = null;

        // WebGL support check
        function isWebGLSupported() {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && 
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        }

        function showError(message) {
            const errorDiv = document.getElementById('error-message');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        // Resource cleanup function
        function cleanupResources() {
            if (!viewerResources) return;

            console.log('Cleaning up 3D viewer resources...');

            // Stop animation loop
            if (viewerResources.animationId) {
                cancelAnimationFrame(viewerResources.animationId);
                viewerResources.animationId = null;
            }

            // Remove event listeners
            if (viewerResources.eventListeners) {
                viewerResources.eventListeners.forEach(({ element, event, handler }) => {
                    element.removeEventListener(event, handler);
                });
                viewerResources.eventListeners = [];
            }

            // Dispose Three.js resources
            if (viewerResources.scene) {
                // Dispose all objects in the scene
                viewerResources.scene.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                    if (object.texture) {
                        object.texture.dispose();
                    }
                });
                viewerResources.scene.clear();
            }

            // Dispose renderer
            if (viewerResources.renderer) {
                viewerResources.renderer.dispose();
                viewerResources.renderer.forceContextLoss();
                
                // Remove canvas from DOM
                const canvas = viewerResources.renderer.domElement;
                if (canvas && canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            }

            // Clear references
            viewerResources = null;

            console.log('3D viewer resources cleaned up successfully');
        }

        // Setup cleanup on page unload
        window.addEventListener('beforeunload', cleanupResources);
        window.addEventListener('unload', cleanupResources);

        // Listen for VS Code webview disposal message
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'dispose') {
                cleanupResources();
            }
        });

        // Main initialization
        if (!isWebGLSupported()) {
            showError('WebGL is not supported in your environment. Please use a WebGL-compatible browser.');
        } else {
            try {
                initializeViewer();
            } catch (error) {
                showError('Failed to initialize 3D viewer: ' + error.message);
                cleanupResources();
            }
        }

        function initializeViewer() {
            // Initialize resource tracking object
            viewerResources = {
                scene: null,
                camera: null,
                renderer: null,
                cube: null,
                geometry: null,
                material: null,
                lights: [],
                animationId: null,
                eventListeners: []
            };

            // Scene setup
            viewerResources.scene = new THREE.Scene();
            viewerResources.scene.background = new THREE.Color(0x1e1e1e);

            // Camera setup
            viewerResources.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            viewerResources.camera.position.z = 5;

            // Renderer setup
            viewerResources.renderer = new THREE.WebGLRenderer({ antialias: true });
            viewerResources.renderer.setSize(window.innerWidth, window.innerHeight);
            viewerResources.renderer.setPixelRatio(window.devicePixelRatio);
            document.getElementById('canvas-container').appendChild(viewerResources.renderer.domElement);

            // Create cube
            viewerResources.geometry = new THREE.BoxGeometry(2, 2, 2);
            viewerResources.material = new THREE.MeshPhongMaterial({ 
                color: 0x0099ff,
                specular: 0x111111,
                shininess: 100
            });
            viewerResources.cube = new THREE.Mesh(viewerResources.geometry, viewerResources.material);
            viewerResources.scene.add(viewerResources.cube);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            viewerResources.scene.add(ambientLight);
            viewerResources.lights.push(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            viewerResources.scene.add(directionalLight);
            viewerResources.lights.push(directionalLight);

            // Interaction state
            let isDragging = false;
            let previousMousePosition = { x: 0, y: 0 };
            let currentScale = 1;
            const minScale = 0.5;
            const maxScale = 3;

            // Mouse interaction handlers with cleanup tracking
            const mouseDownHandler = (e) => {
                isDragging = true;
                previousMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            };

            const mouseMoveHandler = (e) => {
                if (!isDragging || !viewerResources || !viewerResources.cube) return;

                const deltaMove = {
                    x: e.clientX - previousMousePosition.x,
                    y: e.clientY - previousMousePosition.y
                };

                viewerResources.cube.rotation.y += deltaMove.x * 0.01;
                viewerResources.cube.rotation.x += deltaMove.y * 0.01;

                previousMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            };

            const mouseUpHandler = () => {
                isDragging = false;
            };

            const mouseLeaveHandler = () => {
                isDragging = false;
            };

            const wheelHandler = (e) => {
                if (!viewerResources || !viewerResources.cube) return;
                
                e.preventDefault();
                
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newScale = currentScale * delta;
                
                if (newScale >= minScale && newScale <= maxScale) {
                    currentScale = newScale;
                    viewerResources.cube.scale.set(currentScale, currentScale, currentScale);
                }
            };

            const resizeHandler = () => {
                if (!viewerResources || !viewerResources.camera || !viewerResources.renderer) return;
                
                viewerResources.camera.aspect = window.innerWidth / window.innerHeight;
                viewerResources.camera.updateProjectionMatrix();
                viewerResources.renderer.setSize(window.innerWidth, window.innerHeight);
            };

            // Add event listeners and track them for cleanup
            const canvas = viewerResources.renderer.domElement;
            
            canvas.addEventListener('mousedown', mouseDownHandler);
            viewerResources.eventListeners.push({ element: canvas, event: 'mousedown', handler: mouseDownHandler });
            
            canvas.addEventListener('mousemove', mouseMoveHandler);
            viewerResources.eventListeners.push({ element: canvas, event: 'mousemove', handler: mouseMoveHandler });
            
            canvas.addEventListener('mouseup', mouseUpHandler);
            viewerResources.eventListeners.push({ element: canvas, event: 'mouseup', handler: mouseUpHandler });
            
            canvas.addEventListener('mouseleave', mouseLeaveHandler);
            viewerResources.eventListeners.push({ element: canvas, event: 'mouseleave', handler: mouseLeaveHandler });
            
            canvas.addEventListener('wheel', wheelHandler);
            viewerResources.eventListeners.push({ element: canvas, event: 'wheel', handler: wheelHandler });
            
            window.addEventListener('resize', resizeHandler);
            viewerResources.eventListeners.push({ element: window, event: 'resize', handler: resizeHandler });

            // Animation loop with cleanup check
            function animate() {
                if (!viewerResources || !viewerResources.renderer || !viewerResources.scene || !viewerResources.camera) {
                    return; // Stop animation if resources are cleaned up
                }
                
                viewerResources.animationId = requestAnimationFrame(animate);
                viewerResources.renderer.render(viewerResources.scene, viewerResources.camera);
            }

            animate();
        }
        `;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
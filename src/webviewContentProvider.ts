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

        // Main initialization
        if (!isWebGLSupported()) {
            showError('WebGL is not supported in your environment. Please use a WebGL-compatible browser.');
        } else {
            try {
                initializeViewer();
            } catch (error) {
                showError('Failed to initialize 3D viewer: ' + error.message);
            }
        }

        function initializeViewer() {
            // Scene setup
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1e1e1e);

            // Camera setup
            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            camera.position.z = 5;

            // Renderer setup
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.getElementById('canvas-container').appendChild(renderer.domElement);

            // Create cube
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x0099ff,
                specular: 0x111111,
                shininess: 100
            });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            scene.add(directionalLight);

            // Interaction state
            let isDragging = false;
            let previousMousePosition = { x: 0, y: 0 };
            let currentScale = 1;
            const minScale = 0.5;
            const maxScale = 3;

            // Mouse interaction handlers
            renderer.domElement.addEventListener('mousedown', (e) => {
                isDragging = true;
                previousMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            });

            renderer.domElement.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const deltaMove = {
                    x: e.clientX - previousMousePosition.x,
                    y: e.clientY - previousMousePosition.y
                };

                cube.rotation.y += deltaMove.x * 0.01;
                cube.rotation.x += deltaMove.y * 0.01;

                previousMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            });

            renderer.domElement.addEventListener('mouseup', () => {
                isDragging = false;
            });

            renderer.domElement.addEventListener('mouseleave', () => {
                isDragging = false;
            });

            // Wheel interaction for zoom
            renderer.domElement.addEventListener('wheel', (e) => {
                e.preventDefault();
                
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newScale = currentScale * delta;
                
                if (newScale >= minScale && newScale <= maxScale) {
                    currentScale = newScale;
                    cube.scale.set(currentScale, currentScale, currentScale);
                }
            });

            // Handle window resize
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
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
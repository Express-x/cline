class Editor {
    constructor() {
        this.initializeTabs();
        this.initializeDropdowns();
    }

    initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Ignore if clicking the feature button
                if (e.target.closest('.feature-button')) return;

                // Remove active class from all tabs and editors
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.editor').forEach(editor => 
                    editor.classList.remove('active'));

                // Add active class to clicked tab and corresponding editor
                tab.classList.add('active');
                const editorType = tab.getAttribute('data-editor');
                document.getElementById(`${editorType}-editor`).classList.add('active');

                // Toggle side panel sections
                document.querySelector('.scene-panel').classList.toggle('active', 
                    editorType === 'scene');
                document.querySelector('.blueprint-panel').classList.toggle('active', 
                    editorType === 'blueprint');

                // Close all dropdowns
                this.closeAllDropdowns();
            });
        });
    }

    initializeDropdowns() {
        const featureButtons = document.querySelectorAll('.feature-button');
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-group')) {
                this.closeAllDropdowns();
            }
        });

        featureButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabGroup = button.closest('.tab-group');
                const dropdown = tabGroup.querySelector('.dropdown');
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('active');
                    }
                });

                // Toggle current dropdown
                dropdown.classList.toggle('active');
            });
        });
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
}

class BlueprintNode {
    constructor(type, title, x, y) {
        this.id = 'node_' + Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.title = title;
        this.x = x;
        this.y = y;
        this.inputs = [];
        this.outputs = [];
        this.element = this.createElement();
    }

    createElement() {
        const node = document.createElement('div');
        node.className = 'node';
        node.id = this.id;
        node.style.left = this.x + 'px';
        node.style.top = this.y + 'px';

        const header = document.createElement('div');
        header.className = 'node-header';
        header.textContent = this.title;
        node.appendChild(header);

        const pins = document.createElement('div');
        pins.className = 'node-pins';
        
        // Add input pins
        this.inputs.forEach(input => {
            const pin = document.createElement('div');
            pin.className = 'pin pin-input';
            pin.innerHTML = `
                <div class="pin-dot" data-pin-type="input" data-pin-name="${input}"></div>
                <span>${input}</span>
            `;
            pins.appendChild(pin);
        });

        // Add output pins
        this.outputs.forEach(output => {
            const pin = document.createElement('div');
            pin.className = 'pin pin-output';
            pin.innerHTML = `
                <span>${output}</span>
                <div class="pin-dot" data-pin-type="output" data-pin-name="${output}"></div>
            `;
            pins.appendChild(pin);
        });

        node.appendChild(pins);
        return node;
    }
}

class BlueprintEditor {
    constructor() {
        this.container = document.getElementById('blueprint-editor');
        this.grid = document.getElementById('blueprint-grid');
        this.nodes = new Map();
        this.connections = new Set();
        this.setupEventListeners();
        this.setupNodeCreation();
    }

    setupEventListeners() {
        let isPanning = false;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;

        this.grid.addEventListener('mousedown', (e) => {
            if (e.target === this.grid) {
                isPanning = true;
                startX = e.clientX - offsetX;
                startY = e.clientY - offsetY;
                this.grid.style.cursor = 'grabbing';
            }
        });

        this.grid.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            
            this.grid.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
        });

        this.grid.addEventListener('mouseup', () => {
            isPanning = false;
            this.grid.style.cursor = 'default';
        });

        this.grid.addEventListener('mouseleave', () => {
            isPanning = false;
            this.grid.style.cursor = 'default';
        });
    }

    setupNodeCreation() {
        const dropdownItems = document.querySelectorAll('#blueprint-dropdown .dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const rect = this.container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const type = item.textContent.trim().replace('Add ', '');
                this.createNode(type, x, y);
            });
        });
    }

    createNode(type, x, y) {
        const node = new BlueprintNode(type, type, x, y);
        
        // Add default inputs/outputs based on node type
        switch(type) {
            case 'Event':
                node.outputs = ['Trigger'];
                break;
            case 'Function':
                node.inputs = ['In'];
                node.outputs = ['Out'];
                break;
            case 'Variable':
                node.inputs = ['Set'];
                node.outputs = ['Get'];
                break;
            case 'Math Node':
                node.inputs = ['A', 'B'];
                node.outputs = ['Result'];
                break;
            case 'Flow Control':
                node.inputs = ['Condition'];
                node.outputs = ['True', 'False'];
                break;
        }

        this.nodes.set(node.id, node);
        this.grid.appendChild(node.element);
        this.setupNodeDragging(node);
    }

    setupNodeDragging(node) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        node.element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('pin-dot')) return;
            
            isDragging = true;
            startX = e.clientX - node.x;
            startY = e.clientY - node.y;
            node.element.style.zIndex = '1000';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            node.x = e.clientX - startX;
            node.y = e.clientY - startY;
            node.element.style.left = node.x + 'px';
            node.element.style.top = node.y + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            node.element.style.zIndex = '';
        });
    }
}

class SceneEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl2');
        this.setupSceneFeatures();
        
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        this.initializeGL();
        this.resizeCanvas();
        this.setupEventListeners();
    }

    setupSceneFeatures() {
        const dropdownItems = document.querySelectorAll('#scene-dropdown .dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.textContent.trim().replace('Add ', '');
                this.addSceneObject(type);
            });
        });
    }

    addSceneObject(type) {
        // Will implement 3D object creation here
        console.log('Adding scene object:', type);
    }

    initializeGL() {
        const gl = this.gl;
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        let isRotating = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isRotating = true;
            lastX = e.clientX;
            lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isRotating) return;
            
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            
            // Will implement camera rotation based on deltaX and deltaY
            console.log('Scene camera rotation:', deltaX, deltaY);
            
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isRotating = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('mouseleave', () => {
            isRotating = false;
            this.canvas.style.cursor = 'grab';
        });
    }

    render() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Will implement scene rendering logic here
    }
}

// Initialize everything when the page loads
window.addEventListener('load', () => {
    const editor = new Editor();
    const sceneEditor = new SceneEditor('canvas');
    const blueprintEditor = new BlueprintEditor();
    
    // Basic render loop
    function animate() {
        sceneEditor.render();
        requestAnimationFrame(animate);
    }
    animate();
});
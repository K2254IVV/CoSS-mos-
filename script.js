document.addEventListener('DOMContentLoaded', function() {
    // Skin data and settings
    const skinData = {
        width: 8,
        height: 16,
        pixels: Array(16 * 8).fill('#FFFFFF'),
        secondLayer: Array(16 * 8).fill('transparent'),
        currentColor: '#7b7b7b',
        currentTool: 'pencil',
        showSecondLayer: false,
        mirrorMode: false
    };

    // 3D Preview settings
    const previewSettings = {
        rotation: 0,
        zoom: 1,
        animation: 'idle',
        frame: 0
    };

    // DOM Elements
    const skinGrid = document.getElementById('skin-grid');
    const colorSelector = document.getElementById('color-selector');
    const presetColors = document.querySelectorAll('.color');
    const tools = {
        pencil: document.getElementById('pencil-tool'),
        fill: document.getElementById('fill-tool'),
        eraser: document.getElementById('eraser-tool'),
        mirror: document.getElementById('mirror-tool')
    };
    const layerControls = {
        toggle: document.getElementById('toggle-layer'),
        clear: document.getElementById('clear-layer')
    };
    const fileActions = {
        upload: document.getElementById('skin-upload'),
        download: document.getElementById('download-skin'),
        reset: document.getElementById('reset-skin')
    };
    const previewControls = {
        canvas: document.getElementById('preview-canvas'),
        rotateLeft: document.getElementById('rotate-left'),
        rotateRight: document.getElementById('rotate-right'),
        zoomIn: document.getElementById('zoom-in'),
        zoomOut: document.getElementById('zoom-out'),
        resetView: document.getElementById('reset-view'),
        animationSelect: document.getElementById('animation-select')
    };

    // Initialize the skin grid
    function initSkinGrid() {
        skinGrid.innerHTML = '';
        for (let y = 0; y < skinData.height; y++) {
            for (let x = 0; x < skinData.width; x++) {
                const index = y * skinData.width + x;
                const cell = document.createElement('div');
                cell.className = 'skin-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.dataset.index = index;
                
                // Set initial color
                updateCellColor(cell, index);
                
                // Add event listeners
                cell.addEventListener('mousedown', handleCellClick);
                cell.addEventListener('mouseenter', handleCellHover);
                
                skinGrid.appendChild(cell);
            }
        }
    }

    // Update cell color based on current layer
    function updateCellColor(cell, index) {
        if (skinData.showSecondLayer && skinData.secondLayer[index] !== 'transparent') {
            cell.style.backgroundColor = skinData.secondLayer[index];
        } else {
            cell.style.backgroundColor = skinData.pixels[index];
        }
    }

    // Handle cell click
    function handleCellClick(e) {
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        
        if (skinData.currentTool === 'pencil' || skinData.currentTool === 'eraser') {
            drawPixel(index, cell);
        } else if (skinData.currentTool === 'fill') {
            floodFill(index, getColorForTool());
        }
        
        update3DPreview();
    }

    // Handle cell hover (for drawing)
    let isDrawing = false;
    function handleCellHover(e) {
        if (e.buttons === 1) { // Only if left mouse button is pressed
            handleCellClick(e);
        }
    }

    // Draw a pixel at the specified index
    function drawPixel(index, cell) {
        const color = getColorForTool();
        
        if (skinData.showSecondLayer) {
            skinData.secondLayer[index] = color;
        } else {
            skinData.pixels[index] = color;
        }
        
        updateCellColor(cell, index);
        
        // Mirror drawing if mirror mode is on
        if (skinData.mirrorMode) {
            const x = index % skinData.width;
            const mirroredX = skinData.width - 1 - x;
            const mirroredIndex = Math.floor(index / skinData.width) * skinData.width + mirroredX;
            
            if (mirroredIndex !== index) {
                const mirroredCell = skinGrid.children[mirroredIndex];
                if (skinData.showSecondLayer) {
                    skinData.secondLayer[mirroredIndex] = color;
                } else {
                    skinData.pixels[mirroredIndex] = color;
                }
                updateCellColor(mirroredCell, mirroredIndex);
            }
        }
    }

    // Get the appropriate color based on the current tool
    function getColorForTool() {
        if (skinData.currentTool === 'eraser') {
            return skinData.showSecondLayer ? 'transparent' : '#FFFFFF';
        }
        return skinData.currentColor;
    }

    // Flood fill algorithm
    function floodFill(index, newColor) {
        const targetColor = skinData.showSecondLayer ? 
            skinData.secondLayer[index] : skinData.pixels[index];
        
        if (targetColor === newColor) return;
        
        const queue = [index];
        const width = skinData.width;
        const height = skinData.height;
        const visited = new Set();
        
        while (queue.length > 0) {
            const currentIndex = queue.shift();
            
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);
            
            const currentColor = skinData.showSecondLayer ? 
                skinData.secondLayer[currentIndex] : skinData.pixels[currentIndex];
            
            if (currentColor !== targetColor) continue;
            
            // Set the new color
            if (skinData.showSecondLayer) {
                skinData.secondLayer[currentIndex] = newColor;
            } else {
                skinData.pixels[currentIndex] = newColor;
            }
            
            // Update the cell color
            const cell = skinGrid.children[currentIndex];
            updateCellColor(cell, currentIndex);
            
            // Add neighbors to the queue
            const x = currentIndex % width;
            const y = Math.floor(currentIndex / width);
            
            if (x > 0) queue.push(currentIndex - 1);
            if (x < width - 1) queue.push(currentIndex + 1);
            if (y > 0) queue.push(currentIndex - width);
            if (y < height - 1) queue.push(currentIndex + width);
        }
    }

    // Initialize color picker
    function initColorPicker() {
        colorSelector.value = skinData.currentColor;
        colorSelector.addEventListener('input', function() {
            skinData.currentColor = this.value;
        });
        
        presetColors.forEach(color => {
            color.addEventListener('click', function() {
                skinData.currentColor = this.style.backgroundColor;
                colorSelector.value = rgbToHex(this.style.backgroundColor);
            });
        });
    }

    // Convert RGB string to hex
    function rgbToHex(rgb) {
        if (rgb === 'transparent') return '#FFFFFF';
        
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb;
        
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Initialize tools
    function initTools() {
        Object.keys(tools).forEach(tool => {
            tools[tool].addEventListener('click', function() {
                // Toggle mirror mode
                if (tool === 'mirror') {
                    skinData.mirrorMode = !skinData.mirrorMode;
                    this.classList.toggle('active', skinData.mirrorMode);
                    return;
                }
                
                // Set active tool
                skinData.currentTool = tool;
                Object.values(tools).forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Initialize layer controls
    function initLayerControls() {
        layerControls.toggle.addEventListener('click', function() {
            skinData.showSecondLayer = !skinData.showSecondLayer;
            this.textContent = skinData.showSecondLayer ? 'Show First Layer' : 'Show Second Layer';
            
            // Update all cells to show the correct layer
            Array.from(skinGrid.children).forEach((cell, index) => {
                updateCellColor(cell, index);
            });
            
            update3DPreview();
        });
        
        layerControls.clear.addEventListener('click', function() {
            if (skinData.showSecondLayer) {
                skinData.secondLayer.fill('transparent');
            } else {
                skinData.pixels.fill('#FFFFFF');
            }
            
            Array.from(skinGrid.children).forEach((cell, index) => {
                updateCellColor(cell, index);
            });
            
            update3DPreview();
        });
    }

    // Initialize file actions
    function initFileActions() {
        fileActions.upload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    processUploadedSkin(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        
        fileActions.download.addEventListener('click', function() {
            downloadSkin();
        });
        
        fileActions.reset.addEventListener('click', function() {
            resetSkin();
        });
    }

    // Process uploaded skin image
    function processUploadedSkin(img) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; // Minecraft skin width
        canvas.height = 64; // Minecraft skin height
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        
        // Extract pixel data for the front of the head (8x8 area)
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const pixelData = ctx.getImageData(x, y, 1, 1).data;
                const color = rgbaToHex(pixelData);
                const index = y * 8 + x;
                skinData.pixels[index] = color;
                
                // Update the cell
                const cell = skinGrid.children[index];
                updateCellColor(cell, index);
            }
        }
        
        update3DPreview();
    }

    // Convert RGBA array to hex color
    function rgbaToHex(rgba) {
        const r = rgba[0].toString(16).padStart(2, '0');
        const g = rgba[1].toString(16).padStart(2, '0');
        const b = rgba[2].toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
    }

    // Download the current skin as PNG
    function downloadSkin() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Create a blank white image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 64, 64);
        
        // Draw the head (8x8 area)
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const index = y * 8 + x;
                ctx.fillStyle = skinData.pixels[index];
                ctx.fillRect(x, y, 1, 1);
                
                // Draw second layer if it exists
                if (skinData.secondLayer[index] !== 'transparent') {
                    ctx.fillStyle = skinData.secondLayer[index];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Convert to data URL and trigger download
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'minecraft-skin.png';
        link.click();
    }

    // Reset the skin to default
    function resetSkin() {
        if (confirm('Are you sure you want to reset the skin?')) {
            skinData.pixels.fill('#FFFFFF');
            skinData.secondLayer.fill('transparent');
            
            Array.from(skinGrid.children).forEach((cell, index) => {
                updateCellColor(cell, index);
            });
            
            update3DPreview();
        }
    }

    // Initialize 3D preview controls
    function initPreviewControls() {
        previewControls.rotateLeft.addEventListener('click', function() {
            previewSettings.rotation -= 15;
            update3DPreview();
        });
        
        previewControls.rotateRight.addEventListener('click', function() {
            previewSettings.rotation += 15;
            update3DPreview();
        });
        
        previewControls.zoomIn.addEventListener('click', function() {
            previewSettings.zoom = Math.min(previewSettings.zoom + 0.1, 2);
            update3DPreview();
        });
        
        previewControls.zoomOut.addEventListener('click', function() {
            previewSettings.zoom = Math.max(previewSettings.zoom - 0.1, 0.5);
            update3DPreview();
        });
        
        previewControls.resetView.addEventListener('click', function() {
            previewSettings.rotation = 0;
            previewSettings.zoom = 1;
            update3DPreview();
        });
        
        previewControls.animationSelect.addEventListener('change', function() {
            previewSettings.animation = this.value;
            previewSettings.frame = 0;
            update3DPreview();
        });
    }

    // Update the 3D preview
    function update3DPreview() {
        const canvas = previewControls.canvas;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the Minecraft character
        drawMinecraftCharacter(ctx);
    }

    // Draw Minecraft character
    function drawMinecraftCharacter(ctx) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Apply zoom and rotation
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(previewSettings.zoom, previewSettings.zoom);
        ctx.rotate(previewSettings.rotation * Math.PI / 180);
        
        // Draw head
        drawHead(ctx);
        
        // Draw body parts based on animation
        if (previewSettings.animation === 'walk' || previewSettings.animation === 'run') {
            const walkCycle = previewSettings.frame % 20;
            const legAngle = Math.sin(walkCycle * Math.PI / 10) * 15;
            
            if (previewSettings.animation === 'run') {
                legAngle *= 1.5;
            }
            
            drawBody(ctx, 0, 0);
            drawArm(ctx, -20, -30, -legAngle);
            drawArm(ctx, 20, -30, legAngle);
            drawLeg(ctx, -10, 30, legAngle);
            drawLeg(ctx, 10, 30, -legAngle);
        } else if (previewSettings.animation === 'jump') {
            const jumpHeight = Math.min(previewSettings.frame, 10);
            drawBody(ctx, 0, -jumpHeight);
            drawArm(ctx, -20, -30 - jumpHeight, 45);
            drawArm(ctx, 20, -30 - jumpHeight, -45);
            drawLeg(ctx, -10, 30 - jumpHeight, 0);
            drawLeg(ctx, 10, 30 - jumpHeight, 0);
        } else if (previewSettings.animation === 'wave') {
            const waveAngle = Math.sin(previewSettings.frame * Math.PI / 10) * 45;
            drawBody(ctx, 0, 0);
            drawArm(ctx, -20, -30, waveAngle);
            drawArm(ctx, 20, -30, 0);
            drawLeg(ctx, -10, 30, 0);
            drawLeg(ctx, 10, 30, 0);
        } else { // idle
            drawBody(ctx, 0, 0);
            drawArm(ctx, -20, -30, 0);
            drawArm(ctx, 20, -30, 0);
            drawLeg(ctx, -10, 30, 0);
            drawLeg(ctx, 10, 30, 0);
        }
        
        ctx.restore();
        
        // Increment frame for animation
        previewSettings.frame++;
        requestAnimationFrame(() => update3DPreview());
    }

    // Draw the head
    function drawHead(ctx) {
        // Head is 8x8 pixels, scale up to 64x64 for preview
        const scale = 4;
        
        // Draw front of head
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const index = y * 8 + x;
                ctx.fillStyle = skinData.pixels[index];
                ctx.fillRect(x * scale - 32, y * scale - 32, scale, scale);
                
                // Draw second layer if it exists
                if (skinData.secondLayer[index] !== 'transparent') {
                    ctx.fillStyle = skinData.secondLayer[index];
                    ctx.fillRect(x * scale - 32, y * scale - 32, scale, scale);
                }
            }
        }
    }

    // Draw body parts (simplified for this example)
    function drawBody(ctx, offsetX, offsetY) {
        ctx.fillStyle = '#7b7b7b';
        ctx.fillRect(-16 + offsetX, -20 + offsetY, 32, 40);
    }

    function drawArm(ctx, offsetX, offsetY, rotation) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.fillStyle = '#7b7b7b';
        ctx.fillRect(-4, -4, 8, 24);
        ctx.restore();
    }

    function drawLeg(ctx, offsetX, offsetY, rotation) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.fillStyle = '#7b7b7b';
        ctx.fillRect(-4, 0, 8, 24);
        ctx.restore();
    }

    // Initialize everything
    function init() {
        initSkinGrid();
        initColorPicker();
        initTools();
        initLayerControls();
        initFileActions();
        initPreviewControls();
        update3DPreview();
    }

    init();
});

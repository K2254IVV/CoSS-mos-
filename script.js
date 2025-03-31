document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const canvas = document.getElementById('skinCanvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    const fillColorBtn = document.getElementById('fillColor');
    const brushSize = document.getElementById('brushSize');
    const partButtons = document.querySelectorAll('.part-btn');
    const clearPartBtn = document.getElementById('clearPart');
    const clearAllBtn = document.getElementById('clearAll');
    const downloadBtn = document.getElementById('downloadSkin');
    const loadBtn = document.getElementById('loadSkin');
    const skinUpload = document.getElementById('skinUpload');
    const previewContainer = document.getElementById('skinPreview');
    const rotateToggle = document.getElementById('rotateToggle');
    const changePoseBtn = document.getElementById('changePose');
    const animationSelect = document.getElementById('animationSelect');
    const templates = document.querySelectorAll('.template');
    
    // Переменные состояния
    let currentColor = colorPicker.value;
    let currentBrushSize = brushSize.value;
    let currentPart = 'head';
    let isDrawing = false;
    let skinViewer;
    let rotateEnabled = true;
    let currentPose = 'standing';
    
    // Инициализация холста
    function initCanvas() {
        // Создаем стандартный скин (пустой с прозрачностью)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Или загружаем стандартный скин из файла
        // const defaultSkin = new Image();
        // defaultSkin.src = 'templates/default.png';
        // defaultSkin.onload = function() {
        //     ctx.drawImage(defaultSkin, 0, 0, canvas.width, canvas.height);
        //     updatePreview();
        // };
        
        updatePreview();
    }
    
    // Инициализация 3D превью
    function initPreview() {
        skinViewer = new skinview3d.SkinViewer({
            canvas: document.getElementById('skinPreview'),
            width: previewContainer.offsetWidth,
            height: previewContainer.offsetHeight,
            skin: canvas.toDataURL()
        });
        
        // Настройка камеры и освещения
        skinViewer.camera.position.z = 50;
        skinViewer.animation = new skinview3d.WalkingAnimation();
        skinViewer.animation.speed = 1;
        
        // Автоматическое вращение
        const rotateControl = skinViewer.controls;
        rotateControl.autoRotate = rotateEnabled;
        rotateControl.autoRotateSpeed = 1;
        
        // Анимация
        skinViewer.animation.paused = true;
    }
    
    // Обновление превью
    function updatePreview() {
        if (!skinViewer) return;
        
        const skinUrl = canvas.toDataURL();
        skinViewer.loadSkin(skinUrl);
    }
    
    // Обработчики событий для рисования
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.fillStyle = currentColor;
        
        // Рисуем круг с текущим размером кисти
        ctx.beginPath();
        ctx.arc(x, y, currentBrushSize, 0, Math.PI * 2);
        ctx.fill();
        
        updatePreview();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Обработчики событий для инструментов
    colorPicker.addEventListener('input', function() {
        currentColor = this.value;
    });
    
    fillColorBtn.addEventListener('click', function() {
        // Заливаем текущую часть выбранным цветом
        // Это упрощенная версия - в реальности нужно заливать только выбранную часть скина
        ctx.fillStyle = currentColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updatePreview();
    });
    
    brushSize.addEventListener('input', function() {
        currentBrushSize = this.value;
    });
    
    partButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            partButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPart = this.dataset.part;
        });
    });
    
    clearPartBtn.addEventListener('click', function() {
        // Очищаем текущую часть скина
        // В реальности нужно очищать только выбранную часть
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updatePreview();
    });
    
    clearAllBtn.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите очистить весь скин?')) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            updatePreview();
        }
    });
    
    downloadBtn.addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'minecraft-skin.png';
        link.href = canvas.toDataURL();
        link.click();
    });
    
    loadBtn.addEventListener('click', function() {
        skinUpload.click();
    });
    
    skinUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                updatePreview();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    // Обработчики событий для превью
    rotateToggle.addEventListener('click', function() {
        rotateEnabled = !rotateEnabled;
        skinViewer.controls.autoRotate = rotateEnabled;
        this.textContent = `Вращение: ${rotateEnabled ? 'Вкл' : 'Выкл'}`;
    });
    
    changePoseBtn.addEventListener('click', function() {
        currentPose = currentPose === 'standing' ? 'sitting' : 'standing';
        
        if (currentPose === 'standing') {
            skinViewer.playerObject.position.y = 0;
        } else {
            skinViewer.playerObject.position.y = -10;
        }
    });
    
    animationSelect.addEventListener('change', function() {
        switch(this.value) {
            case 'none':
                skinViewer.animation = null;
                break;
            case 'walk':
                skinViewer.animation = new skinview3d.WalkingAnimation();
                break;
            case 'run':
                skinViewer.animation = new skinview3d.RunningAnimation();
                break;
            case 'dance':
                skinViewer.animation = new skinview3d.DancingAnimation();
                break;
        }
        
        if (skinViewer.animation) {
            skinViewer.animation.speed = 1;
        }
    });
    
    // Обработчики событий для шаблонов
    templates.forEach(template => {
        template.addEventListener('click', function() {
            const templateName = this.dataset.template;
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                updatePreview();
            };
            img.src = `templates/${templateName}.png`;
        });
    });
    
    // Инициализация
    initCanvas();
    initPreview();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', function() {
        if (skinViewer) {
            skinViewer.width = previewContainer.offsetWidth;
            skinViewer.height = previewContainer.offsetHeight;
        }
    });
});

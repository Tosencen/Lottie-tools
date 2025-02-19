class LottieController {
    constructor() {
        this.animation = null;
        this.dropZone = document.getElementById('dropZone');
        this.lottieContainer = document.getElementById('lottie-container');
        this.leftControls = document.querySelector('.left-controls');
        this.colorPicker = document.querySelector('.color-picker');
        this.sizeInfo = document.getElementById('sizeInfo');
        this.currentColor = 'transparent';
        this.buttons = {
            pause: document.getElementById('leftPauseBtn'),
            reset: document.getElementById('resetBtn'),
            delete: document.getElementById('deleteBtn'),
            fileSelect: document.getElementById('fileSelectBtn'),
            theme: document.getElementById('themeBtn')
        };
        this.isProcessingFile = false;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.initializeEventListeners();
        this.applyTheme();

        // 监听来自主进程的主题变更事件
        if (window.electron) {
            window.electron.onThemeChange((event, theme) => {
                this.isDarkMode = theme === 'dark';
                localStorage.setItem('darkMode', this.isDarkMode);
                this.applyTheme();
            });
        }
    }

    initializeEventListeners() {
        // 拖拽事件监听
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));

        // 添加背景色选择器事件监听
        const colorButtons = document.querySelectorAll('.color-btn');
        colorButtons.forEach(button => {
            button.addEventListener('click', () => {
                const color = button.getAttribute('data-color');
                if (color === 'custom') return; // 如果是自定义颜色按钮，不执行点击事件
                this.setBackgroundColor(color);
                // 移除其他按钮的active类
                colorButtons.forEach(btn => btn.classList.remove('active'));
                // 为当前按钮添加active类
                button.classList.add('active');
            });
        });

        // 添加自定义颜色输入事件监听
        const customColorInput = document.getElementById('customColorInput');
        if (customColorInput) {
            customColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                this.setBackgroundColor(color);
                // 更新自定义颜色按钮的显示
                const customButton = document.querySelector('.color-btn.custom');
                customButton.style.setProperty('--custom-color', color);
                // 移除其他按钮的active类
                colorButtons.forEach(btn => btn.classList.remove('active'));
                // 为自定义颜色按钮添加active类
                customButton.classList.add('active');
            });
        }

        if (this.buttons.fileSelect) {
            this.buttons.fileSelect.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isProcessingFile) return;

                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.lottie';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        await this.processFile(file);
                    }
                };
                input.click();
            });
        }

        if (this.buttons.pause) {
            this.buttons.pause.addEventListener('click', () => {
                if (this.animation?.isPaused) {
                    this.play();
                    this.buttons.pause.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
                } else {
                    this.pause();
                    this.buttons.pause.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
                }
                this.toggleButtonActive(this.buttons.pause);
            });
        }

        if (this.buttons.reset) {
            this.buttons.reset.addEventListener('click', () => {
                this.animation && this.stop();
                this.toggleButtonActive(this.buttons.reset);
            });
        }

        if (this.buttons.delete) {
            this.buttons.delete.addEventListener('click', () => {
                this.reset();
                this.toggleButtonActive(this.buttons.delete);
            });
        }

        if (this.buttons.theme) {
            this.buttons.theme.addEventListener('click', () => {
                this.toggleTheme();
                this.toggleButtonActive(this.buttons.theme);
            });
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            if (this.buttons.theme) {
                this.buttons.theme.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>';
                this.buttons.theme.setAttribute('data-tooltip', '切换到浅色模式');
            }
        } else {
            document.body.classList.remove('dark-mode');
            if (this.buttons.theme) {
                this.buttons.theme.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>';
                this.buttons.theme.setAttribute('data-tooltip', '切换到深色模式');
            }
        }
    }

    toggleButtonActive(button) {
        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 200);
    }

    setBackgroundColor(color) {
        this.currentColor = color;
        this.lottieContainer.style.backgroundColor = color;
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave() {
        this.dropZone.classList.remove('drag-over');
    }

    async processFile(file) {
        if (this.isProcessingFile) return;
        this.isProcessingFile = true;

        try {
            if (!this.isValidFile(file)) {
                this.showError('请选择有效的 JSON 或 Lottie 文件');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                this.showError('文件大小不能超过10MB');
                return;
            }

            const fileContent = await this.readFile(file);
            let jsonData;

            try {
                if (file.name.endsWith('.lottie')) {
                    jsonData = JSON.parse(atob(fileContent));
                } else {
                    jsonData = JSON.parse(fileContent);
                }

                if (!this.isValidLottieData(jsonData)) {
                    this.showError('无效的 Lottie 动画文件格式');
                    return;
                }

                this.loadAnimation(jsonData);
            } catch (error) {
                this.showError('文件解析失败，请确保文件格式正确');
                console.error('Error parsing file:', error);
            }
        } finally {
            this.isProcessingFile = false;
        }
    }

    async handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');
        
        const file = e.dataTransfer?.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    isValidFile(file) {
        return file && (
            file.type === 'application/json' || 
            file.name.toLowerCase().endsWith('.json') || 
            file.name.toLowerCase().endsWith('.lottie') ||
            file.name.toLowerCase().endsWith('.json.lottie')
        );
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    isValidLottieData(data) {
        // 检查必要的Lottie动画属性
        return data && 
               typeof data === 'object' && 
               Array.isArray(data.layers) && 
               typeof data.v === 'string' && 
               typeof data.fr === 'number' && 
               typeof data.ip === 'number' && 
               typeof data.op === 'number' && 
               (data.assets === undefined || Array.isArray(data.assets));
    }

    loadAnimation(animationData) {
        if (this.animation) {
            this.animation.destroy();
        }

        this.updateUIState('preview');
        this.setBackgroundColor(this.currentColor);

        this.animation = lottie.loadAnimation({
            container: this.lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
        });

        this.animation.addEventListener('DOMLoaded', () => {
            const { w, h } = this.animation.animationData;
            this.sizeInfo.textContent = `${w} x ${h}`;
            this.sizeInfo.style.display = 'block';
        });
    }

    updateUIState(state) {
        const elements = {
            dropZone: this.dropZone,
            lottieContainer: this.lottieContainer,
            colorPicker: document.querySelector('.color-picker'),
            leftControls: document.querySelector('.left-controls')
        };

        // 确保所有元素都存在
        if (!elements.dropZone || !elements.lottieContainer || !elements.colorPicker || !elements.leftControls) {
            console.error('找不到必要的UI元素');
            return;
        }

        if (state === 'preview') {
            // 预览模式：显示动画容器和控制按钮
            // 设置动画容器为最底层
            elements.lottieContainer.style.display = 'block';
            elements.lottieContainer.style.opacity = '1';
            elements.lottieContainer.style.pointerEvents = 'none';
            elements.lottieContainer.style.zIndex = '1';

            // 设置拖拽区域在中间层，保持事件响应开启
            elements.dropZone.style.display = 'flex';
            elements.dropZone.style.position = 'absolute';
            elements.dropZone.style.top = '50%';
            elements.dropZone.style.left = '50%';
            elements.dropZone.style.width = '100%';
            elements.dropZone.style.height = '100%';
            elements.dropZone.style.transform = 'translate(-50%, -50%)';
            elements.dropZone.style.opacity = '0.01';
            elements.dropZone.style.pointerEvents = 'auto';
            elements.dropZone.style.zIndex = '2';

            // 设置控制按钮和颜色选择器在最上层
            elements.colorPicker.style.display = 'flex';
            elements.colorPicker.style.opacity = '1';
            elements.colorPicker.style.pointerEvents = 'auto';
            elements.colorPicker.style.zIndex = '3';

            elements.leftControls.style.display = 'flex';
            elements.leftControls.style.opacity = '1';
            elements.leftControls.style.pointerEvents = 'auto';
            elements.leftControls.style.zIndex = '3';
        } else {
            // 初始模式：隐藏控制元素，只显示拖放区域
            elements.lottieContainer.style.display = 'none';
            elements.colorPicker.style.display = 'none';
            elements.leftControls.style.display = 'none';

            elements.dropZone.style.display = 'flex';
            elements.dropZone.style.position = 'relative';
            elements.dropZone.style.opacity = '1';
            elements.dropZone.style.pointerEvents = 'auto';
            elements.dropZone.style.transform = 'none';
            elements.dropZone.style.width = 'auto';
            elements.dropZone.style.height = 'auto';
            elements.dropZone.style.top = 'auto';
            elements.dropZone.style.left = 'auto';
            elements.dropZone.style.zIndex = 'auto';
        }
    }

    play() {
        if (this.animation) {
            this.animation.play();
        }
    }

    pause() {
        if (this.animation) {
            this.animation.pause();
        }
    }

    stop() {
        if (this.animation) {
            this.animation.stop();
            this.animation.goToAndStop(0, true);
        }
    }

    reset() {
        if (this.animation) {
            this.animation.destroy();
            this.animation = null;
        }
        this.updateUIState('default');
        this.setBackgroundColor('transparent');
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.color-btn.transparent').classList.add('active');
        if (this.buttons.pause) {
            this.buttons.pause.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        }
        if (this.sizeInfo) {
            this.sizeInfo.style.display = 'none';
            this.sizeInfo.textContent = '';
        }
    }

    showError(message) {
        alert(message);
    }
}

const controller = new LottieController();
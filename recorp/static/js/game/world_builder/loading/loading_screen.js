class LoadingScreen {
    constructor({ minDisplayDuration = 2000 } = {}) {
        this.container = document.getElementById('sector-loader-canvas-container');
        this.canvas = document.getElementById('sector-loader-canvas');
        this.ctx = this.canvas?.getContext('2d');
        this.textElement = document.getElementById('sector-loader-text');

        this.isVisible = false;
        this.animationId = null;
        this.minDisplayDuration = minDisplayDuration;
        this.startTime = 0;

        this.fadeDelay = 500;
        this.hideTransitionDuration = 800;

        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.maxDist = 0;

        this.rayCount = 220;
        this.rays = [];
        this.zoomFactor = 0;
        this.zoomSpeed = 0;

        this._setupEventListeners();
        this._resizeCanvas();
        this._initRays();
        this._draw();
    }

    _setupEventListeners() {
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    _resizeCanvas() {
        if (!this.container || !this.canvas) return;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.maxDist = Math.sqrt(this.centerX ** 2 + this.centerY ** 2);
    }

    _initRays() {
        this.rays.length = 0;
        for (let i = 0; i < this.rayCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = this.maxDist * (0.2 + Math.random() * 0.8);
        const speed = 0.5 + Math.random() * 3.0;
        const widthRay = 0.7 + Math.random() * 1.3;
        const opacity = 0.3 + Math.random() * 0.7;
        this.rays.push({ angle, distance, speed, width: widthRay, opacity });
        }
    }

    _draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const brightness = 1 - this.zoomFactor * 0.6;

        const bgGrad = this.ctx.createRadialGradient(
        this.centerX, this.centerY, 0,
        this.centerX, this.centerY, Math.max(this.width, this.height) / 2
        );
        const baseR = Math.floor(5 * brightness);
        const baseG = Math.floor(10 * brightness);
        const baseB = Math.floor(35 + 40 * brightness);
        bgGrad.addColorStop(0, `rgb(${baseR},${baseG},${baseB})`);
        bgGrad.addColorStop(0.6, `rgb(0,${Math.floor(10 * brightness)},${Math.floor(40 + 40 * brightness)})`);
        bgGrad.addColorStop(1, 'rgb(0,0,0)');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);

        const t = Date.now() * 0.0015;
        const targetZoom = (Math.sin(t) * 0.5 + 0.5) * 0.3;
        this.zoomFactor += (targetZoom - this.zoomFactor) * 0.05;
        this.zoomSpeed = Math.abs(Math.cos(t) * 0.5 * 0.3);
        this.ctx.scale(1 + this.zoomFactor * 0.1, 1 + this.zoomFactor * 0.1);

        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 700);
        const reactivePulse = pulse + this.zoomSpeed * 1.8;
        const haloRadius = 80 + 40 * reactivePulse;
        const haloGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
        const haloAlpha = 0.25 + 0.25 * reactivePulse;
        haloGrad.addColorStop(0, `rgba(180,230,255,${haloAlpha})`);
        haloGrad.addColorStop(0.4, `rgba(140,200,255,${haloAlpha * 0.6})`);
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.beginPath();
        this.ctx.fillStyle = haloGrad;
        this.ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.rays.forEach(r => {
        const distortion = 2 * Math.sin(Date.now() / 700 + r.distance / 100);
        const x = Math.cos(r.angle) * (r.distance + distortion);
        const y = Math.sin(r.angle) * (r.distance + distortion);

        const distFactor = Math.min(r.distance / this.maxDist, 1);
        const rCol = Math.floor(150 + (200 - 150) * (1 - distFactor));
        const gCol = Math.floor(200 + (255 - 200) * (1 - distFactor));
        const bCol = Math.floor(255 - 20 * distFactor);
        this.ctx.strokeStyle = `rgba(${rCol},${gCol},${bCol},${r.opacity})`;
        this.ctx.lineWidth = r.width;

        this.ctx.beginPath();
        this.ctx.moveTo(x * 0.85, y * 0.85);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        r.distance += r.speed * (0.5 + 0.5 * (1 - distFactor));
        if (r.distance > this.maxDist) {
            r.distance = 0;
            r.angle = Math.random() * 2 * Math.PI;
            r.speed = 0.5 + Math.random() * 3.0;
            r.width = 0.7 + Math.random() * 1.3;
            r.opacity = 0.3 + Math.random() * 0.7;
        }
        });

        this.ctx.restore();
        this.animationId = requestAnimationFrame(() => this._draw());
    }

    show(text = 'Chargement') {
        if (this.isVisible) return;
        this.startTime = performance.now();
        this.isVisible = true;

        this.container.style.display = 'block';
        requestAnimationFrame(() => (this.container.style.opacity = 1));
        this.setText(text);
    }

    hide() {
        if (!this.isVisible) return;

        const elapsed = performance.now() - this.startTime;
        const remaining = Math.max(0, this.minDisplayDuration - elapsed);

        setTimeout(() => this._hide(), remaining);
    }

    _hide() {
        this.container.style.opacity = 0;
        setTimeout(() => {
        this.container.style.display = 'none';
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.isVisible = false;
        }, this.hideTransitionDuration);
    }

    setText(text) {
        if (this.textElement) this.textElement.textContent = text;
    }
}

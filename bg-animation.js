class FlickeringGrid {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.squareSize = 40;
        this.gridGap = 5;
        this.flickerChance = 0;
        this.color = 'rgb(30, 30, 30)';
        this.flickerColor = 'rgb(100, 100, 100)';

        this.cols = 0;
        this.rows = 0;
        this.squares = [];
        this.lastTime = 0;
        this.flickerInterval = 50;
        this.flickerTimer = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate(0);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.cols = Math.ceil(this.canvas.width / (this.squareSize + this.gridGap));
        this.rows = Math.ceil(this.canvas.height / (this.squareSize + this.gridGap));

        this.squares = new Array(this.cols * this.rows).fill(0).map(() => ({
            opacity: 1,
            flickering: false,
            flickerDuration: 0,
            currentFlickerTime: 0
        }));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const index = i * this.rows + j;
                const square = this.squares[index];
                const x = i * (this.squareSize + this.gridGap);
                const y = j * (this.squareSize + this.gridGap);

                if (square.flickering) {
                    this.ctx.fillStyle = this.flickerColor;
                    this.ctx.globalAlpha = Math.random() * 0.5 + 0.5;
                } else {
                    this.ctx.fillStyle = this.color;
                    this.ctx.globalAlpha = 1;
                }

                this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
            }
        }
        this.ctx.globalAlpha = 1;
    }

    update(deltaTime) {
        this.flickerTimer += deltaTime;

        if (this.flickerTimer > this.flickerInterval) {
            for (let i = 0; i < this.squares.length; i++) {
                const square = this.squares[i];

                if (square.flickering) {
                    square.currentFlickerTime += this.flickerInterval;
                    if (square.currentFlickerTime > square.flickerDuration) {
                        square.flickering = false;
                    }
                } else if (Math.random() < this.flickerChance * 0.1) {
                    square.flickering = true;
                    square.flickerDuration = Math.random() * 500 + 200;
                    square.currentFlickerTime = 0;
                }
            }
            this.flickerTimer = 0;
        }
    }

    animate(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.animate(t));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('flickering-grid-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'flickering-grid-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        document.body.prepend(canvas);
    }
    new FlickeringGrid(canvas);
});

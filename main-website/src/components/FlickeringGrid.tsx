"use client";

import React, { useEffect, useRef } from 'react';

interface Square {
  flickering: boolean;
  flickerDuration: number;
  currentFlickerTime: number;
}

export const FlickeringGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const squareSize = 35;
    const gridGap = 1;
    const flickerChance = 0.0005;
    const gridColor = 'rgba(20, 20, 20, 0.5)';
    const flickerColor = 'rgba(99, 102, 241, 0.15)'; // Subtle indigo flicker

    let cols = 0;
    let rows = 0;
    let squares: Square[] = [];
    let lastTime = 0;
    let flickerTimer = 0;
    const flickerInterval = 100;

    const init = () => {
      resize();
      window.addEventListener('resize', resize);
      requestAnimationFrame(animate);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      cols = Math.ceil(canvas.width / (squareSize + gridGap));
      rows = Math.ceil(canvas.height / (squareSize + gridGap));

      squares = new Array(cols * rows).fill(0).map(() => ({
        flickering: false,
        flickerDuration: 0,
        currentFlickerTime: 0
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const index = i * rows + j;
          const square = squares[index];
          const x = i * (squareSize + gridGap);
          const y = j * (squareSize + gridGap);

          if (square?.flickering) {
            ctx.fillStyle = flickerColor;
            ctx.globalAlpha = Math.random() * 0.5 + 0.2;
          } else {
            ctx.fillStyle = gridColor;
            ctx.globalAlpha = 1;
          }

          // Optimized drawing
          ctx.beginPath();
          ctx.rect(x, y, squareSize, squareSize);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const update = (deltaTime: number) => {
      flickerTimer += deltaTime;

      if (flickerTimer > flickerInterval) {
        for (let i = 0; i < squares.length; i++) {
          const square = squares[i];

          if (square.flickering) {
            square.currentFlickerTime += flickerInterval;
            if (square.currentFlickerTime > square.flickerDuration) {
              square.flickering = false;
            }
          } else if (Math.random() < flickerChance) {
            square.flickering = true;
            square.flickerDuration = Math.random() * 800 + 400;
            square.currentFlickerTime = 0;
          }
        }
        flickerTimer = 0;
      }
    };

    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      update(deltaTime);
      draw();

      requestAnimationFrame(animate);
    };

    init();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-20 pointer-events-none opacity-40 bg-black"
    />
  );
};

import React, { useEffect, useRef } from "react";

interface ParticleBackgroundProps {
  accentColor: string;
}

export default function ParticleBackground({ accentColor }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle[] = [];
    const particleCount = Math.min(60, Math.floor((width * height) / 25000));
    const connectionDistance = 120;
    const mouse = { x: -1000, y: -1000, radius: 180 };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Muted speed for cinema effect
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce on boundaries
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        // Interactive mouse push
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 0.6;
          this.y -= Math.sin(angle) * force * 0.6;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        c.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle accent ambient orbs
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(
        width * 0.25,
        height * 0.3,
        10,
        width * 0.25,
        height * 0.3,
        Math.max(width * 0.4, 400)
      );
      gradient.addColorStop(0, `${accentColor}10`);
      gradient.addColorStop(1, "rgba(3, 3, 3, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.beginPath();
      const gradient2 = ctx.createRadialGradient(
        width * 0.75,
        height * 0.7,
        10,
        width * 0.75,
        height * 0.7,
        Math.max(width * 0.4, 400)
      );
      gradient2.addColorStop(0, `${accentColor}08`);
      gradient2.addColorStop(1, "rgba(3, 3, 3, 0)");
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      // Mouse interactive glow
      if (mouse.x > -1000) {
        ctx.beginPath();
        const mouseGradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        mouseGradient.addColorStop(0, `${accentColor}15`);
        mouseGradient.addColorStop(1, "rgba(3, 3, 3, 0)");
        ctx.fillStyle = mouseGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw lines between particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw(ctx);

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none bg-[#030303]"
    />
  );
}

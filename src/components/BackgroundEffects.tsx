import React, { useEffect, useRef } from 'react';

export const BackgroundEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle pool
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
      isGold: Math.random() > 0.4,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.isGold) {
          ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha})`;
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 8;
        }
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070b19]">
      {/* Deep Royal Blue Radial Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-900/25 rounded-full blur-[140px]" />
      <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[150px]" />
      <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-indigo-950/40 rounded-full blur-[160px]" />

      {/* SVG Circuit Pattern Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-screen">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
              <path
                d="M 10,10 L 90,10 L 90,90 L 10,90 Z M 30,10 L 30,40 L 50,40 M 70,90 L 70,60 L 50,60 M 10,50 L 40,50 M 90,50 L 60,50"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1"
              />
              <circle cx="30" cy="40" r="3" fill="#fbbf24" />
              <circle cx="70" cy="60" r="3" fill="#fbbf24" />
              <circle cx="50" cy="40" r="2" fill="#60a5fa" />
              <circle cx="50" cy="60" r="2" fill="#60a5fa" />
              <circle cx="40" cy="50" r="2" fill="#fbbf24" />
              <circle cx="60" cy="50" r="2" fill="#fbbf24" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      {/* Subtle Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Canvas Particle Effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

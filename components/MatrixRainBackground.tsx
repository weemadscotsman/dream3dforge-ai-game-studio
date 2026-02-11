import React, { useEffect, useRef } from 'react';

interface MatrixRainBackgroundProps {
  active: boolean;
  statusMessage?: string;
}

interface ColumnStream {
  text: string;
  color: string;
  isActive: boolean;
}

const MatrixRainBackground: React.FC<MatrixRainBackgroundProps> = ({ 
  active, 
  statusMessage 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    active,
    drops: new Float32Array(0),
    columns: 0,
    columnStreams: [] as (ColumnStream | null)[],
    lastStatus: ''
  });

  useEffect(() => {
    stateRef.current.active = active;
    // When status message changes, add it to a random column
    if (statusMessage && statusMessage !== stateRef.current.lastStatus) {
      stateRef.current.lastStatus = statusMessage;
      const cleanText = statusMessage.toUpperCase().replace(/\s+/g, '_');
      
      // Find a random inactive column to inject the message
      const inactiveCols = stateRef.current.columnStreams
        .map((s, i) => s === null ? i : -1)
        .filter(i => i !== -1);
      
      if (inactiveCols.length > 0) {
        const randomCol = inactiveCols[Math.floor(Math.random() * inactiveCols.length)];
        stateRef.current.columnStreams[randomCol] = {
          text: cleanText,
          color: '#00ff88', // Bright green for status
          isActive: true
        };
      }
    }
  }, [active, statusMessage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Character set - mix of katakana, numbers, and symbols
    const chars = "01ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓABCDEFGHIJKLMNOPQRSTUVWXYZ<>[]{}|_=*+-".split("");
    
    const fontSize = 14;
    
    const setup = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      const columns = Math.floor(width / fontSize);
      stateRef.current.columns = columns;
      stateRef.current.drops = new Float32Array(columns);
      stateRef.current.columnStreams = new Array(columns).fill(null);
      
      // Initialize drops randomly above screen
      for (let i = 0; i < columns; i++) {
        stateRef.current.drops[i] = Math.random() * -100;
      }
    };

    setup();
    window.addEventListener('resize', setup);

    let frameId: number;
    let lastTime = 0;

    const draw = (time: number) => {
      const { active, drops, columns, columnStreams } = stateRef.current;
      
      // Throttle frame rate when not active
      const frameThreshold = active ? 16 : 50; // 60fps when active, 20fps when idle
      if (time - lastTime < frameThreshold) {
        frameId = requestAnimationFrame(draw);
        return;
      }
      lastTime = time;

      // Fade effect - darker when active for better contrast with UI
      ctx.fillStyle = active 
        ? "rgba(0, 5, 10, 0.15)" // Darker fade when active
        : "rgba(0, 5, 10, 0.05)"; // Very subtle when idle
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "Fira Code", "Courier New", monospace`;

      for (let i = 0; i < columns; i++) {
        let char = '';
        let color = active ? "#00d4ff" : "#003344"; // Cyan when active, dark when idle
        let isStreamChar = false;

        // Check if this column has a message stream
        if (columnStreams[i]) {
          const stream = columnStreams[i]!;
          const dropY = Math.floor(drops[i]);
          
          if (dropY >= 0 && dropY < stream.text.length) {
            char = stream.text[dropY];
            color = stream.color;
            isStreamChar = true;
            
            // Glow effect for message characters
            if (active) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = color;
            }
          } else if (dropY >= stream.text.length + 3) {
            // Message done - clear it
            columnStreams[i] = null;
          }
        }

        if (!isStreamChar) {
          char = chars[Math.floor(Math.random() * chars.length)];
          ctx.shadowBlur = 0;
          
          // Randomly vary the color slightly for visual interest
          if (active && Math.random() > 0.9) {
            color = "#00ffaa"; // Occasionally brighter green
          }
        }

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = color;
        ctx.fillText(char, x, y);

        // Reset drop when off screen
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
          
          // Small chance to inject status message into this column
          if (statusMessage && Math.random() > 0.95 && !columnStreams[i]) {
            const cleanText = statusMessage.toUpperCase().replace(/\s+/g, '_');
            columnStreams[i] = {
              text: cleanText,
              color: '#00ff88',
              isActive: true
            };
          }
        }

        // Increment drop - messages fall slower for readability - SLOWED DOWN 25%
        const speed = columnStreams[i] ? 0.38 : (active ? 0.6 : 0.22);
        drops[i] += speed;
      }
      
      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', setup);
      cancelAnimationFrame(frameId);
    };
  }, [statusMessage]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 0,
        opacity: active ? 0.8 : 0.3,
        transition: 'opacity 1s ease',
        mixBlendMode: 'screen'
      }}
    />
  );
};

export default MatrixRainBackground;

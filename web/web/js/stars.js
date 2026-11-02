/**
 * Talk.me Starfield Canvas Module (Warp Drive Effect)
 */

let starWarp = 0;

function initStarfield() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  const NUM_STARS = 850;
  const stars = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: (Math.random() - 0.5) * width * 3.5,
      y: (Math.random() - 0.5) * height * 3.5,
      z: Math.random() * width,
      pz: Math.random() * width,
      size: Math.random() * 1.6 + 0.4
    });
  }

  function renderStars() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const speed = 1.2 + starWarp;
    starWarp *= 0.88;

    for (let i = 0; i < NUM_STARS; i++) {
      const star = stars[i];
      star.pz = star.z;
      star.z -= speed;

      if (star.z <= 0) {
        star.z = width;
        star.pz = width;
        star.x = (Math.random() - 0.5) * width * 3.5;
        star.y = (Math.random() - 0.5) * height * 3.5;
      }

      const k = 280 / star.z;
      const px = star.x * k + cx;
      const py = star.y * k + cy;

      const pk = 280 / star.pz;
      const ppx = star.x * pk + cx;
      const ppy = star.y * pk + cy;

      if (px >= -100 && px <= width + 100 && py >= -100 && py <= height + 100) {
        const depthRatio = (1 - star.z / width);
        const alpha = Math.min(1, depthRatio * 1.5);

        ctx.beginPath();
        if (starWarp > 1.5) {
          ctx.moveTo(ppx, ppy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.lineWidth = Math.max(0.6, star.size * depthRatio * 1.8);
          ctx.stroke();
        } else {
          const finalSize = Math.max(0.6, star.size * depthRatio * 2.0);
          ctx.arc(px, py, finalSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(renderStars);
  }

  requestAnimationFrame(renderStars);
}

function setStarWarp(warpValue) {
  starWarp = warpValue;
}

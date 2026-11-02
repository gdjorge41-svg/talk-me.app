/**
 * Talk.me 3D Hero Intro Scroll & Parallax Controller
 */

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function smoothstep(min, max, value) {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

function initIntro3D() {
  const introWrapper = document.getElementById('introWrapper');
  const words = document.querySelectorAll('.word-3d');
  const heroLogoWrap = document.getElementById('heroLogoWrap');
  const heroPrompt = document.getElementById('heroPrompt');
  const introWatermark = document.getElementById('introWatermark');
  const stage3D = document.getElementById('stage3D');
  const stageWorld = document.getElementById('stageWorld');
  const starsCanvas = document.getElementById('stars-canvas');

  if (!introWrapper || !stageWorld) return;

  let targetTiltX = 0, targetTiltY = 0;
  let currentTiltX = 0, currentTiltY = 0;

  window.addEventListener('mousemove', (e) => {
    const mx = (e.clientX / window.innerWidth - 0.5) * 2;
    const my = (e.clientY / window.innerHeight - 0.5) * 2;
    targetTiltX = -my * 3.5;
    targetTiltY = mx * 3.5;
  });

  let lastScrollY = window.scrollY;
  let currentProgress = 0;

  function renderEngine() {
    const wrapperRect = introWrapper.getBoundingClientRect();
    const maxScrollIntro = introWrapper.offsetHeight - window.innerHeight;
    const currentScrollIntro = Math.min(Math.max(-wrapperRect.top, 0), maxScrollIntro);
    const targetProgress = currentScrollIntro / (maxScrollIntro || 1);

    currentProgress += (targetProgress - currentProgress) * 0.14;
    const progress = currentProgress;

    const deltaScroll = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;

    if (typeof setStarWarp === 'function') {
      setStarWarp(Math.min(deltaScroll * 0.28, 40));
    }

    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;
    stageWorld.style.transform = `rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg)`;

    if (introWatermark) {
      introWatermark.style.opacity = progress > 0.015 ? '0' : '1';
    }

    /* LOGO HERO & PROMPT */
    if (progress <= 0.12) {
      if (heroLogoWrap) heroLogoWrap.style.visibility = 'visible';

      if (heroPrompt) {
        const promptFade = Math.max(0, 1 - (progress / 0.025));
        heroPrompt.style.opacity = promptFade.toFixed(3);
        heroPrompt.style.transform = `translateX(-50%) translateY(${(progress * 80).toFixed(1)}px)`;
      }

      if (heroLogoWrap) {
        if (progress < 0.01) {
          heroLogoWrap.style.transform = `translate(-50%, -50%) translate3d(0, 0, 0px)`;
          heroLogoWrap.style.opacity = '1';
          heroLogoWrap.style.filter = 'none';
        } else {
          const pLogo = (progress - 0.01) / 0.11;
          const z = pLogo * 680;
          const op = Math.max(0, 1 - Math.pow(pLogo, 1.8));
          const blur = Math.pow(pLogo, 2) * 16;

          heroLogoWrap.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${z.toFixed(1)}px)`;
          heroLogoWrap.style.opacity = op.toFixed(3);
          heroLogoWrap.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
        }
      }
    } else {
      if (heroLogoWrap) heroLogoWrap.style.visibility = 'hidden';
    }

    /* 7 PALABRAS 3D */
    words.forEach(word => {
      const center = parseFloat(word.dataset.center);
      const span = parseFloat(word.dataset.span);
      const dist = progress - center;

      if (Math.abs(dist) <= span) {
        word.style.visibility = 'visible';

        let translateZ = 0;
        let opacity = 0;
        let blur = 0;
        let letterSpacing = 2;

        if (dist < 0) {
          const t = 1 + (dist / span);
          const easedT = smoothstep(0, 1, t);
          translateZ = -1800 * (1 - easedT);
          opacity = Math.pow(easedT, 1.3);
          blur = (1 - easedT) * 3;
          letterSpacing = 2 + (1 - easedT) * 10;
        } else {
          const t = dist / span;
          translateZ = t * 900;
          opacity = Math.max(0, 1 - Math.pow(t, 2));
          blur = Math.pow(t, 2) * 18;
          letterSpacing = 2 + t * 6;
        }

        word.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${translateZ.toFixed(1)}px)`;
        word.style.opacity = opacity.toFixed(3);
        word.style.letterSpacing = `${letterSpacing.toFixed(1)}px`;
        word.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
      } else {
        word.style.visibility = 'hidden';
        word.style.opacity = '0';
      }
    });

    // Desvanecer escenario e intro al completar el zoom
    if (progress >= 0.88) {
      const fade = (progress - 0.88) / 0.12;
      if (starsCanvas) starsCanvas.style.opacity = (1 - fade).toFixed(2);
      if (stage3D) stage3D.style.opacity = (1 - fade).toFixed(2);
    } else {
      if (starsCanvas) starsCanvas.style.opacity = '1';
      if (stage3D) stage3D.style.opacity = '1';
    }

    requestAnimationFrame(renderEngine);
  }

  requestAnimationFrame(renderEngine);
}

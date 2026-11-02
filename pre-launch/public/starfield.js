// --- STARFIELD INTERACTIVE CANVAS ENGINE ---
let starVelocityFactor = 1.0; // Global: increases during server boot

function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;

    // Desactivamos el canal alfa para ganar rendimiento (el fondo siempre será negro opaco)
    const ctx = canvas.getContext('2d', { alpha: false });

    // Dimensiones lógicas del canvas alineadas con la ventana del navegador
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    // Coordenadas para el efecto de cámara interactiva (seguimiento del ratón con inercia)
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    // Controladores de velocidad
    let targetVelocity = 1.0;       // Velocidad a la que queremos llegar
    let smoothVelocity = targetVelocity; // Velocidad real actual (se acerca a target de forma fluida)

    // Control de tiempos y estados para el Clímax (el estallido final de estiramiento)
    let isWarpActive = false;       // Interruptor principal del clímax
    let warpTransition = 0.0;         // Factor de interpolación (0.0 a 1.0) para suavizar el clímax en 0.5s

    // Configuración del universo de estrellas
    const numStars = 240;           // Cantidad óptima de estrellas para no colapsar la CPU y mantener estética limpia
    const stars = [];

    // Generación inicial de la base de datos de estrellas
    for (let i = 0; i < numStars; i++) {
        const angle = Math.random() * Math.PI * 2; // Distribución angular uniforme (360º)
        // Usamos Math.pow para concentrar matemáticamente más estrellas cerca del centro óptico
        const distance = Math.pow(Math.random(), 1.3) * (w * 0.5);
        stars.push({
            x: Math.cos(angle) * distance, // Coordenada X relativa al centro
            y: Math.sin(angle) * distance, // Coordenada Y relativa al centro
            z: Math.random() * w,          // Profundidad tridimensional (Z) inicial
            modifier: 0.6 + Math.random() * 0.8 // Velocidad individual para romper la uniformidad plana
        });
    }
 
    // Check if we are transitioning from warp speed (landing)
    const urlParams = new URLSearchParams(window.location.search);
    const urlTransitioning = urlParams.get('transitioning') === 'true';
    if (urlTransitioning) {
        localStorage.setItem('talkme_transitioning', 'true');
    }
    const isTransitioning = localStorage.getItem('talkme_transitioning') === 'true' || urlTransitioning;
    if (isTransitioning) {
        starVelocityFactor = 1.0;
        targetVelocity = 1.0;
        smoothVelocity = 148.0;
        warpTransition = 1.0; // Start with full warp transition active so it fades out smoothly

        // Clean up transitioning flag after deceleration has completed (around 3 seconds)
        setTimeout(() => {
            localStorage.removeItem('talkme_transitioning');
            // Clean up transitioning URL param quietly
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + (window.location.search.replace(/[&?]transitioning=true/, ''));
            window.history.replaceState({path: cleanUrl}, '', cleanUrl);
        }, 3000);
    }

    // Reajusta las dimensiones lógicas si el usuario cambia el tamaño del navegador
    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    });

    // Captura del ratón para desplazar suavemente el punto de fuga (efecto parallax de cámara)
    window.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX - w / 2) * 0.02;
        targetMouseY = (e.clientY - h / 2) * 0.02;
    });

    function draw() {
        if (window.stopStarfieldAnimation) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);
            canvas.style.display = 'none';
            return;
        }
        // Sincronizar targetVelocity con el control global starVelocityFactor
        targetVelocity = starVelocityFactor;

        // El clímax se activa automáticamente cuando se alcanza una velocidad alta de warp
        isWarpActive = targetVelocity > 40.0;

        // Asegura el modo de dibujo estándar (sobreescribir píxeles)
        ctx.globalCompositeOperation = 'source-over';

        // EFECTO ESTELA GENERAL (Fondo acumulativo)
        const backgroundAlpha = Math.max(0.10, 0.25 - (smoothVelocity * 0.003));
        ctx.fillStyle = `rgba(0, 0, 0, ${backgroundAlpha})`;
        ctx.fillRect(0, 0, w, h);

        // Cuando la velocidad es mínima, limpiamos más agresivamente para que las estrellas no dejen rastro borroso
        if (smoothVelocity < 1.0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
            ctx.fillRect(0, 0, w, h);
        }

        // Inercia de la cámara (suaviza el movimiento del ratón)
        mouseX += (targetMouseX - mouseX) * 0.06;
        mouseY += (targetMouseY - mouseY) * 0.06;

        // MOTOR DE INERCIA CON CURVA DE ANIMACIÓN DINÁMICA
        let ease;
        if (targetVelocity > smoothVelocity) {
            // ACELERACIÓN EXPONENCIAL (Efecto Tirachinas)
            const progress = Math.max(0, Math.min(1, (smoothVelocity - 1.0) / (148.0 - 1.0)));
            ease = 0.0025 + Math.pow(progress, 3.5) * 0.15;
        } else {
            // DESACELERACIÓN: Frenazo en seco reactivo
            ease = 0.08;
        }

        // Aplicamos la aceleración calculada a la velocidad real
        smoothVelocity += (targetVelocity - smoothVelocity) * ease;

        // SUAVIZADO EN 0.5s PARA EL CLÍMAX (Interpolación Lineal)
        const transitionSpeed = 0.033;
        if (isWarpActive) {
            warpTransition = Math.min(1.0, warpTransition + transitionSpeed);
        } else {
            warpTransition = Math.max(0.0, warpTransition - transitionSpeed);
        }

        // Punto central dinámico alterado por la inercia de la cámara
        const centerX = w / 2 - mouseX;
        const centerY = h / 2 - mouseY;

        // RENDERIZADO DE LA SECCIÓN DE ESTRELLAS
        for (let i = 0; i < numStars; i++) {
            const s = stars[i];

            // Avanzamos la estrella en el eje Z según la velocidad actual
            s.z -= 0.4 * smoothVelocity * s.modifier;

            // Si la estrella sobrepasa la cámara, la reciclamos al fondo
            if (s.z <= 0) {
                s.z = w;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.pow(Math.random(), 1.3) * (w * 0.5);
                s.x = Math.cos(angle) * distance;
                s.y = Math.sin(angle) * distance;
            }

            // Proyección matemática 3D a coordenadas 2D de pantalla
            let px = (s.x / s.z) * w + centerX;
            let py = (s.y / s.z) * h + centerY;

            // Cálculo de distancia radial desde el centro
            const dx = px - centerX;
            const dy = py - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // EFECTO LENTE CINEMATOGRÁFICA (Deformación de barril)
            if (smoothVelocity > 1.5 && dist > 0) {
                const lensFactor = 1 + (dist * (smoothVelocity - 1.5) * 0.000028);
                px = centerX + dx * lensFactor;
                py = centerY + dy * lensFactor;
            }

            // Dibujamos si está dentro del viewport
            if (px >= -300 && px <= w + 300 && py >= -300 && py <= h + 300) {
                const speedSizeMultiplier = 1.0 + (smoothVelocity * 0.015);
                const radius = Math.min(2.8, Math.max(0.1, (1 - s.z / w) * 1.0 * speedSizeMultiplier));
                const opacity = Math.max(0, Math.min(1, 0.00 + (1 - s.z / w) * 0.97));

                const warpThreshold = 2.0;
                let warpProgress = 0;

                if (smoothVelocity > warpThreshold) {
                    const maxExpectedVelocity = Math.max(targetVelocity, 198.0);
                    warpProgress = Math.max(0, (smoothVelocity - warpThreshold) / (maxExpectedVelocity - warpThreshold));
                }

                if (warpProgress > 0.05) {
                    const stretchMultiplier = 1.0 + (3.8 * warpTransition);
                    const trailFactor = Math.min(0.999, warpProgress * 0.11 * stretchMultiplier);

                    const tailX = px - (px - centerX) * trailFactor;
                    const tailY = py - (py - centerY) * trailFactor;

                    ctx.lineCap = 'round';

                    if (warpTransition > 0.01) {
                        // Capa A: Halo Gas Nebular
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.03 * warpTransition})`;
                        ctx.lineWidth = radius * 1.5;
                        ctx.moveTo(px, py);
                        ctx.lineTo(tailX, tailY);
                        ctx.stroke();

                        // Capa B: Bloom
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.08 * warpTransition})`;
                        ctx.lineWidth = radius * 2.0;
                        ctx.moveTo(px, py);
                        ctx.lineTo(tailX, tailY);
                        ctx.stroke();

                        // Capa C: Filamento elástico
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * (0.35 - 0.05 * warpTransition)})`;
                        ctx.lineWidth = radius * 1;
                        ctx.moveTo(px, py);
                        ctx.lineTo(tailX, tailY);
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 1})`;
                        ctx.lineWidth = radius * 1;
                        ctx.moveTo(px, py);
                        ctx.lineTo(tailX, tailY);
                        ctx.stroke();
                    }

                    // Capa D: Núcleo Incandescente
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.98})`;
                    ctx.lineWidth = radius * 0.5;
                    ctx.moveTo(px, py);
                    ctx.lineTo(tailX, tailY);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(px, py, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.fill();
                }
            }
        }



        requestAnimationFrame(draw);
    }

    draw();
}
initStarfield();

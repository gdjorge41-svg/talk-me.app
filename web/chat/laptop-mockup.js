function updateStageScale() {
    const stage = document.querySelector('.mockup');
    if (!stage) return;

    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight * 0.98;
    const stageWidth = Math.min(availableWidth, availableHeight * 1.5, 2000);
    stage.style.setProperty('--stage-width', `${stageWidth}px`);

    const laptopScreen = document.querySelector('.laptop-screen');
    const phoneScreen = document.querySelector('.phone-screen');
    if (laptopScreen) {
        stage.style.setProperty('--desktop-render-scale', `${laptopScreen.clientWidth / 1865}`);
    }
    if (phoneScreen) {
        const phoneWidth = phoneScreen.clientWidth;
        const sideMargin = phoneWidth < 180 ? 0 : 30;
        const widthScale = (phoneWidth - sideMargin) / 493;
        const heightScale = (phoneScreen.clientHeight * 0.95) / 1068;
        stage.style.setProperty('--desktop-phone-content-zoom', phoneWidth < 180 ? '1' : '1.08');
        stage.style.setProperty(
            '--mobile-render-scale',
            `${phoneWidth < 180 ? Math.min(widthScale, heightScale) : widthScale}`
        );
    }
}

const viewport = document.querySelector('.mockup-viewport');
const panLayer = document.querySelector('.mockup-pan-layer');
const activePointers = new Map();
let panScale = 1;
let panX = 0;
let panY = 0;
let gestureStart = null;

function applyPanTransform() {
    if (!panLayer) return;
    const viewportWidth = viewport?.clientWidth || window.innerWidth;
    const viewportHeight = viewport?.clientHeight || window.innerHeight;
    const stageWidth = panLayer.firstElementChild?.offsetWidth || viewportWidth;
    const stageHeight = panLayer.firstElementChild?.offsetHeight || viewportHeight;
    const baseScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mockup-zoom')) || 1;
    const renderedWidth = stageWidth * baseScale * panScale;
    const renderedHeight = stageHeight * baseScale * panScale;
    const maxPanX = Math.max(0, (renderedWidth - viewportWidth) / 2);
    const maxPanY = Math.max(0, (renderedHeight - viewportHeight) / 2);
    panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
    panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
    panLayer.style.setProperty('--pan-scale', panScale.toString());
    panLayer.style.setProperty('--pan-x', `${panX}px`);
    panLayer.style.setProperty('--pan-y', `${panY}px`);
}

function pointerCenter() {
    const pointers = [...activePointers.values()];
    return {
        x: (pointers[0].x + pointers[1].x) / 2,
        y: (pointers[0].y + pointers[1].y) / 2
    };
}

function pointerDistance() {
    const pointers = [...activePointers.values()];
    return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
}

function handlePointerDown(event) {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);

    if (activePointers.size === 1) {
        gestureStart = {
            x: event.clientX,
            y: event.clientY,
            panX,
            panY,
            scale: panScale
        };
    } else if (activePointers.size === 2) {
        gestureStart = {
            center: pointerCenter(),
            distance: pointerDistance(),
            panX,
            panY,
            scale: panScale
        };
    }
}

function handlePointerMove(event) {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!gestureStart) return;

    if (activePointers.size >= 2 && gestureStart.distance) {
        const currentDistance = pointerDistance();
        const currentCenter = pointerCenter();
        const nextScale = Math.min(4, Math.max(1, gestureStart.scale * currentDistance / gestureStart.distance));
        const viewportCenterX = (viewport?.clientWidth || window.innerWidth) / 2;
        const viewportCenterY = (viewport?.clientHeight || window.innerHeight) / 2;
        const scaleRatio = nextScale / gestureStart.scale;
        panScale = nextScale;
        panX = gestureStart.panX + (gestureStart.center.x - viewportCenterX - gestureStart.panX) * (1 - scaleRatio);
        panY = gestureStart.panY + (gestureStart.center.y - viewportCenterY - gestureStart.panY) * (1 - scaleRatio);
        panX += currentCenter.x - gestureStart.center.x;
        panY += currentCenter.y - gestureStart.center.y;
    } else if (activePointers.size === 1 && panScale > 1) {
        panX = gestureStart.panX + event.clientX - gestureStart.x;
        panY = gestureStart.panY + event.clientY - gestureStart.y;
    }

    applyPanTransform();
    event.preventDefault();
}

function handlePointerUp(event) {
    activePointers.delete(event.pointerId);
    if (activePointers.size === 0) {
        gestureStart = null;
    } else if (activePointers.size === 1) {
        const remainingPointer = [...activePointers.values()][0];
        gestureStart = {
            x: remainingPointer.x,
            y: remainingPointer.y,
            panX,
            panY,
            scale: panScale
        };
    }
}

if (viewport) {
    viewport.addEventListener('pointerdown', handlePointerDown, { passive: false });
    viewport.addEventListener('pointermove', handlePointerMove, { passive: false });
    viewport.addEventListener('pointerup', handlePointerUp, { passive: true });
    viewport.addEventListener('pointercancel', handlePointerUp, { passive: true });
}

function prepareFrame(frame, isPhone) {
    const phoneDocument = frame.contentDocument;
    if (!phoneDocument) return;

    const style = phoneDocument.createElement('style');
    style.textContent = `
        html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            overflow: hidden !important;
            background: #0a0a0f !important;
        }
        #mainContainer {
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
        }
        ${isPhone ? '#mainContainer.panel-collapsed { grid-template-columns: 0 minmax(0, 1fr) !important; }' : ''}
        ${isPhone ? '#mainContainer > .chat-area {' : '.chat-area {'}
            ${isPhone ? 'display: flex !important;' : ''}
            grid-column: ${isPhone ? '1 / -1' : '2'} !important;
            height: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            min-width: 0 !important;
            flex: 1 1 auto !important;
            overflow: hidden !important;
            padding-bottom: 0 !important;
        }
        .chat-area .input-area {
            position: relative !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            width: 100% !important;
            margin-top: 10px !important;
            margin-bottom: 0 !important;
            flex-shrink: 0 !important;
        }
        .chat-area .messages-container {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            margin-bottom: 10px !important;
        }
        ${isPhone ? '#mainContainer > .control-panel { display: none !important; } #mainContainer { grid-template-columns: minmax(0, 1fr) !important; }' : ''}
    `;
    phoneDocument.head.appendChild(style);

    const mainContainer = phoneDocument.getElementById('mainContainer');
    if (isPhone && mainContainer) {
        const showChatOnly = () => {
            mainContainer.classList.add('panel-collapsed');
            const panel = mainContainer.querySelector('.control-panel');
            if (panel) panel.setAttribute('aria-hidden', 'true');
        };
        showChatOnly();
        new MutationObserver(showChatOnly).observe(mainContainer, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
}

document.querySelector('.laptop-screen iframe').addEventListener('load', event => {
    prepareFrame(event.currentTarget, false);
});
document.querySelector('.phone-screen iframe').addEventListener('load', event => {
    prepareFrame(event.currentTarget, true);
});
let scaleUpdatePending = false;

function scheduleStageScale() {
    if (scaleUpdatePending) return;
    scaleUpdatePending = true;
    requestAnimationFrame(() => {
        scaleUpdatePending = false;
        updateStageScale();
    });
}

window.addEventListener('resize', scheduleStageScale, { passive: true });
window.addEventListener('orientationchange', scheduleStageScale, { passive: true });
window.addEventListener('load', updateStageScale, { once: true });
updateStageScale();

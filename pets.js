/* Pepsi cursor + pixel cat for the heart page (same code as app.js) */
/* ===== CURSOR ===== */
function initCursor() {
    const cursor = document.getElementById('custom-cursor');
    const trail = document.getElementById('cursor-trail');
    if (!cursor || window.innerWidth <= 768) return;
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.08 });
        gsap.to(trail, { x: e.clientX, y: e.clientY, duration: 0.32 });
    });
}

/* ===== ONEKO CAT (cursor-chasing pixel cat) ===== */
function initOneko() {
    const el = document.getElementById('oneko');
    if (!el) return;

    // Sprite sheet libs/oneko.gif: 256x128px = 8 columns x 4 rows, 32px cells.
    // Each entry is [col, row] as negative offsets (backgroundPosition = col*32px, row*32px).
    const spriteSets = {
        idle:        [[-3, -3]],
        tired:       [[-3, -2]],
        sleeping:    [[-2, 0], [-2, -1]],
        scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
        N:  [[-1, -2], [-1, -3]],
        NE: [[0, -2],  [0, -3]],
        E:  [[-3, 0],  [-3, -1]],
        SE: [[-5, -1], [-5, -2]],
        S:  [[-6, -3], [-7, -2]],
        SW: [[-5, -3], [-6, -1]],
        W:  [[-4, -2], [-4, -3]],
        NW: [[-1, 0],  [-1, -1]],
    };

    function setSprite(name, frame) {
        const set = spriteSets[name];
        if (!set) return;
        const f = set[frame % set.length];
        const pos = `${f[0] * 32}px ${f[1] * 32}px`;
        if (el._pos !== pos) { el.style.backgroundPosition = pos; el._pos = pos; }
    }

    // Direction from cat to cursor (screen y points down, so negative dy = north)
    function getDir(dx, dy, dist) {
        const nx = dx / dist, ny = dy / dist;
        let d = '';
        d += ny < -0.5 ? 'N' : (ny > 0.5 ? 'S' : '');
        d += nx > 0.5 ? 'E' : (nx < -0.5 ? 'W' : '');
        return d || (Math.abs(nx) > Math.abs(ny) ? (nx > 0 ? 'E' : 'W') : (ny > 0 ? 'S' : 'N'));
    }

    const SPEED = 230;          // px per second
    const START_DIST = 60;      // start chasing when cursor is farther than this
    const STOP_DIST = 36;       // stop when this close (hysteresis = no jitter)
    const RUN_FRAME_MS = 120;   // legs alternate every 120ms
    const DIR_LOCK_MS = 140;    // don't flip direction sprite more often than this
    const IDLE_BEFORE_NAP = 4000;

    let catX = 32, catY = 32;
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let moving = false;
    let dir = 'S', dirAge = 0;
    let runTimer = 0, runFrame = 0;
    let idleMs = 0;
    let idleAnim = null, idleAnimMs = 0;   // one idle action at a time: 'sleeping' | 'scratchSelf'
    let last = performance.now();

    function wake() { idleMs = 0; idleAnim = null; idleAnimMs = 0; }
    function target(x, y) { mouseX = x; mouseY = y; }

    document.addEventListener('mousemove', (e) => target(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) target(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) target(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    function loop(now) {
        const dt = Math.min(now - last, 50);   // ms, clamped so tab switches don't teleport the cat
        last = now;

        const dx = mouseX - catX, dy = mouseY - catY;
        const dist = Math.hypot(dx, dy) || 0.0001;

        if (!moving && dist > START_DIST) { moving = true; wake(); }
        if (moving && dist <= STOP_DIST) { moving = false; runFrame = 0; runTimer = 0; }

        if (moving) {
            // glide toward cursor, never overshooting the stop distance
            const step = Math.min(SPEED * dt / 1000, dist - STOP_DIST + 1);
            catX += (dx / dist) * step;
            catY += (dy / dist) * step;
            el.style.transform = `translate3d(${Math.round(catX) - 16}px, ${Math.round(catY) - 16}px, 0)`;

            // direction sprite, with a short lock so it doesn't flicker
            dirAge += dt;
            const nd = getDir(dx, dy, dist);
            if (nd !== dir && dirAge >= DIR_LOCK_MS) { dir = nd; dirAge = 0; }

            runTimer += dt;
            if (runTimer >= RUN_FRAME_MS) { runTimer -= RUN_FRAME_MS; runFrame = (runFrame + 1) % 2; }
            setSprite(dir, runFrame);
        } else {
            // standing still: plain idle pose, with one calm nap or scratch after a while
            idleMs += dt;
            if (!idleAnim && idleMs > IDLE_BEFORE_NAP) {
                idleAnim = Math.random() < 0.6 ? 'sleeping' : 'scratchSelf';
                idleAnimMs = 0;
            }
            if (idleAnim === 'sleeping') {
                idleAnimMs += dt;
                if (idleAnimMs < 900) setSprite('tired', 0);
                else setSprite('sleeping', Math.floor((idleAnimMs - 900) / 500));
            } else if (idleAnim === 'scratchSelf') {
                idleAnimMs += dt;
                setSprite('scratchSelf', Math.floor(idleAnimMs / 150));
                if (idleAnimMs > 1800) { idleAnim = null; idleMs = IDLE_BEFORE_NAP - 2500; }
            } else {
                setSprite('idle', 0);
            }
        }
        requestAnimationFrame(loop);
    }

    el.style.transform = `translate3d(${catX - 16}px, ${catY - 16}px, 0)`;
    setSprite('idle', 0);
    requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', () => { initCursor(); initOneko(); });

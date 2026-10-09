/* ============================================
   GANNAH'S 18TH BIRTHDAY — APP.JS (Redesigned)
   Tab Navigation System
   ============================================ */

const CONFIG = {
    password: 'GANNAH8686',
};

let state = {
    unlocked: false,
    ringScene: null,
    currentTab: 'cake',
    audioEl: null,
    currentSongIdx: -1,
    songPlaying: false,
};

gsap.registerPlugin(ScrollToPlugin);

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

/* ===== PASSWORD PAGE PARTICLES ===== */
function initPasswordParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const PALETTES = [
        ['#e8839b','#d4638a','#f0a4b8'],
        ['#f4b183','#e8935a','#f9d4b0'],
        ['#c9a0dc','#a373c2','#dfc4eb'],
        ['#ff9a9e','#d4686e','#ffb7b2'],
        ['#f7c59f','#eaa56c','#fce0c4'],
    ];
    const flowers = [];

    function createFlower(spreadY) {
        const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
        return {
            x: Math.random() * canvas.width,
            y: spreadY !== undefined ? Math.random() * canvas.height : -20 - Math.random() * canvas.height * 0.4,
            size: 6 + Math.random() * 18,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.03,
            fallSpeed: 0.4 + Math.random() * 1.2,
            drift: (Math.random() - 0.5) * 0.8,
            driftPhase: Math.random() * Math.PI * 2,
            driftFreq: 0.005 + Math.random() * 0.01,
            opacity: 0.35 + Math.random() * 0.5,
            colors: pal,
            type: Math.floor(Math.random() * 3),
            petalCount: [5, 6, 4][Math.floor(Math.random() * 3)],
        };
    }

    for (let i = 0; i < 50; i++) flowers.push(createFlower(true));

    function drawFlower(f) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha = f.opacity;
        if (f.type === 0) {
            for (let p = 0; p < f.petalCount; p++) {
                const angle = (p / f.petalCount) * Math.PI * 2;
                ctx.save(); ctx.rotate(angle);
                ctx.beginPath();
                ctx.ellipse(f.size * 0.5, 0, f.size * 0.45, f.size * 0.28, 0, 0, Math.PI * 2);
                ctx.fillStyle = f.colors[p % 2 === 0 ? 0 : 1]; ctx.fill(); ctx.restore();
            }
            ctx.beginPath(); ctx.arc(0, 0, f.size * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = f.colors[2]; ctx.fill();
        } else if (f.type === 1) {
            for (let p = 0; p < f.petalCount; p++) {
                const angle = (p / f.petalCount) * Math.PI * 2;
                ctx.save(); ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(f.size * 0.3, -f.size * 0.2, f.size * 0.7, 0);
                ctx.quadraticCurveTo(f.size * 0.3, f.size * 0.2, 0, 0);
                ctx.fillStyle = f.colors[p % 2 === 0 ? 0 : 1]; ctx.fill(); ctx.restore();
            }
            ctx.beginPath(); ctx.arc(0, 0, f.size * 0.12, 0, Math.PI * 2);
            ctx.fillStyle = '#f7e1a0'; ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -f.size * 0.4);
            ctx.bezierCurveTo(f.size * 0.5, -f.size * 0.3, f.size * 0.4, f.size * 0.3, 0, f.size * 0.5);
            ctx.bezierCurveTo(-f.size * 0.4, f.size * 0.3, -f.size * 0.5, -f.size * 0.3, 0, -f.size * 0.4);
            ctx.fillStyle = f.colors[0]; ctx.fill();
        }
        ctx.restore();
    }

    let exploding = false, explodeAlpha = 1;
    state.flowerCanvas = { ctx, canvas, flowers, exploding: false, explodeAlpha: 1 };

    function animate() {
        if (!state.flowerCanvas) return;
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const fc = state.flowerCanvas;
        if (fc.exploding) {
            fc.explodeAlpha -= 0.025;
            if (fc.explodeAlpha <= 0) return;
            ctx.globalAlpha = fc.explodeAlpha;
        }
        fc.flowers.forEach(f => {
            f.y += f.fallSpeed;
            f.x += f.drift + Math.sin(f.driftPhase) * 0.5;
            f.driftPhase += f.driftFreq;
            f.rotation += f.rotSpeed;
            if (fc.exploding) { f.fallSpeed += 0.3; f.drift *= 1.05; }
            if (f.y > canvas.height + 30 && !fc.exploding) {
                f.y = -30; f.x = Math.random() * canvas.width;
            }
            drawFlower(f);
        });
        ctx.globalAlpha = 1;
    }
    animate();
    window.addEventListener('resize', () => {
        if (!state.flowerCanvas) return;
        state.flowerCanvas.canvas.width = window.innerWidth;
        state.flowerCanvas.canvas.height = window.innerHeight;
    });
}

function explodeParticles() {
    if (!state.flowerCanvas) return;
    const fc = state.flowerCanvas;
    fc.exploding = true;
    const pal = ['#e8839b','#d4638a','#f0a4b8'];
    for (let i = 0; i < 30; i++) {
        fc.flowers.push({
            x: fc.canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: fc.canvas.height / 2,
            size: 10 + Math.random() * 20,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.1,
            fallSpeed: -(3 + Math.random() * 8),
            drift: (Math.random() - 0.5) * 6,
            driftPhase: 0, driftFreq: 0,
            opacity: 0.7 + Math.random() * 0.3,
            colors: pal, type: 0, petalCount: 5,
        });
    }
}

/* ===== FLYING ROSES ANIMATION ===== */
function startRoseAnimation(onComplete) {
    const canvas = document.getElementById('rose-canvas');
    if (!canvas) { onComplete(); return; }
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const roseColors = [
        ['#e8203c','#b81030','#ff6080'],
        ['#ff4d6d','#c9184a','#ff8fa3'],
        ['#c0392b','#922b21','#e74c3c'],
        ['#f48fb1','#ec407a','#fce4ec'],
        ['#ad1457','#880e4f','#e91e63'],
    ];

    const roses = [];
    function spawnRose(fromCenter) {
        const pal = roseColors[Math.floor(Math.random() * roseColors.length)];
        return {
            x: fromCenter ? canvas.width / 2 + (Math.random() - 0.5) * 120 : Math.random() * canvas.width,
            y: fromCenter ? canvas.height / 2 + (Math.random() - 0.5) * 80 : -40,
            vx: (Math.random() - 0.5) * (fromCenter ? 8 : 3),
            vy: fromCenter ? -(4 + Math.random() * 9) : (0.6 + Math.random() * 1.4),
            size: fromCenter ? 18 + Math.random() * 24 : 10 + Math.random() * 20,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.09,
            alpha: fromCenter ? 0 : 0.8 + Math.random() * 0.2,
            alphaTarget: 1,
            gravity: fromCenter ? 0.18 : 0,
            colors: pal,
            type: Math.floor(Math.random() * 2), // 0=rose, 1=petal
            drift: (Math.random() - 0.5) * 0.5,
            phase: Math.random() * Math.PI * 2,
        };
    }

    // Initial burst from center
    for (let i = 0; i < 55; i++) roses.push(spawnRose(true));
    // Falling roses from top
    for (let i = 0; i < 30; i++) {
        const r = spawnRose(false);
        r.y = Math.random() * canvas.height; // pre-spread
        roses.push(r);
    }

    function drawRose(ctx, size, colors) {
        const petals = 5;
        for (let p = 0; p < petals; p++) {
            const angle = (p / petals) * Math.PI * 2;
            ctx.save(); ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(size * 0.45, 0, size * 0.42, size * 0.26, 0, 0, Math.PI * 2);
            ctx.fillStyle = colors[p % 2 === 0 ? 0 : 1]; ctx.fill();
            ctx.restore();
        }
        // Inner petals
        for (let p = 0; p < petals; p++) {
            const angle = (p / petals) * Math.PI * 2 + Math.PI / petals;
            ctx.save(); ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(size * 0.28, 0, size * 0.28, size * 0.18, 0, 0, Math.PI * 2);
            ctx.fillStyle = colors[2]; ctx.fill();
            ctx.restore();
        }
        // Center
        ctx.beginPath(); ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = colors[0]; ctx.fill();
    }

    function drawPetal(ctx, size, colors) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.bezierCurveTo(size * 0.6, -size * 0.5, size * 0.5, size * 0.5, 0, size);
        ctx.bezierCurveTo(-size * 0.5, size * 0.5, -size * 0.6, -size * 0.5, 0, -size);
        ctx.fillStyle = colors[0]; ctx.fill();
    }

    let startTime = null;
    const duration = 2400;
    let spawnTimer = 0;

    function animate(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        spawnTimer += 16;
        if (spawnTimer > 80 && elapsed < 1600) {
            roses.push(spawnRose(false));
            spawnTimer = 0;
        }

        roses.forEach(r => {
            r.x += r.vx + Math.sin(r.phase) * 0.6;
            r.y += r.vy;
            r.vy += r.gravity;
            r.phase += 0.015;
            r.rot += r.rotSpeed;
            if (r.alpha < r.alphaTarget) r.alpha = Math.min(r.alphaTarget, r.alpha + 0.06);
            if (elapsed > duration * 0.55) r.alpha = Math.max(0, r.alpha - 0.025);

            ctx.save();
            ctx.translate(r.x, r.y);
            ctx.rotate(r.rot);
            ctx.globalAlpha = Math.max(0, r.alpha);
            if (r.type === 0) drawRose(ctx, r.size, r.colors);
            else drawPetal(ctx, r.size, r.colors);
            ctx.restore();
        });

        if (elapsed < duration) {
            requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onComplete();
        }
    }
    requestAnimationFrame(animate);
}

/* ===== PASSWORD ===== */
function initPassword() {
    const input = document.getElementById('password-input');
    const error = document.getElementById('password-error');
    const flash = document.getElementById('white-flash');
    const page = document.getElementById('password-page');

    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const val = input.value.trim().toUpperCase();
        if (val === CONFIG.password) {
            explodeParticles();
            gsap.timeline()
                .to(flash, { opacity: 1, duration: 0.35, delay: 0.2 })
                .to(flash, { opacity: 0, duration: 0.5 })
                .call(() => {
                    page.style.display = 'none';
                    state.unlocked = true;
                    // Reveal main content
                    revealMainContent();
                    // Start rose animation over everything
                    startRoseAnimation(() => { /* roses done */ });
                });
        } else {
            error.classList.add('visible');
            anime({
                targets: input,
                translateX: [-14, 14, -10, 10, -5, 5, 0],
                duration: 500, easing: 'easeInOutQuad'
            });
            input.style.borderColor = '#e85d75';
            setTimeout(() => {
                input.style.borderColor = '';
                error.classList.remove('visible');
                input.value = '';
            }, 1500);
        }
    });
}

/* ===== REVEAL MAIN CONTENT ===== */
function revealMainContent() {
    const main = document.getElementById('main-content');
    main.style.display = 'block';
    gsap.from(main, { opacity: 0, duration: 0.8, ease: 'power2.out' });
    // Init everything
    initTabNav();
    initBgPetals();
    initFooterPetals();
    initRing();
    initMusicPlayer();
    initGalleryLightbox();
    initConfettiBtn();
    // 23rd of the month? celebrate right after she opens the site
    setTimeout(() => { if (window.togetherCounter) window.togetherCounter.celebrateIfToday(true); }, 1400);
}

/* ===== TAB NAVIGATION ===== */
function initTabNav() {
    const allBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    function switchTab(tabId) {
        // Update buttons
        allBtns.forEach(b => {
            if (b.dataset.tab === tabId) b.classList.add('active');
            else b.classList.remove('active');
        });
        // Update panels
        panels.forEach(p => {
            if (p.id === 'tab-' + tabId) p.classList.add('active');
            else p.classList.remove('active');
        });
        state.currentTab = tabId;
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile nav
        mobileNav.classList.remove('open');

        // Lazy init ring when ring tab opens
        if (tabId === 'ring') {
            if (window.togetherCounter) window.togetherCounter.celebrateIfToday(false);
            setTimeout(() => {
                if (state.ringScene) {
                    const c = document.getElementById('ring-canvas');
                    if (c) {
                        state.ringScene.camera.aspect = c.clientWidth / c.clientHeight;
                        state.ringScene.camera.updateProjectionMatrix();
                        state.ringScene.renderer.setSize(c.clientWidth, c.clientHeight);
                    }
                }
            }, 100);
        }
    }

    allBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
        });
    }
}

/* ===== BACKGROUND PETALS ===== */
function initBgPetals() {
    const canvas = document.getElementById('bg-petal-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#e8839b','#f4b183','#c9a0dc','#f9c6d0','#fce4ec','#f48fb1','#ff9a9e'];
    const petals = Array.from({ length: 40 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 4 + Math.random() * 12,
        speed: 0.2 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.018,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.12 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        petals.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.5, p.size * 0.5, p.size * 0.5, 0, p.size);
            ctx.bezierCurveTo(-p.size * 0.5, p.size * 0.5, -p.size * 0.6, -p.size * 0.5, 0, -p.size);
            ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
            p.y += p.speed;
            p.x += p.drift + Math.sin(p.phase) * 0.25;
            p.phase += 0.008;
            p.rot += p.rotSpeed;
            if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
        });
        requestAnimationFrame(draw);
    }
    draw();
}

/* ===== FOOTER PETALS ===== */
function initFooterPetals() {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    canvas.width = window.innerWidth;
    canvas.height = parent ? parent.clientHeight : 300;

    const colors = ['#e8839b','#f4b183','#c9a0dc','#ff9a9e','#f6e199','#f0a4b8'];
    const petals = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        size: 3 + Math.random() * 8, speed: 0.2 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.35, rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.2 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        petals.forEach(p => {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.bezierCurveTo(p.size*0.6,-p.size*0.5,p.size*0.5,p.size*0.5,0,p.size);
            ctx.bezierCurveTo(-p.size*0.5,p.size*0.5,-p.size*0.6,-p.size*0.5,0,-p.size);
            ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
            p.y += p.speed; p.x += p.drift + Math.sin(p.phase) * 0.25; p.phase += 0.01; p.rot += p.rotSpeed;
            if (p.y > canvas.height + 15) { p.y = -15; p.x = Math.random() * canvas.width; }
        });
        requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : 300;
    });
}

/* ===== THREE.JS RING ===== */
function initRing() {
    const canvas = document.getElementById('ring-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const W = canvas.clientWidth || 400;
    const H = canvas.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.physicallyCorrectLights = true;

    const texLoader = new THREE.TextureLoader();
    const texBase = 'the-ring-1-carat/textures/';
    function loadTex(name, enc) {
        const t = texLoader.load(texBase + name);
        if (enc) t.encoding = enc;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return t;
    }

    const albedo   = loadTex('Thering_albedo.jpeg',   THREE.sRGBEncoding);
    const normalM  = loadTex('Thering_normal.jpeg');
    const metalM   = loadTex('Thering_metallic.jpeg');
    const roughM   = loadTex('Thering_roughness.jpeg');
    const aoM      = loadTex('Thering_AO.jpeg');
    const emissM   = loadTex('Thering_emissive.jpeg', THREE.sRGBEncoding);

    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const bandGeo = new THREE.TorusGeometry(1.0, 0.22, 64, 128);
    bandGeo.setAttribute('uv2', bandGeo.attributes.uv);
    const bandMat = new THREE.MeshStandardMaterial({
        map: albedo, normalMap: normalM, metalnessMap: metalM,
        roughnessMap: roughM, aoMap: aoM, aoMapIntensity: 1.0,
        emissiveMap: emissM, emissive: new THREE.Color(0xffd070), emissiveIntensity: 0.08,
        metalness: 0.95, roughness: 0.12,
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    ringGroup.add(band);

    const gemGeo = new THREE.OctahedronGeometry(0.28, 1);
    const gemMat = new THREE.MeshPhysicalMaterial({
        color: 0xd0f4ff, metalness: 0, roughness: 0,
        transmission: 0.98, thickness: 0.5, ior: 2.4,
        reflectivity: 1.0, clearcoat: 1.0, clearcoatRoughness: 0.05,
        transparent: true, opacity: 0.92,
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 1.26, 0);
    gem.rotation.y = Math.PI / 4;
    ringGroup.add(gem);

    const settingGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.12, 16);
    const settingMat = new THREE.MeshStandardMaterial({ color: 0xd4a54a, metalness: 0.97, roughness: 0.08 });
    const setting = new THREE.Mesh(settingGeo, settingMat);
    setting.position.set(0, 1.08, 0);
    ringGroup.add(setting);

    ringGroup.rotation.x = Math.PI / 5;
    ringGroup.rotation.z = Math.PI / 10;

    // Lighting
    const keyLight = new THREE.PointLight(0xfff5e0, 3.5, 20);
    keyLight.position.set(4, 5, 4); scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xd0e8ff, 1.8, 20);
    fillLight.position.set(-4, -2, 3); scene.add(fillLight);
    const accentLight = new THREE.PointLight(0xffb0c8, 1.2, 15);
    accentLight.position.set(0, -4, 2); scene.add(accentLight);
    const ambient = new THREE.AmbientLight(0xfff0f5, 0.6); scene.add(ambient);

    try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0xfff0f5);
        const envGeo = new THREE.SphereGeometry(50, 16, 8);
        const envMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0xfff0f5 });
        envScene.add(new THREE.Mesh(envGeo, envMat));
        scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    } catch(e) {}

    state.ringScene = { scene, camera, renderer, ring: ringGroup, gem };

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    });

    function animateRing() {
        if (!state.ringScene) return;
        requestAnimationFrame(animateRing);
        const r = state.ringScene.ring;
        r.rotation.y += 0.006;
        r.rotation.x += (mouseY * 0.3 - r.rotation.x) * 0.04;
        state.ringScene.gem.rotation.y += 0.012;
        state.ringScene.gem.rotation.x += 0.004;
        state.ringScene.renderer.render(state.ringScene.scene, state.ringScene.camera);
    }
    animateRing();

    window.addEventListener('resize', () => {
        if (!state.ringScene) return;
        const c = document.getElementById('ring-canvas');
        if (!c || !c.clientWidth) return;
        state.ringScene.camera.aspect = c.clientWidth / c.clientHeight;
        state.ringScene.camera.updateProjectionMatrix();
        state.ringScene.renderer.setSize(c.clientWidth, c.clientHeight);
    });
}

/* ===== MUSIC PLAYER ===== */
function initMusicPlayer() {
    const audio = new Audio();
    audio.preload = 'metadata';
    state.audioEl = audio;

    const songs = Array.from(document.querySelectorAll('.song-item'));
    const vinylDisc = document.getElementById('vinyl-disc');
    const npTitle = document.getElementById('np-title');
    const npArtist = document.getElementById('np-artist');
    const playBtn = document.getElementById('main-play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progFill = document.getElementById('prog-fill');
    const progBar = document.getElementById('prog-bar');
    const curTime = document.getElementById('cur-time');
    const totTime = document.getElementById('tot-time');
    const volSlider = document.getElementById('vol-slider');
    const shuffleBtn = document.getElementById('shuffle-btn');
    let shuffle = false;
    function nextIndex() {
        if (shuffle && songs.length > 1) {
            let r;
            do { r = Math.floor(Math.random() * songs.length); } while (r === state.currentSongIdx);
            return r;
        }
        return (state.currentSongIdx + 1) % songs.length;
    }
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
        shuffle = !shuffle;
        shuffleBtn.classList.toggle('on', shuffle);
        shuffleBtn.setAttribute('aria-pressed', String(shuffle));
    });

    if (!songs.length || !playBtn) return;

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    function setPlaying(playing) {
        state.songPlaying = playing;
        if (playBtn) playBtn.textContent = playing ? '❚❚' : '▶';
        if (vinylDisc) {
            if (playing) vinylDisc.classList.add('playing');
            else vinylDisc.classList.remove('playing');
        }
    }

    function loadSong(idx) {
        const item = songs[idx];
        if (!item) return;
        songs.forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        state.currentSongIdx = idx;
        audio.src = item.dataset.src;
        if (npTitle) npTitle.textContent = item.dataset.title || 'Unknown';
        if (npArtist) npArtist.textContent = item.dataset.artist || '';
        audio.load();
    }

    function playSong(idx) {
        loadSong(idx);
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }

    songs.forEach((item, i) => {
        item.addEventListener('click', () => playSong(i));
    });

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (state.currentSongIdx === -1) { playSong(0); return; }
            if (state.songPlaying) { audio.pause(); setPlaying(false); }
            else { audio.play().then(() => setPlaying(true)).catch(() => {}); }
        });
    }
    if (prevBtn) prevBtn.addEventListener('click', () => {
        const idx = (state.currentSongIdx - 1 + songs.length) % songs.length;
        playSong(idx);
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        playSong(nextIndex());
    });

    audio.addEventListener('ended', () => {
        playSong(nextIndex());
    });
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        if (progFill) progFill.style.width = pct + '%';
        if (curTime) curTime.textContent = formatTime(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
        if (totTime) totTime.textContent = formatTime(audio.duration);
    });

    if (progBar) {
        progBar.addEventListener('click', (e) => {
            const rect = progBar.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audio.duration) audio.currentTime = pct * audio.duration;
        });
    }
    if (volSlider) {
        volSlider.addEventListener('input', () => { audio.volume = volSlider.value; });
    }
}

/* ===== GALLERY LIGHTBOX ===== */
function initGalleryLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbClose = document.getElementById('lightbox-close');

    document.querySelectorAll('.gallery-card img').forEach(img => {
        img.addEventListener('click', () => {
            lbImg.src = img.src;
            lightbox.style.display = 'flex';
            gsap.from(lbImg, { scale: 0.85, opacity: 0, duration: 0.35, ease: 'back.out(1.5)' });
        });
    });

    if (lbClose) lbClose.addEventListener('click', () => { lightbox.style.display = 'none'; });
    if (lightbox) lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.style.display = 'none';
    });
}

/* ===== CONFETTI BUTTON ===== */
function initConfettiBtn() {
    const btn = document.getElementById('confetti-btn');
    if (!btn || typeof confetti === 'undefined') return;
    btn.addEventListener('click', () => {
        const colors = ['#d4a574','#e8b4b8','#f5d5d8','#fff5f0','#f0d6a8','#f48fb1','#ce93d8'];
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors });
        setTimeout(() => confetti({ particleCount: 70, spread: 110, origin: { x: 0.2, y: 0.5 }, colors }), 300);
        setTimeout(() => confetti({ particleCount: 70, spread: 110, origin: { x: 0.8, y: 0.5 }, colors }), 600);
        setTimeout(() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors, gravity: 1.5 }), 900);
    });
}

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initOneko();
    initPasswordParticles();
    initPassword();
});


/* ===== TOGETHER COUNTER (The Best Days in My Life) ===== */
/* Pure helper: whole calendar months + the rest, counted from `start` (kept separate so it is easy to test). */
function computeTogether(start, now) {
    if (now < start) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const anchor = (n) => new Date(start.getFullYear(), start.getMonth() + n, start.getDate(),
                                   start.getHours(), start.getMinutes(), start.getSeconds());
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (anchor(months) > now) months--;
    let rest = Math.floor((now - anchor(months)) / 1000);
    const days = Math.floor(rest / 86400); rest -= days * 86400;
    const hours = Math.floor(rest / 3600); rest -= hours * 3600;
    const minutes = Math.floor(rest / 60);
    return { months, days, hours, minutes, seconds: rest - minutes * 60 };
}

(function initTogetherCounter() {
    const root = document.getElementById('together-counter');
    if (!root) return;
    const start = new Date(root.dataset.start);           // 23 February 2026, local time
    const $ = (id) => document.getElementById(id);
    const els = { months: $('t-months'), days: $('t-days'), hours: $('t-hours'), minutes: $('t-minutes'), seconds: $('t-seconds') };
    const nextEl = $('t-next'), todayEl = $('t-today');
    const toast = $('month-toast'), toastTitle = $('mt-title');
    const D = start.getDate();                             // the 23rd
    let lastMonths = null, lastBurst = 0, toastTimer = null;

    function isMonthiversary(now) { return now.getDate() === D && now >= start && computeTogether(start, now).months > 0; }

    function burst() {
        if (typeof confetti === 'undefined') return;
        const colors = ['#d4a574','#e8b4b8','#f5d5d8','#fff5f0','#f0d6a8','#f48fb1','#ce93d8'];
        confetti({ particleCount: 140, spread: 100, origin: { y: 0.55 }, colors });
        setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.15, y: 0.6 }, colors }), 350);
        setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.85, y: 0.6 }, colors }), 700);
        setTimeout(() => confetti({ particleCount: 60, spread: 70, origin: { y: 0.9 }, colors, gravity: 1.4 }), 1050);
    }

    function title(months) {
        if (months >= 12 && months % 12 === 0) return `Happy ${months / 12}-year anniversary, my love!`;
        return `Happy ${months}-month anniversary, my love!`;
    }

    function showToast(months) {
        if (!toast) return;
        toastTitle.textContent = title(months);
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.hidden = true; }, 9000);
    }
    if (toast) toast.addEventListener('click', () => { toast.hidden = true; });

    // withToast: full celebration (confetti + message); otherwise just a confetti burst
    function celebrateIfToday(withToast) {
        const now = new Date();
        if (!isMonthiversary(now)) return;
        if (Date.now() - lastBurst < 8000) return;
        lastBurst = Date.now();
        burst();
        if (withToast) showToast(computeTogether(start, now).months);
    }

    function nextLine(now) {
        // next 23rd at 00:00 (strictly in the future)
        let target = new Date(now.getFullYear(), now.getMonth(), D);
        if (target <= now) target = new Date(now.getFullYear(), now.getMonth() + 1, D);
        const days = Math.ceil((target - now) / 86400000);
        return `Next monthiversary in ${days} ${days === 1 ? 'day' : 'days'} 🎀`;
    }

    function tick() {
        const now = new Date();
        const t = computeTogether(start, now);
        for (const k in els) els[k].textContent = t[k];

        if (isMonthiversary(now)) {
            todayEl.hidden = false;
            todayEl.textContent = `🎉 Today is our ${t.months >= 12 && t.months % 12 === 0 ? (t.months / 12) + '-year' : t.months + '-month'} anniversary! 🎉`;
            nextEl.textContent = 'See you next month, my love 💕';
        } else {
            todayEl.hidden = true;
            nextEl.textContent = nextLine(now);
        }
        // the clock just rolled over into a new month while she is watching
        if (lastMonths !== null && t.months > lastMonths) { lastBurst = 0; celebrateIfToday(true); }
        lastMonths = t.months;
    }
    tick();
    setInterval(tick, 1000);
    window.togetherCounter = { celebrateIfToday };
})();

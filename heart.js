/* Heart page: tapping the hidden "86" sets a folded sheet of paper on the screen; tapping the paper unfolds it. */
/* ===== SECRET LETTER (hidden "86" button -> a real folded sheet of paper that unfolds) ===== */
function initSecretLetter() {
    const triggers = Array.from(document.querySelectorAll('.hit86'));
    let trigger = triggers[0];
    const root    = document.getElementById('secret-letter');
    if (!triggers.length || !root) return;

    const backdrop = root.querySelector('.sl-backdrop');
    const stage    = root.querySelector('.sl-stage');
    const shadowEl = root.querySelector('.sl-shadow');
    const sheet    = document.getElementById('sl-sheet');
    const pA = sheet.querySelector('.sl-pA');
    const pB = sheet.querySelector('.sl-pB');
    const pC = sheet.querySelector('.sl-pC');
    const read     = document.getElementById('sl-read');
    const creases  = sheet.querySelector('.sl-creases');
    const closeBtn = document.getElementById('secret-close');
    const source   = read.querySelector('.sl-content');
    const sticker  = source.querySelector('.sl-sticker');
    const castA    = pB.querySelector('.castA');
    const castC    = pB.querySelector('.castC');
    const shadesA  = pA.querySelectorAll('.shade');
    const shadesC  = pC.querySelectorAll('.shade');
    const body     = document.body;
    const reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover)').matches;

    let state = 'closed';            // closed | entering | folded | opening | open
    let tl = null, breath = null, sway = null, hoverOn = false;

    /* sheet size: a big sheet that fills most of the screen */
    function sizeSheet() {
        const w = Math.min(window.innerWidth * 0.94, 640);
        const h = Math.min(window.innerHeight * 0.94, 1000);
        root.style.setProperty('--sw', Math.round(w) + 'px');
        root.style.setProperty('--sh', Math.round(h) + 'px');
    }

    /* the three sections each show their own slice of the same letter, so the text is on the paper the whole time */
    sheet.querySelectorAll('.slice').forEach((sl) => {
        sl.style.setProperty('--off', sl.dataset.off);
        const copy = source.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        sl.appendChild(copy);
    });

    /* light and shadow follow the flaps while they move */
    function paint() {
        const pa = 1 - Math.abs(gsap.getProperty(pA, 'rotationX')) / 180;
        const pc = 1 - Math.abs(gsap.getProperty(pC, 'rotationX')) / 180;
        const sa = Math.sin(Math.PI * pa), sc = Math.sin(Math.PI * pc);
        gsap.set(shadesA, { opacity: 0.46 * sa });
        gsap.set(shadesC, { opacity: 0.46 * sc });
        gsap.set(castA, { opacity: Math.min(1, 1.15 * sa) });
        gsap.set(castC, { opacity: Math.min(1, 1.15 * sc) });
    }

    function setFolded() {
        gsap.set(pA, { rotationX: -180, z: 2, visibility: 'visible' });
        gsap.set(pC, { rotationX: 180,  z: 2, visibility: 'visible' });
        gsap.set(pB, { visibility: 'visible' });
        gsap.set(shadowEl, { scaleY: 0.5 });
        read.style.visibility = 'hidden';
        read.scrollTop = 0;
        creases.style.opacity = 0;
        sheet.classList.remove('is-open');
        paint();
    }

    function makeFoldable() {
        sheet.setAttribute('role', 'button');
        sheet.setAttribute('tabindex', '0');
        sheet.setAttribute('aria-label', 'Folded letter. Press Enter to unfold it.');
    }
    function makeReadable() {
        sheet.removeAttribute('role');
        sheet.removeAttribute('tabindex');
        sheet.removeAttribute('aria-label');
    }

    /* the folds breathe a little, as if the paper is not quite lying still */
    function startBreath() {
        stopBreath();
        breath = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 1.9, ease: 'sine.inOut' } })
            .to(pA, { rotationX: -171, onUpdate: paint }, 0)
            .to(pC, { rotationX: 172,  onUpdate: paint }, 0.35);
        sway = gsap.to(sheet, { rotation: 0.5, y: -4, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }
    function stopBreath() {
        if (breath) { breath.kill(); breath = null; }
        if (sway)   { sway.kill();   sway = null; }
    }
    function lift(on) {                    // pointer rests on the paper: a corner lifts, as if inviting a hand
        if (state !== 'folded' || on === hoverOn) return;
        hoverOn = on;
        stopBreath();
        gsap.to(sheet, { rotation: 0, y: 0, duration: 0.4, ease: 'power2.out' });
        gsap.to(pA, { rotationX: on ? -156 : -180, duration: 0.5, ease: 'power2.out', onUpdate: paint,
                      onComplete: () => { if (!on && state === 'folded') startBreath(); } });
        gsap.to(pC, { rotationX: on ? 156 : 180, duration: 0.55, ease: 'power2.out', onUpdate: paint });
    }

    function petals() {
        if (typeof confetti !== 'function') return;
        const colors = ['#f6a9bd', '#e8839b', '#f9cfa8', '#d9b8f0', '#ffffff'];
        confetti({ particleCount: 36, spread: 80, startVelocity: 22, gravity: 0.7, ticks: 220, scalar: 0.9, origin: { y: 0.55 }, colors });
    }

    /* ---------- open the overlay: the folded sheet is set down in the middle of the screen ---------- */
    function open() {
        if (state !== 'closed') return;
        state = 'entering';
        sizeSheet();
        setFolded();
        makeFoldable();
        hoverOn = false;
        body.style.overflow = 'hidden';
        root.style.display = 'block';
        root.setAttribute('aria-hidden', 'false');

        gsap.set(backdrop, { autoAlpha: 0 });
        gsap.set(closeBtn, { autoAlpha: 0 });
        gsap.set(shadowEl, { autoAlpha: 0, y: 40 });

        if (reduce) {
            gsap.set(sheet, { autoAlpha: 1, y: 0, rotation: 0, scale: 1, rotationX: 0 });
            gsap.set([backdrop, closeBtn, shadowEl], { autoAlpha: 1, y: 0 });
            state = 'folded';
            sheet.focus({ preventScroll: true });
            return;
        }
        gsap.set(sheet, { autoAlpha: 0, y: -110, rotation: -6, scale: 1.12, rotationX: 16, transformOrigin: '50% 50%' });
        tl = gsap.timeline({ onComplete: () => { state = 'folded'; startBreath(); sheet.focus({ preventScroll: true }); } });
        tl.to(backdrop, { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, 0)
          .to(sheet, { autoAlpha: 1, y: 0, rotation: 0, scale: 1, rotationX: 0, duration: 1.0, ease: 'power3.out' }, 0.05)
          .to(shadowEl, { autoAlpha: 1, y: 3, duration: 1.0, ease: 'power3.out' }, 0.05)
          .to(sheet, { y: 0, duration: 0.01 }, 1.05)
          .to(closeBtn, { autoAlpha: 1, duration: 0.4 }, 0.7);
    }

    /* ---------- the paper unfolds ---------- */
    function unfold() {
        if (state !== 'folded') return;
        state = 'opening';
        stopBreath();
        gsap.killTweensOf([pA, pC, sheet]);
        makeReadable();

        if (reduce) { gsap.set([pA, pC], { rotationX: 0 }); paint(); finish(); return; }

        const settle = { rotation: 0, y: 0 };
        tl = gsap.timeline({ onComplete: finish });
        tl.to(sheet, { rotation: 0, y: 0, duration: 0.35, ease: 'power2.out' }, 0)
          // the top flap is lifted by its free edge and swung up and over, away from the middle
          .to(pA, { rotationX: -150, duration: 0.55, ease: 'power2.in', onUpdate: paint }, 0)
          .to(pA, { rotationX: 0,    duration: 1.35, ease: 'power2.inOut', onUpdate: paint }, 0.55)
          // a moment later the bottom flap follows, the way a second hand would
          .to(pC, { rotationX: 150,  duration: 0.55, ease: 'power2.in', onUpdate: paint }, 0.5)
          .to(pC, { rotationX: 0,    duration: 1.35, ease: 'power2.inOut', onUpdate: paint }, 1.05)
          // the paper's shadow widens as the sheet spreads out
          .to(shadowEl, { scaleY: 1, y: 0, duration: 1.9, ease: 'power2.inOut' }, 0.5)
          // the paper pushes down slightly as it lies flat
          .to(sheet, { scale: 1.012, y: 3, duration: 0.45, ease: 'power2.out' }, 2.0)
          .to(sheet, { scale: 1, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' }, 2.45);
    }

    function finish() {
        state = 'open';
        gsap.set([pA, pC], { rotationX: 0 });
        paint();
        read.style.visibility = 'visible';
        creases.style.opacity = 1;
        gsap.set([pA, pB, pC], { visibility: 'hidden' });
        sheet.classList.add('is-open');
        read.scrollTop = 0;
        read.focus({ preventScroll: true });
        if (!reduce) petals();
    }

    /* tap / click anywhere on the folded paper */
    sheet.addEventListener('click', (e) => { if (state === 'folded') { e.stopPropagation(); unfold(); } });
    sheet.addEventListener('keydown', (e) => {
        if (state === 'folded' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); unfold(); }
    });
    if (canHover) {
        sheet.addEventListener('pointerenter', () => lift(true));
        sheet.addEventListener('pointerleave', () => lift(false));
    }
    sheet.addEventListener('focus', () => { if (state === 'folded' && !canHover) return; });

    if (sticker) sticker.addEventListener('click', () => {
        if (reduce) return;
        gsap.fromTo(sticker, { rotation: -14, scale: 1.12 }, { rotation: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
    });

    /* ---------- close ---------- */
    function close() {
        if (state === 'closed') return;
        const wasState = state;
        state = 'closed';
        stopBreath();
        if (tl) tl.kill();
        gsap.killTweensOf([pA, pC, sheet, backdrop, shadowEl, closeBtn]);
        const done = () => {
            root.style.display = 'none';
            root.setAttribute('aria-hidden', 'true');
            body.style.overflow = '';
            gsap.set([sheet, backdrop, shadowEl, closeBtn], { clearProps: 'all' });
            trigger.focus({ preventScroll: true });
        };
        if (reduce) { done(); return; }
        gsap.to([sheet, shadowEl], { autoAlpha: 0, y: 40, scale: 0.97, duration: 0.4, ease: 'power2.in' });
        gsap.to([backdrop, closeBtn], { autoAlpha: 0, duration: 0.45, onComplete: done });
    }

    triggers.forEach((t) => t.addEventListener('click', () => { trigger = t; open(); }));
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    stage.addEventListener('click', (e) => { if (e.target === stage) close(); });   // empty space around the paper
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (state !== 'closed') sizeSheet(); });
}


document.addEventListener('DOMContentLoaded', initSecretLetter);

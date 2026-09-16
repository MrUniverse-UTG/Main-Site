// ─── Scroll reveal ───
//const revealEls = document.querySelectorAll('.reveal');
//const observer = new IntersectionObserver((entries) => {
//  entries.forEach((e, i) => {
//    if (e.isIntersecting) {
//      e.target.style.transitionDelay = (i % 4) * 0.1 + 's';
//      e.target.classList.add('visible');
//      observer.unobserve(e.target);
//    }
//  });
//}, { threshold: 0.12 });
//revealEls.forEach(el => observer.observe(el));

// ─── Solar System ───
(function() {
  const canvas = document.getElementById('solar-system');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;

  // Sun
  const SUN_R = 18;

  // Inner planets: { r: orbital radius, size, speed (rad/ms), color, angle }
  const innerPlanets = [
    { r: 34, size: 3.5, speed: 0.00090, color: '#4caf50', angle: 0.8,  ring: false, whiteRing: false, style: 'normal' },
    { r: 50, size: 4.5, speed: 0.00060, color: '#4488dd', angle: 2.1,  ring: false, whiteRing: true,  style: 'normal' },
    { r: 68, size: 5.5, speed: 0.00042, color: '#e8853a', angle: 4.3,  ring: false, whiteRing: false, style: 'normal' },
    { r: 86, size: 4.0, speed: 0.00030, color: '#7a5230', angle: 1.5,  ring: false, whiteRing: false, style: 'normal' },
  ];

  // Asteroid belt
  const BELT_INNER = 100, BELT_OUTER = 112;
  const asteroids = Array.from({ length: 80 }, () => ({
    r: BELT_INNER + Math.random() * (BELT_OUTER - BELT_INNER),
    angle: Math.random() * Math.PI * 2,
    size: Math.random() * 1.2 + 0.3,
    speed: 0.000018 + Math.random() * 0.000012,
  }));

  // Outer planets
  const outerPlanets = [
    { r: 130, size: 7.0, speed: 0.000180, color: '#3a1a5e', angle: 0.3,  ring: false, whiteRing: false, style: 'normal'    },
    { r: 152, size: 7.0, speed: 0.000120, color: '#3a7bd5', angle: 2.7,  ring: false, whiteRing: false, style: 'earth'     },
    { r: 172, size: 9.0, speed: 0.000085, color: '#cc3322', angle: 5.1,  ring: false, whiteRing: false, style: 'split'     },
    { r: 190, size: 6.0, speed: 0.000060, color: '#111111', angle: 3.8,  ring: false, whiteRing: false, style: 'corrupted' },
    { r: 206, size: 3.5, speed: 0.000042, color: '#9b59b6', angle: 1.2,  ring: false, whiteRing: false, style: 'normal'    },
  ];

  let last = null;

  function drawOrbit(r, alpha) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100,150,220,${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  function drawPlanet(p) {
    const x = cx + Math.cos(p.angle) * p.r;
    const y = cy + Math.sin(p.angle) * p.r;

    // glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2.5);
    grd.addColorStop(0, p.color + 'aa');
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, p.size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    if (p.style === 'split') {
      // Half red (sun-facing), half blue — rotate so red always points toward the sun
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.angle + Math.PI); // +Math.PI so +x axis points toward sun
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.clip();
      // red half: +x direction = toward sun
      ctx.fillStyle = '#cc3322';
      ctx.fillRect(0, -p.size, p.size, p.size * 2);
      // blue half: -x direction = away from sun
      ctx.fillStyle = '#3366cc';
      ctx.fillRect(-p.size, -p.size, p.size, p.size * 2);
      ctx.restore();
      // border
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

    } else if (p.style === 'earth') {
      // Blue base with green landmass patches
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#3a7bd5';
      ctx.fill();
      // landmass blobs
      const patches = [
        { ox: -p.size*0.2, oy: -p.size*0.3, rx: p.size*0.4, ry: p.size*0.3 },
        { ox:  p.size*0.3, oy:  p.size*0.1, rx: p.size*0.3, ry: p.size*0.35 },
        { ox: -p.size*0.1, oy:  p.size*0.35,rx: p.size*0.25,ry: p.size*0.2  },
      ];
      ctx.fillStyle = '#3a8a4a';
      patches.forEach(patch => {
        ctx.beginPath();
        ctx.ellipse(x + patch.ox, y + patch.oy, patch.rx, patch.ry, 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      // thin atmosphere ring
      ctx.beginPath();
      ctx.arc(x, y, p.size + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(120,180,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (p.style === 'corrupted') {
      // Dark cracked/corrupted look
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.clip();
      // dark base
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(x - p.size, y - p.size, p.size * 2, p.size * 2);
      // void cracks / purple corruption veins
      const veins = [
        [[-p.size*0.1, -p.size*0.8], [ p.size*0.3,  p.size*0.0], [-p.size*0.2,  p.size*0.7]],
        [[ p.size*0.6, -p.size*0.5], [-p.size*0.1,  p.size*0.2], [ p.size*0.4,  p.size*0.6]],
        [[-p.size*0.7,  p.size*0.1], [ p.size*0.0, -p.size*0.2]],
      ];
      ctx.strokeStyle = 'rgba(120,0,180,0.7)';
      ctx.lineWidth = 0.8;
      veins.forEach(v => {
        ctx.beginPath();
        ctx.moveTo(x + v[0][0], y + v[0][1]);
        for (let i = 1; i < v.length; i++) ctx.lineTo(x + v[i][0], y + v[i][1]);
        ctx.stroke();
      });
      ctx.restore();
      // outer corrupt glow
      const cGrd = ctx.createRadialGradient(x, y, p.size * 0.6, x, y, p.size * 2.2);
      cGrd.addColorStop(0, 'rgba(100,0,160,0.0)');
      cGrd.addColorStop(1, 'rgba(100,0,160,0.35)');
      ctx.beginPath();
      ctx.arc(x, y, p.size * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = cGrd;
      ctx.fill();

    } else {
      // Normal solid planet
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // White ring (planet 2)
    if (p.whiteRing) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.32);
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 1.9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(230,240,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Saturn-style golden ring (kept for any planet with ring:true)
    if (p.ring) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2.1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(210,175,100,0.5)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2.6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(210,175,100,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function frame(ts) {
    if (!last) last = ts;
    const dt = Math.min(ts - last, 50);
    last = ts;

    ctx.clearRect(0, 0, W, H);

    // Orbit rings
    innerPlanets.forEach(p => drawOrbit(p.r, 0.18));
    drawOrbit((BELT_INNER + BELT_OUTER) / 2, 0.10);
    outerPlanets.forEach(p => drawOrbit(p.r, 0.14));

    // Asteroids
    asteroids.forEach(a => {
      a.angle += a.speed * dt;
      const ax = cx + Math.cos(a.angle) * a.r;
      const ay = cy + Math.sin(a.angle) * a.r;
      ctx.beginPath();
      ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(160,145,120,0.55)';
      ctx.fill();
    });

    // Sun
    const sunGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, SUN_R * 3);
    sunGrd.addColorStop(0, '#fff7c0');
    sunGrd.addColorStop(0.3, '#ffcc44');
    sunGrd.addColorStop(0.7, 'rgba(255,160,30,0.3)');
    sunGrd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, SUN_R * 3, 0, Math.PI * 2);
    ctx.fillStyle = sunGrd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, SUN_R, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe566';
    ctx.fill();

    // Inner planets
    innerPlanets.forEach(p => {
      p.angle += p.speed * dt;
      drawPlanet(p);
    });

    // Outer planets
    outerPlanets.forEach(p => {
      p.angle += p.speed * dt;
      drawPlanet(p);
    });

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

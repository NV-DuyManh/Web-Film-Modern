import { createSpiderTilt } from './halloweenControls.js';

// Canvas artwork adapted from the reviewed demo, with scoped DOM access and effect cleanup.
export function startHalloweenSpider(root) {
  const controller = new AbortController();
  const listen = (target, event, handler, options = {}) => target.addEventListener(event, handler, { ...options, signal: controller.signal });
  const canvas = root.querySelector('.mfilm-halloween-spider');
  const ctx = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(any-pointer: fine)');
  const coarsePointer = matchMedia('(any-pointer: coarse)');
  const spider = { x: 0, y: 0, tx: 0, ty: 0, angle: 0, speed: 0, vx: 0, vy: 0 };
  let tiltTarget = null;
  const tilt = { x: 0, y: 0 };
  const tiltControl = createSpiderTilt({
    onDirection: direction => { tiltTarget = direction; if (!direction) { tilt.x = 0; tilt.y = 0; } },
  });
  let dimensions = { w: innerWidth, h: innerHeight };
  let legs = [];
  let simTime = 0;
  let stepGroup = 0;
  let stepCooldown = 0;
  let active = false;
  let animationFrame = 0;
  let previous = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = value => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const layout = [-1, -1, -1, -1, 1, 1, 1, 1];
  const bodyScale = () => innerWidth < 640 ? .42 : .56;
  const travelBounds = () => {
    if (coarsePointer.matches || innerWidth < 700) {
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
      return { left: left+38, right: left+(viewport?.width || dimensions.w)-38,
        top: top+38, bottom: top+(viewport?.height || dimensions.h)-38 };
    }
    return { left: 65, right: dimensions.w-65, top: 65, bottom: dimensions.h-65 };
  };
  const localPoint = (x, y) => {
    const c = Math.cos(spider.angle);
    const s = Math.sin(spider.angle);
    const z = bodyScale();
    return {
      x: spider.x + (x * c - y * s) * z,
      y: spider.y + (x * s + y * c) * z,
    };
  };
  const restFoot = i => {
    const side = layout[i];
    const [spread, forward] = [[58, -65], [76, -34], [78, 24], [61, 66]][i % 4];
    return localPoint(side * spread, forward);
  };
  const hipPoint = i => {
    const side = layout[i];
    return localPoint(side * 12, [-23, -16, -8, 0][i % 4]);
  };
  function initializeFeet() {
    legs = layout.map((_, i) => {
      const p = restFoot(i);
      return {
        x: p.x,
        y: p.y,
        from: p,
        to: p,
        swing: 0,
        moving: false,
        lift: 0,
        group: (i % 4 + (i > 3 ? 1 : 0)) % 2,
      };
    });
  }


  function resize() {
    dimensions = {w:innerWidth, h:innerHeight};
    const dpr = Math.min(devicePixelRatio||1, 2);
    canvas.width = dimensions.w*dpr;
    canvas.height = dimensions.h*dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spider.x = clamp(spider.x, 65, dimensions.w-65);
    spider.y = clamp(spider.y, 65, dimensions.h-65);
    spider.tx = clamp(spider.tx, 65, dimensions.w-65);
    spider.ty = clamp(spider.ty, 65, dimensions.h-65);
    initializeFeet();
    if (active && reducedMotion.matches) render();
  }


  function updateFeet(dt, moving) {
    if (!legs.length) initializeFeet();
    stepCooldown -= dt;
    for (const foot of legs) {
      if (!foot.moving) continue;
      foot.swing += dt / foot.duration;
      const t = clamp(foot.swing, 0, 1), e = smooth(t);
      foot.x = mix(foot.from.x, foot.to.x, e);
      foot.y = mix(foot.from.y, foot.to.y, e);
      foot.lift = Math.sin(t*Math.PI)*3.5*bodyScale();
      if (t>=1) {
        foot.moving = false;
        foot.lift = 0;
      }
    }
    if (stepCooldown > 0 || legs.some(foot => foot.moving)) return;
    for (let attempt = 0; attempt < 2; attempt++) {
      let changed = false;
      legs.forEach((foot, i) => {
        if (foot.group !== stepGroup) return;
        const desired = restFoot(i);
        const deviation = Math.hypot(foot.x-desired.x, foot.y-desired.y);
        if (deviation>(moving?15:10)*bodyScale()) {
          const lead = moving ? .12 : 0;
          foot.from = {x:foot.x, y:foot.y};
          foot.to = {x:desired.x+spider.vx*lead, y:desired.y+spider.vy*lead};
          foot.swing = -((i%4)*.035);
          foot.duration = moving ? .14 : .2;
          foot.moving = true;
          changed = true;
        }
      });
      stepGroup = 1-stepGroup;
      if (changed) {
        stepCooldown = .02;
        break;
      }
    }
  }


  function legKnee(i, tip, lift) {
    const side = layout[i];
    const [spread, y] = [[36, -54], [55, -40], [58, 12], [45, 45]][i%4];
    const bend = localPoint(side*spread, y), rest = restFoot(i);
    return {x:bend.x+(tip.x-rest.x)*.25, y:bend.y+(tip.y-rest.y)*.25-lift};
  }


  function drawLeg(i) {
    const foot = legs[i], hip = hipPoint(i), z = bodyScale();
    const tip = {x:foot.x, y:foot.y-foot.lift*.25};
    const knee = legKnee(i, tip, foot.lift);
    const dx = tip.x-knee.x, dy = tip.y-knee.y, length = Math.max(1, Math.hypot(dx, dy));
    const ankle = {x:mix(knee.x, tip.x, .76)-dy/length*z*2, y:mix(knee.y, tip.y, .76)+dx/length*z*2};
    function segment(a, b, rootRadius, endRadius) {
      const vx = b.x-a.x, vy = b.y-a.y, len = Math.max(1, Math.hypot(vx, vy));
      const nx = -vy/len, ny = vx/len, r1 = rootRadius*z*.8, r2 = endRadius*z*.8;
      const skin = ctx.createLinearGradient(a.x+nx*r1, a.y+ny*r1, a.x-nx*r1, a.y-ny*r1);
      skin.addColorStop(0, '#f0b67c');
      skin.addColorStop(.45, '#b57852');
      skin.addColorStop(1, '#654052');
      ctx.beginPath();
      ctx.moveTo(a.x+nx*r1, a.y+ny*r1);
      ctx.lineTo(b.x+nx*r2, b.y+ny*r2);
      ctx.quadraticCurveTo(b.x+vx/len*r2, b.y+vy/len*r2, b.x-nx*r2, b.y-ny*r2);
      ctx.lineTo(a.x-nx*r1, a.y-ny*r1);
      ctx.quadraticCurveTo(a.x-vx/len*r1, a.y-vy/len*r1, a.x+nx*r1, a.y+ny*r1);
      ctx.fillStyle = skin;
      ctx.shadowColor = '#ffad59';
      ctx.shadowBlur = 1.6;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffcf9690';
      ctx.lineWidth = .55;
      ctx.beginPath();
      ctx.moveTo(a.x+nx*r1*.45, a.y+ny*r1*.45);
      ctx.lineTo(b.x+nx*r2*.45, b.y+ny*r2*.45);
      ctx.stroke();
      ctx.strokeStyle = '#dbac8180';
      ctx.lineWidth = .45;
      for (let j = 1;j<=5;j++) {
        const t = j/7, r = mix(r1, r2, t), hair = (1.6+(j+i)%3*.6)*z;
        for (const side of [-1, 1]) {
          const x = mix(a.x, b.x, t)+nx*r*side, y = mix(a.y, b.y, t)+ny*r*side;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x+nx*hair*side-vx/len*z, y+ny*hair*side-vy/len*z);
          ctx.stroke();
        }
      }
    }
    segment(hip, knee, 4.6, 3.2);
    segment(knee, ankle, 2.8, 1.4);
    segment(ankle, tip, 1.3, .12);
    for (const [joint, next, r] of [[knee, ankle, 2.4], [ankle, tip, 1.25]]) {
      const angle = Math.atan2(next.y-joint.y, next.x-joint.x);
      ctx.fillStyle = '#4b2d30';
      ctx.beginPath();
      ctx.ellipse(joint.x, joint.y, r*z*.8, r*.62*z*.8, angle+Math.PI/2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#eab17a70';
      ctx.lineWidth = .5;
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, r*z*.8, angle+Math.PI*.6, angle+Math.PI*1.25);
      ctx.stroke();
    }
  }


  function drawBody() {
    const breath = reducedMotion.matches?0:Math.sin(simTime*2.5)*.45;
    ctx.save();
    ctx.translate(spider.x, spider.y);
    ctx.rotate(spider.angle);
    ctx.scale(bodyScale(), bodyScale());
    ctx.translate(0, breath);
    ctx.shadowColor = '#ffac56';
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 0;
    function segment(x, y, rx, ry) {
      const skin = ctx.createRadialGradient(x-rx*.35, y-ry*.3, 2, x, y, ry*1.1);
      skin.addColorStop(0, '#d5a078');
      skin.addColorStop(.4, '#a76850');
      skin.addColorStop(1, '#49324b');
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#f7b776a0';
      ctx.lineWidth = .6;
      for (let i = 0;i<76;i++) {
        const a = i*Math.PI*2/76, variation = Math.sin(i*7.31);
        const px = x+Math.cos(a)*rx*.94, py = y+Math.sin(a)*ry*.94;
        const length = 1.6+(variation+1)*1.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px+Math.cos(a+.16)*length, py+Math.sin(a+.16)*length);
        ctx.stroke();
      }
    }
    segment(0, 15, 25, 27);
    segment(0, -15, 12.5, 14);
    const glow = reducedMotion.matches?1:.88+Math.sin(simTime*2.1)*.12;
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.shadowColor = '#ffbe62';
    ctx.shadowBlur = 10;
    const markings = ctx.createLinearGradient(0, -6, 0, 39);
    markings.addColorStop(0, '#fff1b6');
    markings.addColorStop(.55, '#ffd17c');
    markings.addColorStop(1, '#ff9b53');
    ctx.fillStyle = markings;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-4, -1, -3, 5, -7, 8);
    ctx.quadraticCurveTo(-4, 11, -6, 15);
    ctx.quadraticCurveTo(-2, 19, -4, 23);
    ctx.quadraticCurveTo(-1, 28, 0, 36);
    ctx.quadraticCurveTo(1, 28, 4, 23);
    ctx.quadraticCurveTo(2, 19, 6, 15);
    ctx.quadraticCurveTo(4, 11, 7, 8);
    ctx.bezierCurveTo(3, 5, 4, -1, 0, -6);
    ctx.closePath();
    ctx.fill();
    for (const side of [-1, 1]) {
      for (let i = 0;i<4;i++) {
        const y = 1+i*8, spread = 16-Math.abs(i-1)*2;
        ctx.beginPath();
        ctx.moveTo(side*4, y+5);
        ctx.bezierCurveTo(side*8, y+2, side*(spread-3), y+4, side*spread, y-1);
        ctx.quadraticCurveTo(side*(spread+1), y+3, side*(spread-4), y+7);
        ctx.quadraticCurveTo(side*8, y+7, side*4, y+5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(side*18, 15, 1.2, 2.2, side*.25, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.shadowBlur = 3;
    ctx.strokeStyle = '#fff5cb';
    ctx.lineWidth = .7;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(-1, 8, 1, 20, 0, 32);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#f6c59145';
    ctx.lineWidth = .7;
    for (let i = 0;i<30;i++) {
      const a = i*2.399, r = 13+Math.sqrt(i/30)*8;
      const x = Math.cos(a)*r, y = 15+Math.sin(a)*r;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x+.5, y+2);
      ctx.stroke();
    }
    for (const [x, y, r] of [[-4, -24, 1.8], [4, -24, 1.8], [-9, -21, 1.1], [9, -21, 1.1], [-6, -27, 1], [6, -27, 1]]) {
      ctx.fillStyle = '#ffc079';
      ctx.shadowColor = '#ffad59';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e0c3a685';
      ctx.beginPath();
      ctx.arc(x-.4, y-.5, r*.3, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#80533d';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side*3, -26);
      ctx.quadraticCurveTo(side*10, -28, side*7, -35);
      ctx.quadraticCurveTo(side*3, -33, side*2, -29);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#dba16b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(side*10, -23);
      ctx.quadraticCurveTo(side*17, -29, side*13, -32);
      ctx.stroke();
    }
    ctx.restore();
  }


  function render() {
    ctx.clearRect(0, 0, dimensions.w, dimensions.h);
    for (let i = 0;i<legs.length;i++)drawLeg(i);
    drawBody();
  }


  function tick(now) {
    if (!active)return;
    const dt = Math.min((now-previous)/1000, .04);
    previous = now;
    simTime+=dt;
    const previousX = spider.x, previousY = spider.y;
    if (tiltTarget) {
      const bounds = travelBounds();
      const smoothing = 1-Math.exp(-dt*14);
      tilt.x = mix(tilt.x, tiltTarget.x, smoothing);
      tilt.y = mix(tilt.y, tiltTarget.y, smoothing);
      // Steering follows the tilt vector immediately. Turning the artwork must
      // never stall travel, especially when reversing at an edge.
      spider.x = clamp(spider.x + tilt.x * 230 * dt, bounds.left, bounds.right);
      spider.y = clamp(spider.y + tilt.y * 230 * dt, bounds.top, bounds.bottom);
      if (Math.hypot(tilt.x, tilt.y) > .02) {
        const facing = Math.atan2(tilt.y, tilt.x)+Math.PI/2;
        const turn = Math.atan2(Math.sin(facing-spider.angle), Math.cos(facing-spider.angle));
        spider.angle += turn * (1-Math.exp(-dt*12));
      }
      spider.tx = spider.x;
      spider.ty = spider.y;
    } else {
      const dx = spider.tx-spider.x, dy = spider.ty-spider.y, distance = Math.hypot(dx, dy);
      const facing = Math.atan2(dy, dx)+Math.PI/2;
      const turn = Math.atan2(Math.sin(facing-spider.angle), Math.cos(facing-spider.angle));
      if (distance>39)spider.angle+=clamp(turn, -dt*3.8, dt*3.8);
      const alignment = Math.max(0, Math.cos(turn));
      const desiredSpeed = distance>39?Math.min(225, (distance-38)*6)*alignment*alignment:0;
      spider.speed = mix(spider.speed, desiredSpeed, 1-Math.exp(-dt*9));
      const travel = Math.min(spider.speed*dt, Math.max(0, distance-38));
      if (travel>0) {
        spider.x+=Math.sin(spider.angle)*travel;
        spider.y-=Math.cos(spider.angle)*travel;
      }
    }
    spider.vx = (spider.x-previousX)/Math.max(dt, .001);
    spider.vy = (spider.y-previousY)/Math.max(dt, .001);
    updateFeet(dt, Math.hypot(spider.x-previousX, spider.y-previousY)>.06);
    render();
    animationFrame = requestAnimationFrame(tick);
  }


  function syncMode() {
    const enabled = root.classList.contains('night') && (finePointer.matches || coarsePointer.matches);
    if (root.classList.contains('night-exiting') && active) {
      const card = root.querySelector('.login-card').getBoundingClientRect();
      spider.tx = clamp(card.left-28, 65, innerWidth-65);
      spider.ty = clamp(card.bottom-85, 65, innerHeight-65);
      return;
    }
    if (enabled===active) {
      if (active && coarsePointer.matches && !reducedMotion.matches) tiltControl.start();
      return;
    }
    active = enabled;
    cancelAnimationFrame(animationFrame);
    canvas.classList.toggle('is-active', active);
    if (!active) {
      tiltControl.disable();
      ctx.clearRect(0, 0, dimensions.w, dimensions.h);
      return;
    }
    const mobile = coarsePointer.matches || innerWidth < 700;
    const card = root.querySelector(mobile ? '.scene-panel' : '.login-card').getBoundingClientRect();
    spider.x = spider.tx = clamp(mobile ? card.left+45 : card.left-28, 65, innerWidth-65);
    spider.y = spider.ty = clamp(mobile ? card.top+70 : card.bottom-85, 65, innerHeight-65);
    spider.angle = 0;
    spider.speed = 0;
    spider.vx = 0;
    spider.vy = 0;
    stepGroup = 0;
    stepCooldown = 0;
    initializeFeet();
    previous = performance.now();
    render();
    if (coarsePointer.matches && !reducedMotion.matches) tiltControl.start();
    if (!reducedMotion.matches)animationFrame = requestAnimationFrame(tick);
  }
  const point = event => {
    if (!active || root.classList.contains('night-exiting') || reducedMotion.matches || event.isPrimary === false)return;
    if (event.pointerType === 'touch' && (tiltTarget || !root.querySelector('.scene-panel').contains(event.target) || event.target.closest('button'))) return;
    const bounds = travelBounds();
    spider.tx = clamp(event.clientX, bounds.left, bounds.right);
    spider.ty = clamp(event.clientY, bounds.top, bounds.bottom);
  };
  listen(document, 'pointermove', point, {passive:true});
  listen(root, 'pointerdown', point, {passive:true});
  listen(document, 'visibilitychange', () => {
    cancelAnimationFrame(animationFrame);
    previous = performance.now();
    if (active && !document.hidden && !reducedMotion.matches)animationFrame = requestAnimationFrame(tick);
  });
  listen(reducedMotion, 'change', () => {
    cancelAnimationFrame(animationFrame);
    if (reducedMotion.matches) tiltControl.disable();
    else if (active && coarsePointer.matches) tiltControl.start();
    previous = performance.now();
    if (active && !reducedMotion.matches)animationFrame = requestAnimationFrame(tick);
  });
  listen(finePointer, 'change', syncMode);
  listen(coarsePointer, 'change', syncMode);
  const modeObserver = new MutationObserver(syncMode);
  modeObserver.observe(root, {attributes:true, attributeFilter:['class']});
  listen(window, 'resize', resize);
  resize();
  syncMode();
  return { destroy: () => {
    tiltControl.destroy();
    controller.abort();
    modeObserver.disconnect();
    cancelAnimationFrame(animationFrame);
    ctx.clearRect(0, 0, dimensions.w, dimensions.h);
  } };
}

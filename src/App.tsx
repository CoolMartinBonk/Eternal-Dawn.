import { useEffect, useRef, useCallback } from 'react';

interface Dot {
  x: number;
  y: number;
}

export function App() {
  const screenRef = useRef<HTMLCanvasElement>(null);
  const splashRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef({
    wide: 0,
    tall: 0,
    lumps: [] as Dot[],
    tick: 0,
    chooChoo: -700,
    noise: null as AudioContext | null,
    vol: null as GainNode | null,
    echo: null as ConvolverNode | null,
  });

  const makeGround = useCallback((wide: number, tall: number): Dot[] => {
    const dots: Dot[] = [];
    const chunks = 200;
    const flatLine = tall * 0.72;
    
    for (let i = 0; i <= chunks; i++) {
      const x = (i / chunks) * wide;
      const y = flatLine + Math.sin(i * 0.04) * 5 + Math.sin(i * 0.015 + 1) * 4 + Math.sin(i * 0.08) * 2;
      dots.push({ x, y });
    }
    return dots;
  }, []);

  const dirtLevel = useCallback((x: number): number => {
    const world = worldRef.current;
    const ratio = x / world.wide;
    const idx = ratio * (world.lumps.length - 1);
    const spot = Math.floor(idx);
    const mix = idx - spot;
    
    if (spot >= world.lumps.length - 1) return world.lumps[world.lumps.length - 1].y;
    if (spot < 0) return world.lumps[0].y;
    
    return world.lumps[spot].y * (1 - mix) + world.lumps[spot + 1].y * mix;
  }, []);

  const paintSky = useCallback((brush: CanvasRenderingContext2D, wide: number, tall: number) => {
    const flatLine = tall * 0.72;
    
    const void1 = brush.createLinearGradient(0, 0, 0, flatLine);
    void1.addColorStop(0, '#010103');
    void1.addColorStop(0.3, '#020306');
    void1.addColorStop(0.5, '#03050a');
    void1.addColorStop(0.65, '#050810');
    void1.addColorStop(0.8, '#0a0c18');
    void1.addColorStop(0.9, '#0f1020');
    void1.addColorStop(1, '#151525');
    
    brush.fillStyle = void1;
    brush.fillRect(0, 0, wide, tall);
  }, []);

  const paintStars = useCallback((brush: CanvasRenderingContext2D, wide: number, tall: number, tick: number) => {
    const flatLine = tall * 0.72;
    
    for (let i = 0; i < 100; i++) {
      const px = (Math.sin(i * 567.89 + 123) * 0.5 + 0.5) * wide;
      const py = (Math.sin(i * 123.45 + 456) * 0.5 + 0.5) * flatLine * 0.78;
      const blob = (Math.sin(i * 789.12) * 0.5 + 0.5) * 1.8 + 0.5;
      const blink = 0.12 + Math.sin(tick * 0.18 + i * 3.7) * 0.08;
      
      brush.fillStyle = `rgba(200, 210, 255, ${blink})`;
      brush.beginPath();
      brush.arc(px, py, blob, 0, Math.PI * 2);
      brush.fill();
    }
  }, []);

  const paintSunGlow = useCallback((brush: CanvasRenderingContext2D, wide: number, tall: number, tick: number) => {
    const midX = wide * 0.5;
    const flatLine = tall * 0.72;
    const orb = flatLine + 8;
    
    for (let i = 0; i < 10; i++) {
      const bigness = wide * (0.15 + i * 0.1);
      const fog = brush.createRadialGradient(midX, flatLine + 40, 0, midX, flatLine + 40, bigness);
      const fade = 0.012 - i * 0.001;
      fog.addColorStop(0, `rgba(255, 130, 70, ${fade})`);
      fog.addColorStop(0.15, `rgba(240, 110, 55, ${fade * 0.85})`);
      fog.addColorStop(0.3, `rgba(220, 90, 45, ${fade * 0.7})`);
      fog.addColorStop(0.45, `rgba(180, 70, 38, ${fade * 0.55})`);
      fog.addColorStop(0.6, `rgba(140, 55, 32, ${fade * 0.4})`);
      fog.addColorStop(0.75, `rgba(100, 40, 28, ${fade * 0.25})`);
      fog.addColorStop(0.9, `rgba(60, 28, 22, ${fade * 0.1})`);
      fog.addColorStop(1, 'rgba(30, 15, 15, 0)');
      brush.fillStyle = fog;
      brush.fillRect(0, 0, wide, tall);
    }

    const stripe = brush.createLinearGradient(0, flatLine - 250, 0, flatLine + 30);
    stripe.addColorStop(0, 'rgba(30, 15, 25, 0)');
    stripe.addColorStop(0.2, 'rgba(40, 20, 30, 0.01)');
    stripe.addColorStop(0.35, 'rgba(55, 28, 32, 0.02)');
    stripe.addColorStop(0.5, 'rgba(75, 38, 36, 0.035)');
    stripe.addColorStop(0.65, 'rgba(100, 50, 42, 0.055)');
    stripe.addColorStop(0.78, 'rgba(130, 65, 48, 0.08)');
    stripe.addColorStop(0.88, 'rgba(160, 80, 55, 0.1)');
    stripe.addColorStop(0.95, 'rgba(185, 95, 62, 0.115)');
    stripe.addColorStop(1, 'rgba(200, 105, 68, 0.12)');
    brush.fillStyle = stripe;
    brush.fillRect(0, flatLine - 250, wide, 280);

    const haze = brush.createRadialGradient(midX, flatLine, 0, midX, flatLine, wide * 0.55);
    haze.addColorStop(0, 'rgba(255, 190, 130, 0.16)');
    haze.addColorStop(0.08, 'rgba(255, 170, 110, 0.12)');
    haze.addColorStop(0.18, 'rgba(245, 150, 95, 0.08)');
    haze.addColorStop(0.3, 'rgba(220, 120, 75, 0.05)');
    haze.addColorStop(0.45, 'rgba(180, 90, 58, 0.028)');
    haze.addColorStop(0.6, 'rgba(140, 65, 45, 0.015)');
    haze.addColorStop(0.75, 'rgba(100, 45, 35, 0.006)');
    haze.addColorStop(0.9, 'rgba(60, 30, 28, 0.002)');
    haze.addColorStop(1, 'rgba(40, 20, 20, 0)');
    
    brush.save();
    brush.translate(midX, flatLine);
    brush.scale(2.8, 0.14);
    brush.translate(-midX, -flatLine);
    brush.fillStyle = haze;
    brush.fillRect(0, 0, wide, tall);
    brush.restore();

    const rings = [
      { bigness: 500, r: 255, g: 75, b: 35, glow: 0.01 },
      { bigness: 400, r: 255, g: 85, b: 42, glow: 0.018 },
      { bigness: 320, r: 255, g: 98, b: 50, glow: 0.028 },
      { bigness: 250, r: 255, g: 115, b: 58, glow: 0.04 },
      { bigness: 190, r: 255, g: 135, b: 70, glow: 0.055 },
      { bigness: 140, r: 255, g: 155, b: 85, glow: 0.075 },
      { bigness: 100, r: 255, g: 178, b: 105, glow: 0.1 },
      { bigness: 70, r: 255, g: 200, b: 125, glow: 0.14 },
      { bigness: 45, r: 255, g: 218, b: 155, glow: 0.2 },
      { bigness: 28, r: 255, g: 235, b: 185, glow: 0.3 },
    ];

    rings.forEach(ring => {
      const aura = brush.createRadialGradient(midX, orb, 0, midX, orb, ring.bigness);
      aura.addColorStop(0, `rgba(${ring.r}, ${ring.g}, ${ring.b}, ${ring.glow})`);
      aura.addColorStop(0.15, `rgba(${ring.r}, ${ring.g}, ${ring.b}, ${ring.glow * 0.75})`);
      aura.addColorStop(0.3, `rgba(${ring.r}, ${ring.g}, ${ring.b}, ${ring.glow * 0.55})`);
      aura.addColorStop(0.45, `rgba(${ring.r}, ${ring.g}, ${ring.b}, ${ring.glow * 0.38})`);
      aura.addColorStop(0.6, `rgba(${ring.r}, ${ring.g}, ${ring.b}, ${ring.glow * 0.22})`);
      aura.addColorStop(0.75, `rgba(${ring.r}, ${ring.g}, ${ring.b}, ${ring.glow * 0.1})`);
      aura.addColorStop(0.9, `rgba(${ring.r}, ${ring.g}, ${ring.b}, ${ring.glow * 0.03})`);
      aura.addColorStop(1, `rgba(${ring.r}, ${ring.g}, ${ring.b}, 0)`);
      brush.fillStyle = aura;
      brush.beginPath();
      brush.arc(midX, orb, ring.bigness, 0, Math.PI * 2);
      brush.fill();
    });

    const sunBlob = 28;
    const throb = 1 + Math.sin(tick * 0.12) * 0.012;
    
    const yolk = brush.createRadialGradient(midX, orb, 0, midX, orb, sunBlob * 2.5 * throb);
    yolk.addColorStop(0, 'rgba(255, 255, 252, 0.98)');
    yolk.addColorStop(0.08, 'rgba(255, 254, 248, 0.92)');
    yolk.addColorStop(0.18, 'rgba(255, 250, 235, 0.75)');
    yolk.addColorStop(0.3, 'rgba(255, 242, 215, 0.55)');
    yolk.addColorStop(0.45, 'rgba(255, 228, 190, 0.35)');
    yolk.addColorStop(0.6, 'rgba(255, 210, 165, 0.2)');
    yolk.addColorStop(0.75, 'rgba(255, 190, 140, 0.1)');
    yolk.addColorStop(0.9, 'rgba(255, 170, 118, 0.03)');
    yolk.addColorStop(1, 'rgba(255, 150, 100, 0)');
    brush.fillStyle = yolk;
    brush.beginPath();
    brush.arc(midX, orb, sunBlob * 3 * throb, 0, Math.PI * 2);
    brush.fill();

    const hot = brush.createRadialGradient(midX, orb, 0, midX, orb, sunBlob);
    hot.addColorStop(0, 'rgba(255, 255, 255, 1)');
    hot.addColorStop(0.2, 'rgba(255, 254, 252, 0.95)');
    hot.addColorStop(0.4, 'rgba(255, 252, 245, 0.78)');
    hot.addColorStop(0.55, 'rgba(255, 248, 232, 0.55)');
    hot.addColorStop(0.7, 'rgba(255, 242, 218, 0.32)');
    hot.addColorStop(0.85, 'rgba(255, 235, 205, 0.12)');
    hot.addColorStop(1, 'rgba(255, 228, 195, 0)');
    brush.fillStyle = hot;
    brush.beginPath();
    brush.arc(midX, orb, sunBlob, 0, Math.PI * 2);
    brush.fill();
  }, []);

  const paintGround = useCallback((brush: CanvasRenderingContext2D, wide: number, tall: number, lumps: Dot[]) => {
    const flatLine = tall * 0.72;
    
    const rim = brush.createLinearGradient(0, flatLine - 15, 0, flatLine + 5);
    rim.addColorStop(0, 'rgba(180, 100, 70, 0)');
    rim.addColorStop(0.6, 'rgba(150, 80, 50, 0.06)');
    rim.addColorStop(1, 'rgba(100, 50, 40, 0)');
    brush.fillStyle = rim;
    brush.fillRect(0, flatLine - 15, wide, 20);

    brush.fillStyle = '#030303';
    brush.beginPath();
    brush.moveTo(0, tall);
    lumps.forEach(p => brush.lineTo(p.x, p.y));
    brush.lineTo(wide, tall);
    brush.closePath();
    brush.fill();
  }, []);

  const paintTrain = useCallback((brush: CanvasRenderingContext2D, trainPos: number, tick: number) => {
    const zoom = 1.1;
    const boxCount = 7;
    const locoLen = 120;
    const coalLen = 50;
    const boxLen = 55;
    const gappo = 24;
    
    const wobble = (idx: number): { y: number; tilt: number } => {
      const wave1 = 2.8 + idx * 0.25;
      const shift = idx * 1.8;
      
      const bounce1 = Math.abs(Math.sin(tick * wave1 + shift)) * 1.2;
      const bounce2 = Math.abs(Math.sin(tick * wave1 * 1.6 + shift * 0.6)) * 0.8;
      const bounce3 = Math.abs(Math.sin(tick * wave1 * 0.4 + shift * 2.2)) * 0.5;
      
      const yoff = -(bounce1 + bounce2 + bounce3);
      
      const tilt = Math.sin(tick * wave1 * 0.7 + shift) * 0.015 +
                   Math.sin(tick * wave1 * 1.2 + shift * 1.3) * 0.01;
      
      return { y: yoff, tilt };
    };
    
    const locoJiggle = wobble(0);
    const coalJiggle = wobble(1);
    const boxJiggles = [];
    for (let c = 0; c < boxCount; c++) {
      boxJiggles.push(wobble(c + 2));
    }
    
    const locoBackX = trainPos + locoLen * 0.9;
    const locoBackY = dirtLevel(locoBackX) - 18 * zoom + locoJiggle.y * zoom;
    
    const coalFrontX = trainPos + locoLen + 5;
    const coalFrontY = dirtLevel(coalFrontX) - 18 * zoom + coalJiggle.y * zoom;
    
    const coalBackX = trainPos + locoLen + coalLen - 5;
    const coalBackY = dirtLevel(coalBackX) - 18 * zoom + coalJiggle.y * zoom;
    
    const boxSpots = [];
    for (let c = 0; c < boxCount; c++) {
      const offset = locoLen + coalLen + c * (boxLen + gappo);
      const frontX = trainPos + offset + 5;
      const backX = trainPos + offset + boxLen - 5;
      const frontY = dirtLevel(frontX) - 18 * zoom + boxJiggles[c].y * zoom;
      const backY = dirtLevel(backX) - 18 * zoom + boxJiggles[c].y * zoom;
      boxSpots.push({ frontX, frontY, backX, backY, jiggle: boxJiggles[c] });
    }
    
    brush.strokeStyle = '#0a0a0a';
    brush.lineWidth = 3 * zoom;
    
    brush.beginPath();
    brush.moveTo(locoBackX, locoBackY);
    brush.lineTo(coalFrontX, coalFrontY);
    brush.stroke();
    
    brush.beginPath();
    brush.moveTo(coalBackX, coalBackY);
    brush.lineTo(boxSpots[0].frontX, boxSpots[0].frontY);
    brush.stroke();
    
    for (let c = 0; c < boxCount - 1; c++) {
      brush.beginPath();
      brush.moveTo(boxSpots[c].backX, boxSpots[c].backY);
      brush.lineTo(boxSpots[c + 1].frontX, boxSpots[c + 1].frontY);
      brush.stroke();
    }
    
    for (let c = boxCount - 1; c >= 0; c--) {
      const offset = locoLen + coalLen + c * (boxLen + gappo);
      const boxMidX = trainPos + offset + boxLen / 2;
      const boxFloorY = dirtLevel(boxMidX);
      const jiggle = boxJiggles[c];
      const lean = Math.atan2(
        dirtLevel(boxMidX + 15) - dirtLevel(boxMidX - 15),
        30
      ) + jiggle.tilt;
      
      brush.save();
      brush.translate(boxMidX, boxFloorY + jiggle.y * zoom);
      brush.rotate(lean);
      brush.scale(zoom, zoom);
      
      brush.fillStyle = '#080808';
      brush.fillRect(-boxLen / 2, -35, boxLen, 25);
      
      brush.fillStyle = '#050505';
      brush.fillRect(-boxLen / 2 + 5, -10, boxLen - 10, 8);
      
      brush.fillStyle = '#060606';
      brush.beginPath();
      brush.moveTo(-boxLen / 2 + 3, -35);
      brush.quadraticCurveTo(0, -44, boxLen / 2 - 3, -35);
      brush.fill();
      
      const panes = 4;
      const paneW = 8;
      const paneH = 12;
      const gap = (boxLen - 16) / panes;
      
      for (let w = 0; w < panes; w++) {
        const wx = -boxLen / 2 + 10 + w * gap;
        const wy = -32;
        
        const shimmer = 0.75 + Math.sin(tick * 2 + c * 0.5 + w * 0.3) * 0.12 + Math.sin(tick * 5.7 + w * 2) * 0.08;
        
        const gleam = brush.createRadialGradient(
          wx + paneW / 2, wy + paneH / 2, 0, 
          wx + paneW / 2, wy + paneH / 2, 20
        );
        gleam.addColorStop(0, `rgba(255, 200, 120, ${0.35 * shimmer})`);
        gleam.addColorStop(0.5, `rgba(255, 160, 80, ${0.15 * shimmer})`);
        gleam.addColorStop(1, 'rgba(255, 120, 60, 0)');
        brush.fillStyle = gleam;
        brush.beginPath();
        brush.arc(wx + paneW / 2, wy + paneH / 2, 20, 0, Math.PI * 2);
        brush.fill();
        
        brush.fillStyle = '#0a0a0a';
        brush.fillRect(wx - 1, wy - 1, paneW + 2, paneH + 2);
        
        const warmth = brush.createLinearGradient(wx, wy, wx, wy + paneH);
        warmth.addColorStop(0, `rgba(255, 225, 170, ${0.95 * shimmer})`);
        warmth.addColorStop(0.5, `rgba(255, 210, 145, ${shimmer})`);
        warmth.addColorStop(1, `rgba(255, 190, 120, ${0.9 * shimmer})`);
        brush.fillStyle = warmth;
        brush.fillRect(wx, wy, paneW, paneH);
      }
      
      brush.fillStyle = '#000000';
      brush.beginPath();
      brush.arc(-boxLen / 3, -5, 8, 0, Math.PI * 2);
      brush.arc(boxLen / 3, -5, 8, 0, Math.PI * 2);
      brush.fill();
      
      brush.restore();
    }
    
    const coalMidX = trainPos + locoLen + coalLen / 2;
    const coalFloorY = dirtLevel(coalMidX);
    const coalLean = Math.atan2(
      dirtLevel(coalMidX + 15) - dirtLevel(coalMidX - 15),
      30
    ) + coalJiggle.tilt;
    
    brush.save();
    brush.translate(coalMidX, coalFloorY + coalJiggle.y * zoom);
    brush.rotate(coalLean);
    brush.scale(zoom, zoom);
    
    brush.fillStyle = '#070707';
    brush.fillRect(-coalLen / 2, -38, coalLen, 28);
    
    brush.fillStyle = '#030303';
    brush.beginPath();
    brush.moveTo(-coalLen / 2 + 5, -38);
    brush.quadraticCurveTo(0, -50, coalLen / 2 - 5, -38);
    brush.fill();
    
    brush.fillStyle = '#000000';
    brush.beginPath();
    brush.arc(-coalLen / 4, -5, 9, 0, Math.PI * 2);
    brush.arc(coalLen / 4, -5, 9, 0, Math.PI * 2);
    brush.fill();
    
    brush.restore();
    
    const locoMidX = trainPos + locoLen / 2;
    const locoFloorY = dirtLevel(locoMidX);
    const locoLean = Math.atan2(
      dirtLevel(locoMidX + 20) - dirtLevel(locoMidX - 20),
      40
    ) + locoJiggle.tilt * 0.5;
    
    brush.save();
    brush.translate(locoMidX, locoFloorY + locoJiggle.y * zoom * 0.5);
    brush.rotate(locoLean);
    brush.scale(zoom, zoom);
    
    brush.fillStyle = '#000000';
    
    brush.fillRect(-50, -35, 95, 25);
    
    brush.beginPath();
    brush.ellipse(-10, -28, 42, 18, 0, Math.PI, 0);
    brush.fill();
    
    brush.fillRect(28, -65, 30, 40);
    
    const cabShimmer = 0.8 + Math.sin(tick * 1.5) * 0.1;
    brush.fillStyle = `rgba(255, 200, 130, ${0.75 * cabShimmer})`;
    brush.fillRect(32, -58, 10, 14);
    brush.fillRect(46, -58, 10, 14);
    
    const cabAura = brush.createRadialGradient(42, -50, 0, 42, -50, 35);
    cabAura.addColorStop(0, `rgba(255, 180, 100, ${0.25 * cabShimmer})`);
    cabAura.addColorStop(0.6, `rgba(255, 150, 80, ${0.1 * cabShimmer})`);
    cabAura.addColorStop(1, 'rgba(255, 150, 80, 0)');
    brush.fillStyle = cabAura;
    brush.beginPath();
    brush.arc(42, -50, 35, 0, Math.PI * 2);
    brush.fill();
    
    brush.fillStyle = '#000000';
    
    brush.fillRect(-38, -60, 12, 28);
    brush.beginPath();
    brush.moveTo(-42, -60);
    brush.lineTo(-30, -60);
    brush.lineTo(-26, -68);
    brush.lineTo(-46, -68);
    brush.closePath();
    brush.fill();
    
    brush.beginPath();
    brush.ellipse(5, -46, 10, 8, 0, Math.PI, 0);
    brush.fill();
    
    brush.beginPath();
    brush.arc(-35, -5, 12, 0, Math.PI * 2);
    brush.arc(0, -5, 12, 0, Math.PI * 2);
    brush.arc(35, -5, 10, 0, Math.PI * 2);
    brush.fill();
    
    brush.beginPath();
    brush.moveTo(-60, -10);
    brush.lineTo(-80, 8);
    brush.lineTo(-60, 8);
    brush.closePath();
    brush.fill();
    
    const beam = brush.createRadialGradient(-60, -20, 0, -60, -20, 50);
    beam.addColorStop(0, 'rgba(255, 250, 220, 0.5)');
    beam.addColorStop(0.15, 'rgba(255, 240, 200, 0.3)');
    beam.addColorStop(0.4, 'rgba(255, 220, 170, 0.1)');
    beam.addColorStop(0.7, 'rgba(255, 200, 140, 0.03)');
    beam.addColorStop(1, 'rgba(255, 180, 120, 0)');
    brush.fillStyle = beam;
    brush.beginPath();
    brush.arc(-60, -20, 50, 0, Math.PI * 2);
    brush.fill();
    
    brush.fillStyle = 'rgba(255, 252, 240, 0.95)';
    brush.beginPath();
    brush.arc(-55, -20, 4, 0, Math.PI * 2);
    brush.fill();
    
    for (let i = 0; i < 10; i++) {
      const puff = (tick * 1.5 + i * 0.5) % 5;
      const puffX = -38 + Math.sin(tick * 0.8 + i * 1.5) * 8;
      const puffY = -68 - puff * 25;
      const puffBlob = 6 + puff * 10;
      const puffFade = Math.max(0, 0.15 - puff * 0.03);
      
      brush.fillStyle = `rgba(100, 95, 85, ${puffFade})`;
      brush.beginPath();
      brush.arc(puffX, puffY, puffBlob, 0, Math.PI * 2);
      brush.fill();
    }
    
    brush.restore();
  }, [dirtLevel]);

  const bootNoise = useCallback(() => {
    const world = worldRef.current;
    world.noise = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    world.echo = world.noise.createConvolver();
    const echoTime = 12;
    const rate = world.noise.sampleRate;
    const samples = rate * echoTime;
    const buffer = world.noise.createBuffer(2, samples, rate);
    
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < samples; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples, 2.5) * 0.4;
      }
    }
    world.echo.buffer = buffer;
    
    world.vol = world.noise.createGain();
    world.vol.gain.value = 0.65;
    world.vol.connect(world.noise.destination);
    
    const echoGain = world.noise.createGain();
    echoGain.gain.value = 0.9;
    world.echo.connect(echoGain);
    echoGain.connect(world.vol);
    
    makeDrones(world);
    makePads(world);
    makeTunes(world);
    makeWhistle(world);
  }, []);

  const makeDrones = (world: typeof worldRef.current) => {
    if (!world.noise || !world.vol || !world.echo) return;
    
    const hums = [55, 82.5, 110, 165];
    
    hums.forEach((buzz, idx) => {
      const wave = world.noise!.createOscillator();
      const loud = world.noise!.createGain();
      const muff = world.noise!.createBiquadFilter();
      
      wave.type = 'sine';
      wave.frequency.value = buzz;
      
      muff.type = 'lowpass';
      muff.frequency.value = 200;
      muff.Q.value = 0.3;
      
      loud.gain.value = 0;
      
      wave.connect(muff);
      muff.connect(loud);
      loud.connect(world.echo!);
      loud.connect(world.vol!);
      
      wave.start();
      
      const targetLoud = 0.18 - idx * 0.03;
      const ramp = 15 + idx * 5;
      loud.gain.linearRampToValueAtTime(targetLoud, world.noise!.currentTime + ramp);
      
      const breathe = () => {
        if (!world.noise) return;
        const now = world.noise.currentTime;
        const wait = 25 + Math.random() * 30;
        const wobble = targetLoud * (0.75 + Math.random() * 0.35);
        loud.gain.linearRampToValueAtTime(wobble, now + wait);
        setTimeout(breathe, wait * 1000);
      };
      setTimeout(breathe, ramp * 1000);
    });
  };

  const makePads = (world: typeof worldRef.current) => {
    if (!world.noise || !world.echo) return;
    
    const tones = [220, 277.18, 329.63, 440, 523.25];
    
    tones.forEach((freq, idx) => {
      setTimeout(() => {
        if (!world.noise || !world.echo) return;
        
        const wave1 = world.noise.createOscillator();
        const wave2 = world.noise.createOscillator();
        const loud = world.noise.createGain();
        const muff = world.noise.createBiquadFilter();
        
        wave1.type = 'sine';
        wave1.frequency.value = freq;
        wave2.type = 'sine';
        wave2.frequency.value = freq * 1.003;
        
        muff.type = 'lowpass';
        muff.frequency.value = 500;
        
        loud.gain.value = 0;
        
        wave1.connect(muff);
        wave2.connect(muff);
        muff.connect(loud);
        loud.connect(world.echo!);
        
        wave1.start();
        wave2.start();
        
        const targetLoud = 0.06 - idx * 0.008;
        loud.gain.linearRampToValueAtTime(targetLoud, world.noise.currentTime + 20);
        
        const drift = () => {
          if (!world.noise) return;
          const now = world.noise.currentTime;
          const wait = 30 + Math.random() * 40;
          loud.gain.linearRampToValueAtTime(targetLoud * (0.6 + Math.random() * 0.5), now + wait);
          muff.frequency.linearRampToValueAtTime(300 + Math.random() * 250, now + wait);
          setTimeout(drift, wait * 1000);
        };
        setTimeout(drift, 20000);
      }, 5000 + idx * 4000);
    });
  };

  const makeTunes = (world: typeof worldRef.current) => {
    const playNote = () => {
      if (!world.noise || !world.echo) return;
      
      const wave = world.noise.createOscillator();
      const loud = world.noise.createGain();
      const muff = world.noise.createBiquadFilter();
      
      const pitches = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
      wave.frequency.value = pitches[Math.floor(Math.random() * pitches.length)];
      wave.type = 'sine';
      
      muff.type = 'lowpass';
      muff.frequency.value = 600;
      muff.Q.value = 0.3;
      
      const now = world.noise.currentTime;
      const rise = 8;
      const hold = 12;
      const fall = 15;
      
      loud.gain.value = 0;
      loud.gain.linearRampToValueAtTime(0.035, now + rise);
      loud.gain.linearRampToValueAtTime(0.025, now + rise + hold);
      loud.gain.linearRampToValueAtTime(0, now + rise + hold + fall);
      
      wave.connect(muff);
      muff.connect(loud);
      loud.connect(world.echo!);
      
      wave.start(now);
      wave.stop(now + rise + hold + fall + 5);
      
      setTimeout(playNote, 25000 + Math.random() * 35000);
    };
    
    setTimeout(playNote, 15000);
  };

  const makeWhistle = (world: typeof worldRef.current) => {
    if (!world.noise || !world.vol || !world.echo) return;
    
    const locoLen = 120;
    const coalLen = 50;
    const boxLen = 55;
    const gappo = 24;
    const boxCount = 7;
    const zoom = 1.1;
    const snakeLen = (locoLen + coalLen + boxCount * (boxLen + gappo)) * zoom;
    
    const toot = () => {
      if (!world.noise || !world.echo || !world.vol) return;
      
      const nowX = worldRef.current.chooChoo;
      const nowWide = worldRef.current.wide;
      
      const snoot = nowX;
      const butt = nowX + snakeLen;
      
      const visible = butt > 0 && snoot < nowWide;
      
      if (visible && world.noise) {
        const basePitch = 260 + Math.random() * 50;
        
        const wave1 = world.noise.createOscillator();
        const wave2 = world.noise.createOscillator();
        const wave3 = world.noise.createOscillator();
        const wave4 = world.noise.createOscillator();
        const loud = world.noise.createGain();
        const muff = world.noise.createBiquadFilter();
        
        wave1.type = 'sine';
        wave1.frequency.value = basePitch;
        wave2.type = 'sine';
        wave2.frequency.value = basePitch * 1.498;
        wave3.type = 'sine';
        wave3.frequency.value = basePitch * 2.01;
        wave4.type = 'triangle';
        wave4.frequency.value = basePitch * 0.5;
        
        muff.type = 'lowpass';
        muff.frequency.value = 800;
        muff.Q.value = 0.8;
        
        const now = world.noise.currentTime;
        
        loud.gain.value = 0;
        loud.gain.linearRampToValueAtTime(0.06, now + 2);
        loud.gain.linearRampToValueAtTime(0.05, now + 5);
        loud.gain.linearRampToValueAtTime(0.04, now + 8);
        loud.gain.linearRampToValueAtTime(0, now + 12);
        
        wave1.frequency.linearRampToValueAtTime(basePitch * 0.96, now + 10);
        wave2.frequency.linearRampToValueAtTime(basePitch * 1.498 * 0.96, now + 10);
        wave3.frequency.linearRampToValueAtTime(basePitch * 2.01 * 0.96, now + 10);
        wave4.frequency.linearRampToValueAtTime(basePitch * 0.5 * 0.96, now + 10);
        
        wave1.connect(muff);
        wave2.connect(muff);
        wave3.connect(muff);
        wave4.connect(muff);
        muff.connect(loud);
        loud.connect(world.echo!);
        loud.connect(world.vol!);
        
        wave1.start(now);
        wave2.start(now);
        wave3.start(now);
        wave4.start(now);
        wave1.stop(now + 15);
        wave2.stop(now + 15);
        wave3.stop(now + 15);
        wave4.stop(now + 15);
      }
      
      const nextCheck = visible ? 20000 + Math.random() * 15000 : 8000 + Math.random() * 8000;
      setTimeout(toot, nextCheck);
    };
    
    setTimeout(toot, 3000);
  };

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    
    const brush = screen.getContext('2d');
    if (!brush) return;
    
    const world = worldRef.current;
    
    const fit = () => {
      world.wide = screen.width = window.innerWidth;
      world.tall = screen.height = window.innerHeight;
      world.lumps = makeGround(world.wide, world.tall);
    };
    
    fit();
    window.addEventListener('resize', fit);
    
    let loopId: number;
    
    const loop = () => {
      world.tick += 0.016;
      
      brush.clearRect(0, 0, world.wide, world.tall);
      
      paintSky(brush, world.wide, world.tall);
      paintStars(brush, world.wide, world.tall, world.tick);
      paintSunGlow(brush, world.wide, world.tall, world.tick);
      paintGround(brush, world.wide, world.tall, world.lumps);
      paintTrain(brush, world.chooChoo, world.tick);
      
      world.chooChoo += 0.6;
      const zoom = 1.1;
      const snakeLen = (120 + 50 + 7 * (55 + 24)) * zoom;
      if (world.chooChoo > world.wide + 150) {
        world.chooChoo = -snakeLen - 100;
      }
      
      loopId = requestAnimationFrame(loop);
    };
    
    loop();
    
    return () => {
      window.removeEventListener('resize', fit);
      cancelAnimationFrame(loopId);
    };
  }, [makeGround, paintSky, paintStars, paintSunGlow, paintGround, paintTrain]);

  const kickoff = () => {
    if (splashRef.current) {
      splashRef.current.style.opacity = '0';
      setTimeout(() => {
        if (splashRef.current) {
          splashRef.current.style.display = 'none';
        }
      }, 3000);
    }
    bootNoise();
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <canvas ref={screenRef} className="block w-full h-full" />
      <div
        ref={splashRef}
        onClick={kickoff}
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-[3000ms]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      >
        <h1 className="text-white text-4xl md:text-6xl font-light tracking-[0.3em] mb-8 opacity-80">
          Eternal Dawn
        </h1>
        <p className="text-white text-lg md:text-xl tracking-[0.2em] opacity-50 mb-12">
          
        </p>
        <div className="text-white text-sm tracking-[0.15em] opacity-30 animate-pulse">
          click anywhere to begin
        </div>
      </div>
    </div>
  );
}

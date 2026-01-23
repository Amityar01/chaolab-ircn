'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const DIM = { width: 560, height: 420 };
const SENSE_RADIUS = 135;
const NUM_RAYS = 34;
const FOV_ANGLE = Math.PI * 0.78;

const MIN_HALF = 12;
const MAX_OBJECTS = 8;

const EDGE_LERP = 0.22;
const CENTER_LERP = 0.12;
const VEL_LERP = 0.18;

const MATCH_DIST = 95;
const RUN_DIST_JITTER = 18;
const RUN_POINT_JITTER = 26;

const OMISSION_TRIGGER = 0.55;
const COMMISSION_TRIGGER = 0.65;
const SURPRISE_MS = 900;

type SurpriseType = 'prediction' | 'omission' | null;

type Point = { x: number; y: number };

type WorldRect = { id: number; x: number; y: number; width: number; height: number };

type RecognizedObject = {
  id: number;
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  velX: number;
  velY: number;
  confidence: number;
  lastSeen: number;
  inView: boolean;
  seenLeft: boolean;
  seenRight: boolean;
  seenTop: boolean;
  seenBottom: boolean;
  omissionEvidence: number;
  commissionEvidence: number;
};

type Tadpole = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  objects: RecognizedObject[];
  surpriseType: SurpriseType;
  surpriseTime: number;
  surprisePos: Point | null;
};

type RayRec = {
  angle: number;
  dirX: number;
  dirY: number;
  obsHit: Point | null;
  obsDist: number;
  predHit: Point | null;
  predDist: number;
  predObjId: number | null;
  err: number;
};

type Measurement = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  strength: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hypot = (dx: number, dy: number) => Math.sqrt(dx * dx + dy * dy);

const pointInFOV = (px: number, py: number, tx: number, ty: number, heading: number) => {
  const dx = px - tx;
  const dy = py - ty;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > SENSE_RADIUS) return false;
  const a = Math.atan2(dy, dx);
  let diff = a - heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= FOV_ANGLE / 2;
};

const rayIntersectAABB = (
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  maxDist: number
): number | null => {
  const EPS = 1e-6;
  let tmin = -Infinity;
  let tmax = Infinity;

  if (Math.abs(dx) < EPS) {
    if (ox < minX || ox > maxX) return null;
  } else {
    const tx1 = (minX - ox) / dx;
    const tx2 = (maxX - ox) / dx;
    const t1 = Math.min(tx1, tx2);
    const t2 = Math.max(tx1, tx2);
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
  }

  if (Math.abs(dy) < EPS) {
    if (oy < minY || oy > maxY) return null;
  } else {
    const ty1 = (minY - oy) / dy;
    const ty2 = (maxY - oy) / dy;
    const t1 = Math.min(ty1, ty2);
    const t2 = Math.max(ty1, ty2);
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
  }

  if (tmax < 0) return null;
  if (tmin > tmax) return null;

  const t = tmin >= 0 ? tmin : tmax;
  if (t < 0 || t > maxDist) return null;
  return t;
};

const castRayWorld = (
  ox: number,
  oy: number,
  angle: number,
  maxDist: number,
  obstacles: WorldRect[]
) => {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDist;
  let hit: Point | null = null;
  for (const o of obstacles) {
    const t = rayIntersectAABB(ox, oy, dx, dy, o.x, o.y, o.x + o.width, o.y + o.height, maxDist);
    if (t !== null && t < best) {
      best = t;
      hit = { x: ox + dx * t, y: oy + dy * t };
    }
  }
  return { hit, dist: best };
};

const castRayModel = (
  ox: number,
  oy: number,
  angle: number,
  maxDist: number,
  objects: RecognizedObject[]
) => {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDist;
  let hit: Point | null = null;
  let objId: number | null = null;

  for (const o of objects) {
    if (o.confidence < 0.15) continue;
    const minX = o.centerX - o.halfWidth;
    const minY = o.centerY - o.halfHeight;
    const maxX = o.centerX + o.halfWidth;
    const maxY = o.centerY + o.halfHeight;
    const t = rayIntersectAABB(ox, oy, dx, dy, minX, minY, maxX, maxY, maxDist);
    if (t !== null && t < best) {
      best = t;
      hit = { x: ox + dx * t, y: oy + dy * t };
      objId = o.id;
    }
  }

  return { hit, dist: best, objId };
};

const buildMeasurements = (rays: RayRec[]): Measurement[] => {
  const out: Measurement[] = [];
  let i = 0;
  while (i < rays.length) {
    if (!rays[i].obsHit) {
      i++;
      continue;
    }

    let minX = rays[i].obsHit!.x;
    let maxX = rays[i].obsHit!.x;
    let minY = rays[i].obsHit!.y;
    let maxY = rays[i].obsHit!.y;
    let prevDist = rays[i].obsDist;
    let prevPt = rays[i].obsHit!;
    let count = 1;

    let j = i + 1;
    for (; j < rays.length; j++) {
      const rr = rays[j];
      if (!rr.obsHit) break;
      const dd = Math.abs(rr.obsDist - prevDist);
      const dp = hypot(rr.obsHit.x - prevPt.x, rr.obsHit.y - prevPt.y);
      if (dd > RUN_DIST_JITTER || dp > RUN_POINT_JITTER) break;

      minX = Math.min(minX, rr.obsHit.x);
      maxX = Math.max(maxX, rr.obsHit.x);
      minY = Math.min(minY, rr.obsHit.y);
      maxY = Math.max(maxY, rr.obsHit.y);
      prevDist = rr.obsDist;
      prevPt = rr.obsHit;
      count++;
    }

    out.push({
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      strength: clamp01(count / 10),
    });

    i = j;
  }
  return out;
};

const scoreMatch = (m: Measurement, o: RecognizedObject) => {
  const dc = hypot(m.centerX - o.centerX, m.centerY - o.centerY);
  const ds = Math.abs(m.width - o.halfWidth * 2) + Math.abs(m.height - o.halfHeight * 2);
  return dc + 0.35 * ds;
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const lastRef = useRef<number>(0);

  const obstaclesRef = useRef<WorldRect[]>([]);
  const raysRef = useRef<RayRec[]>([]);

  const nextObjId = useRef(100);
  const nextObsId = useRef(10);

  const [obstacles, setObstacles] = useState<WorldRect[]>([
    { id: 1, x: 250, y: 140, width: 90, height: 58 },
    { id: 2, x: 110, y: 80, width: 70, height: 70 },
  ]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);

  const [tadpole, setTadpole] = useState<Tadpole>({
    x: 130,
    y: 260,
    vx: 85,
    vy: -35,
    angle: 0,
    objects: [],
    surpriseType: null,
    surpriseTime: 0,
    surprisePos: null,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [showPredRays, setShowPredRays] = useState(true);
  const [showErrorField, setShowErrorField] = useState(true);

  const [drag, setDrag] = useState<{ active: boolean; id: number | null; offX: number; offY: number }>({
    active: false,
    id: null,
    offX: 0,
    offY: 0,
  });

  const uiHelp = useMemo(
    () => "Drag rectangles to violate predictions. Yellow = sensed. Green = predicted. Red = commission PE. Purple = omission PE.",
    []
  );

  useEffect(() => {
    if (isPaused) return;

    const tick = (now: number) => {
      const last = lastRef.current || now;
      lastRef.current = now;
      const dt = clamp((now - last) / 1000, 0.005, 0.04);

      setTadpole(prev => {
        let { x, y, vx, vy, objects, surpriseType, surpriseTime, surprisePos } = prev;

        const inSurprise = surpriseType && (now - surpriseTime) < SURPRISE_MS;
        const precision = inSurprise ? 0.35 : 0.88;

        x += vx * dt;
        y += vy * dt;

        const pad = 18;
        if (x < pad || x > DIM.width - pad) {
          vx *= -1;
          x = clamp(x, pad, DIM.width - pad);
        }
        if (y < pad || y > DIM.height - pad) {
          vy *= -1;
          y = clamp(y, pad, DIM.height - pad);
        }

        vx += (Math.random() - 0.5) * 7;
        vy += (Math.random() - 0.5) * 7;
        const sp = Math.max(1e-6, hypot(vx, vy));
        const targetSp = 92;
        vx = (vx / sp) * lerp(sp, targetSp, 0.06);
        vy = (vy / sp) * lerp(sp, targetSp, 0.06);

        const angle = Math.atan2(vy, vx);

        // predict latent objects
        objects = objects.map(o => ({
          ...o,
          centerX: clamp(o.centerX + o.velX * dt, MIN_HALF, DIM.width - MIN_HALF),
          centerY: clamp(o.centerY + o.velY * dt, MIN_HALF, DIM.height - MIN_HALF),
          velX: o.velX * 0.92,
          velY: o.velY * 0.92,
          inView: false,
          omissionEvidence: o.omissionEvidence * 0.92,
          commissionEvidence: o.commissionEvidence * 0.92,
        }));

        // rays: observe + predict
        const rays: RayRec[] = [];
        const startAngle = angle - FOV_ANGLE / 2;
        for (let i = 0; i < NUM_RAYS; i++) {
          const a = startAngle + (i / (NUM_RAYS - 1)) * FOV_ANGLE;
          const dirX = Math.cos(a);
          const dirY = Math.sin(a);

          const obs = castRayWorld(x, y, a, SENSE_RADIUS, obstaclesRef.current);
          const pred = castRayModel(x, y, a, SENSE_RADIUS, objects);

          const obsDist = obs.hit ? obs.dist : SENSE_RADIUS;
          const predDist = pred.hit ? pred.dist : SENSE_RADIUS;

          rays.push({
            angle: a,
            dirX,
            dirY,
            obsHit: obs.hit,
            obsDist,
            predHit: pred.hit,
            predDist,
            predObjId: pred.objId,
            err: obsDist - predDist,
          });
        }
        raysRef.current = rays;

        const measurements = buildMeasurements(rays);

        // greedy data association
        const usedObj = new Set<number>();
        const usedMeas = new Set<number>();
        const candidates: { mi: number; oi: number; score: number }[] = [];
        for (let mi = 0; mi < measurements.length; mi++) {
          for (let oi = 0; oi < objects.length; oi++) {
            candidates.push({ mi, oi, score: scoreMatch(measurements[mi], objects[oi]) });
          }
        }
        candidates.sort((a, b) => a.score - b.score);

        const assignments: Array<{ mi: number; oi: number; score: number }> = [];
        for (const c of candidates) {
          if (c.score > MATCH_DIST) break;
          if (usedMeas.has(c.mi) || usedObj.has(c.oi)) continue;
          usedMeas.add(c.mi);
          usedObj.add(c.oi);
          assignments.push(c);
        }

        let bestSurprise: { type: SurpriseType; score: number; pos: Point } | null = null;
        const offerSurprise = (type: SurpriseType, score: number, pos: Point) => {
          if (!type) return;
          if (!bestSurprise || score > bestSurprise.score) bestSurprise = { type, score, pos };
        };

        // updates
        objects = objects.map((o, idx) => {
          const a = assignments.find(xx => xx.oi === idx);
          if (!a) return o;

          const m = measurements[a.mi];
          const innovX = m.centerX - o.centerX;
          const innovY = m.centerY - o.centerY;
          const innovMag = hypot(innovX, innovY);

          if (o.confidence > 0.65 && innovMag > 22) offerSurprise('prediction', innovMag, { x: m.centerX, y: m.centerY });

          const targetVx = clamp(innovX / dt, -240, 240);
          const targetVy = clamp(innovY / dt, -240, 240);

          let left = o.centerX - o.halfWidth;
          let right = o.centerX + o.halfWidth;
          let top = o.centerY - o.halfHeight;
          let bottom = o.centerY + o.halfHeight;

          const amLeft = x < o.centerX;
          const amAbove = y < o.centerY;

          let seenLeft = o.seenLeft;
          let seenRight = o.seenRight;
          let seenTop = o.seenTop;
          let seenBottom = o.seenBottom;

          const eT = EDGE_LERP * precision;
          if (amLeft) {
            left = lerp(left, m.minX, eT);
            seenLeft = true;
          } else {
            right = lerp(right, m.maxX, eT);
            seenRight = true;
          }
          if (amAbove) {
            top = lerp(top, m.minY, eT);
            seenTop = true;
          } else {
            bottom = lerp(bottom, m.maxY, eT);
            seenBottom = true;
          }

          const prevHW = o.halfWidth;
          const prevHH = o.halfHeight;
          const w = Math.max(2 * MIN_HALF, right - left);
          const h = Math.max(2 * MIN_HALF, bottom - top);
          const newHW = Math.max(MIN_HALF, Math.max(w / 2, prevHW * 0.82));
          const newHH = Math.max(MIN_HALF, Math.max(h / 2, prevHH * 0.82));

          const edgeCX = (left + right) / 2;
          const edgeCY = (top + bottom) / 2;

          const cT = CENTER_LERP * precision;
          const confGain = 0.05 * m.strength * precision;
          const confLoss = 0.012 * (innovMag / 60);

          return {
            ...o,
            centerX: lerp(edgeCX, m.centerX, cT),
            centerY: lerp(edgeCY, m.centerY, cT),
            halfWidth: lerp(newHW, Math.max(MIN_HALF, Math.max(newHW, m.width / 2)), 0.1 * precision),
            halfHeight: lerp(newHH, Math.max(MIN_HALF, Math.max(newHH, m.height / 2)), 0.1 * precision),
            velX: lerp(o.velX, targetVx, VEL_LERP * precision),
            velY: lerp(o.velY, targetVy, VEL_LERP * precision),
            confidence: clamp01(o.confidence + confGain - confLoss),
            lastSeen: now,
            inView: true,
            seenLeft,
            seenRight,
            seenTop,
            seenBottom,
            omissionEvidence: o.omissionEvidence * 0.7,
            commissionEvidence: o.commissionEvidence * 0.7,
          };
        });

        // spawn
        for (let mi = 0; mi < measurements.length; mi++) {
          if (usedMeas.has(mi)) continue;
          if (objects.length >= MAX_OBJECTS) break;

          const m = measurements[mi];
          const id = nextObjId.current++;
          objects.push({
            id,
            centerX: m.centerX,
            centerY: m.centerY,
            halfWidth: Math.max(MIN_HALF, m.width / 2),
            halfHeight: Math.max(MIN_HALF, m.height / 2),
            velX: 0,
            velY: 0,
            confidence: clamp01(0.48 + 0.2 * m.strength),
            lastSeen: now,
            inView: true,
            seenLeft: x < m.centerX,
            seenRight: x >= m.centerX,
            seenTop: y < m.centerY,
            seenBottom: y >= m.centerY,
            omissionEvidence: 0,
            commissionEvidence: 0,
          });
          offerSurprise('prediction', 30 + 60 * m.strength, { x: m.centerX, y: m.centerY });
        }

        // omission evidence per object
        for (const obj of objects) {
          if (obj.inView || obj.confidence < 0.4) continue;

          let predCount = 0;
          let omission = 0;

          for (const r of rays) {
            if (r.predObjId !== obj.id) continue;
            if (r.predDist >= SENSE_RADIUS - 1) continue;
            predCount++;
            if (r.obsDist > r.predDist + 10) omission += (r.obsDist - r.predDist) / SENSE_RADIUS;
          }

          const newO = lerp(obj.omissionEvidence, omission, 0.35);

          if (predCount >= 2 && newO > OMISSION_TRIGGER && pointInFOV(obj.centerX, obj.centerY, x, y, angle) && obj.confidence > 0.55) {
            offerSurprise('omission', 60 * newO, { x: obj.centerX, y: obj.centerY });
          }

          const decay = 0.994 - 0.06 * clamp01(newO);
          obj.confidence = clamp01(obj.confidence * decay);
          obj.omissionEvidence = newO;
        }

        // global commission
        let globalCommission = 0;
        for (const r of rays) {
          const obsHit = r.obsDist < SENSE_RADIUS - 1;
          const predEmpty = r.predDist >= SENSE_RADIUS - 1;
          if (obsHit && predEmpty) globalCommission += 1;
        }
        globalCommission = clamp01(globalCommission / 10);
        if (globalCommission > COMMISSION_TRIGGER) {
          offerSurprise('prediction', 70 * globalCommission, { x: x + Math.cos(angle) * 30, y: y + Math.sin(angle) * 30 });
        }

        // prune
        objects = objects
          .map(o => {
            const age = (now - o.lastSeen) / 1000;
            const baseDecay = o.inView ? 0.999 : 0.996;
            const conf = clamp01(o.confidence * Math.pow(baseDecay, dt * 60));
            return { ...o, confidence: conf };
          })
          .filter(o => !((now - o.lastSeen) > 12000 && o.confidence < 0.25))
          .slice(0, MAX_OBJECTS);

        // surprise apply
        if (bestSurprise) {
          surpriseType = bestSurprise.type;
          surpriseTime = now;
          surprisePos = bestSurprise.pos;
        } else if (surpriseType && (now - surpriseTime) > SURPRISE_MS) {
          surpriseType = null;
          surprisePos = null;
        }

        return { x, y, vx, vy, angle, objects, surpriseType, surpriseTime, surprisePos };
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPaused]);

  // draw
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const rays = raysRef.current;

    ctx.clearRect(0, 0, DIM.width, DIM.height);

    // background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, DIM.width, DIM.height);

    // world rectangles
    for (const o of obstacles) {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.95)';
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(o.x, o.y, o.width, o.height);
    }

    // FOV wedge
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = 'rgba(56, 189, 248, 1)';
    ctx.beginPath();
    ctx.moveTo(tadpole.x, tadpole.y);
    ctx.arc(tadpole.x, tadpole.y, SENSE_RADIUS, tadpole.angle - FOV_ANGLE / 2, tadpole.angle + FOV_ANGLE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // rays
    if (showDebug && rays.length) {
      for (const r of rays) {
        const ox = tadpole.x;
        const oy = tadpole.y;
        const obsEnd = r.obsHit ?? { x: ox + r.dirX * SENSE_RADIUS, y: oy + r.dirY * SENSE_RADIUS };
        const predEnd = r.predHit ?? { x: ox + r.dirX * SENSE_RADIUS, y: oy + r.dirY * SENSE_RADIUS };

        // sensed
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(obsEnd.x, obsEnd.y);
        ctx.strokeStyle = r.obsHit ? 'rgba(255,255,120,0.55)' : 'rgba(126,184,158,0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // predicted
        if (showPredRays) {
          ctx.save();
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(predEnd.x, predEnd.y);
          ctx.strokeStyle = 'rgba(120,255,170,0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }

        // PE segment
        if (showErrorField) {
          if (Math.abs(r.err) > 12) {
            const isCommission = r.err < -10;
            ctx.beginPath();
            ctx.moveTo(predEnd.x, predEnd.y);
            ctx.lineTo(obsEnd.x, obsEnd.y);
            ctx.strokeStyle = isCommission ? 'rgba(255,90,90,0.55)' : 'rgba(165,120,255,0.55)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    }

    // internal objects
    if (showDebug) {
      for (const o of tadpole.objects) {
        const left = o.centerX - o.halfWidth;
        const top = o.centerY - o.halfHeight;
        const w = o.halfWidth * 2;
        const h = o.halfHeight * 2;
        const a = clamp01(0.25 + 0.55 * o.confidence);

        ctx.fillStyle = o.inView ? `rgba(120,255,170,${a * 0.18})` : `rgba(255,200,120,${a * 0.12})`;
        ctx.fillRect(left, top, w, h);

        ctx.strokeStyle = o.inView ? `rgba(120,255,170,${a * 0.9})` : `rgba(255,200,120,${a * 0.75})`;
        ctx.lineWidth = o.inView ? 2 : 1;
        ctx.setLineDash(o.inView ? [] : [4, 3]);
        ctx.strokeRect(left, top, w, h);
        ctx.setLineDash([]);

        // seen edges
        ctx.fillStyle = 'rgba(96,165,250,0.75)';
        if (o.seenLeft) ctx.fillRect(left - 2, top, 4, h);
        if (o.seenRight) ctx.fillRect(left + w - 2, top, 4, h);
        if (o.seenTop) ctx.fillRect(left, top - 2, w, 4);
        if (o.seenBottom) ctx.fillRect(left, top + h - 2, w, 4);

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '10px ui-monospace, Menlo, monospace';
        ctx.fillText(`${Math.round(o.confidence * 100)}%  om:${o.omissionEvidence.toFixed(2)}`, left, top - 6);
      }
    }

    // tadpole
    ctx.save();
    ctx.translate(tadpole.x, tadpole.y);
    ctx.rotate(tadpole.angle);
    const base = '#7eb89e';
    const color = tadpole.surpriseType ? (tadpole.surpriseType === 'omission' ? '#a78bfa' : '#ff6b6b') : base;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const tt = now / 140;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-16, Math.sin(tt) * 4, -24, Math.sin(tt + 1) * 6);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // popup
    if (tadpole.surpriseType && tadpole.surprisePos) {
      const age = (now - tadpole.surpriseTime) / 1000;
      if (age < SURPRISE_MS / 1000) {
        const fade = 1 - age / (SURPRISE_MS / 1000);
        ctx.fillStyle = tadpole.surpriseType === 'omission'
          ? `rgba(165,120,255,${0.95 * fade})`
          : `rgba(255,90,90,${0.95 * fade})`;
        ctx.font = 'bold 28px ui-sans-serif, system-ui';
        ctx.fillText(tadpole.surpriseType === 'omission' ? '?' : '!', tadpole.surprisePos.x - 8, tadpole.surprisePos.y + 10);
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px ui-monospace, Menlo, monospace';
    ctx.fillText(`objects: ${tadpole.objects.length}   seen: ${tadpole.objects.filter(o => o.inView).length}`, 10, 18);
    ctx.fillText(uiHelp, 10, DIM.height - 10);
  }, [tadpole, obstacles, showDebug, showPredRays, showErrorField, uiHelp]);

  const addObstacle = () => {
    const id = nextObsId.current++;
    const w = 50 + Math.random() * 60;
    const h = 40 + Math.random() * 60;
    const x = 40 + Math.random() * (DIM.width - w - 80);
    const y = 40 + Math.random() * (DIM.height - h - 80);
    setObstacles(prev => [...prev, { id, x, y, width: w, height: h }]);
  };

  const resetModel = () => setTadpole(p => ({ ...p, objects: [], surpriseType: null, surprisePos: null }));

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = [...obstacles].reverse().find(o => mx >= o.x && mx <= o.x + o.width && my >= o.y && my <= o.y + o.height);
    if (!hit) return;
    setDrag({ active: true, id: hit.id, offX: mx - hit.x, offY: my - hit.y });
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag.active || drag.id === null) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nx = clamp(mx - drag.offX, 0, DIM.width - 10);
    const ny = clamp(my - drag.offY, 0, DIM.height - 10);
    setObstacles(prev => prev.map(o => (o.id === drag.id)
      ? { ...o, x: clamp(nx, 0, DIM.width - o.width), y: clamp(ny, 0, DIM.height - o.height) }
      : o
    ));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag({ active: false, id: null, offX: 0, offY: 0 });
    try { (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-white text-xl font-mono mb-2">Predictive Tadpole: object + motion inference</h1>
        <p className="text-slate-400 text-sm mb-3 max-w-2xl text-center">
          The tadpole predicts what its rays should see. Drag rectangles to induce commission and omission prediction errors.
        </p>

        <div className="flex flex-wrap gap-3 mb-4 items-center justify-center">
          <button onClick={() => setIsPaused(p => !p)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">
            {isPaused ? 'Play' : 'Pause'}
          </button>
          <button onClick={addObstacle} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">
            Add rectangle
          </button>
          <button onClick={resetModel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">
            Reset model
          </button>

          <label className="flex items-center gap-2 text-slate-300 text-sm">
            <input type="checkbox" checked={showDebug} onChange={e => setShowDebug(e.target.checked)} className="accent-cyan-500" />
            Debug
          </label>
          <label className="flex items-center gap-2 text-slate-300 text-sm">
            <input type="checkbox" checked={showPredRays} onChange={e => setShowPredRays(e.target.checked)} className="accent-cyan-500" />
            Predicted rays
          </label>
          <label className="flex items-center gap-2 text-slate-300 text-sm">
            <input type="checkbox" checked={showErrorField} onChange={e => setShowErrorField(e.target.checked)} className="accent-cyan-500" />
            Error field
          </label>
        </div>

        <canvas
          ref={canvasRef}
          width={DIM.width}
          height={DIM.height}
          className="rounded-lg touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
}

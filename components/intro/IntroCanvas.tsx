"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface IntroCanvasProps {
  onComplete: () => void;
  isTriggered: boolean;
}

export function IntroCanvas({ onComplete, isTriggered }: IntroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dissolveTriggeredRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Illuminated Logo Emblem
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load("/logo.webp");
    const logoGeo = new THREE.PlaneGeometry(3.2, 0.72);
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const logoMesh = new THREE.Mesh(logoGeo, logoMat);
    logoMesh.position.z = 0;
    mainGroup.add(logoMesh);

    // Glass backdrop plate behind logo
    const plateGeo = new THREE.PlaneGeometry(3.6, 0.95);
    const plateMat = new THREE.MeshBasicMaterial({
      color: 0x14b8c4,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.z = -0.05;
    mainGroup.add(plateMesh);

    // Expanding Energy Pulse Ring
    const pulseGeo = new THREE.RingGeometry(0.1, 0.3, 32);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x38d9e6,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMesh.position.z = -0.02;
    mainGroup.add(pulseMesh);

    // 2. High-Density 10,000 Particle Explosion System
    const particleCount = 10000;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);

    const radius = 3.6;
    const colorWhite = new THREE.Color(0xffffff);
    const colorTurquoise = new THREE.Color(0x14b8c4);
    const colorCyan = new THREE.Color(0x38d9e6);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius + (Math.random() - 0.5) * 0.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Radial velocities + turbulence swirl
      const speed = 0.08 + Math.random() * 0.14;
      const norm = Math.sqrt(x * x + y * y + z * z) || 1;
      velocities[i * 3] = (x / norm) * speed + (Math.random() - 0.5) * 0.04;
      velocities[i * 3 + 1] = (y / norm) * speed + (Math.random() - 0.5) * 0.04;
      velocities[i * 3 + 2] = (z / norm) * speed + (Math.random() - 0.5) * 0.04;

      // Morph targets (Logo top-left, Header top, Hero center)
      if (i % 3 === 0) {
        // Logo top-left (-5, +4)
        targetPositions[i * 3] = -5.5 + (Math.random() - 0.5) * 2;
        targetPositions[i * 3 + 1] = 4.2 + (Math.random() - 0.5) * 1;
        targetPositions[i * 3 + 2] = 0;
      } else if (i % 3 === 1) {
        // Navigation top (0, +4)
        targetPositions[i * 3] = (Math.random() - 0.5) * 8;
        targetPositions[i * 3 + 1] = 4.0 + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = 0;
      } else {
        // Hero center image bounds
        targetPositions[i * 3] = (Math.random() - 0.5) * 6;
        targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
        targetPositions[i * 3 + 2] = 0;
      }

      const randColor = Math.random();
      const c = randColor > 0.5 ? colorWhite : randColor > 0.25 ? colorTurquoise : colorCyan;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.048,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particleSystem);

    // 3. Concentric Orbital Rings
    const ringMat1 = new THREE.LineBasicMaterial({ color: 0x14b8c4, transparent: true, opacity: 0.5 });
    const ringMat2 = new THREE.LineBasicMaterial({ color: 0x38d9e6, transparent: true, opacity: 0.4 });
    const ringMat3 = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });

    const createRing = (r: number, mat: THREE.LineBasicMaterial, rotX: number, rotY: number) => {
      const curve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(96);
      const geo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, p.y, 0))
      );
      const ring = new THREE.LineLoop(geo, mat);
      ring.rotation.x = rotX;
      ring.rotation.y = rotY;
      return ring;
    };

    const ring1 = createRing(4.0, ringMat1, Math.PI / 3, Math.PI / 6);
    const ring2 = createRing(4.3, ringMat2, -Math.PI / 4, Math.PI / 4);
    const ring3 = createRing(4.6, ringMat3, Math.PI / 6, -Math.PI / 3);
    mainGroup.add(ring1);
    mainGroup.add(ring2);
    mainGroup.add(ring3);

    // Interaction & Drag State
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;

      velX = deltaX * 0.005;
      velY = deltaY * 0.005;

      targetRotationY += velX;
      targetRotationX += velY;

      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Animation & Phase Sequence Logic
    let clock = new THREE.Clock();
    let animId: number;
    let phase = 0; // 0: idle, 1: charge (0-0.5s), 2: explosion (0.5-1.4s), 3: morph (1.4-2.2s)
    let phaseTimer = 0;

    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Idle Rotation
      if (phase === 0) {
        if (!isDragging) {
          velX *= 0.95;
          velY *= 0.95;
          targetRotationY += velX + 0.002;
          targetRotationX += velY;
        }

        mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.08;
        mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.08;

        ring1.rotation.z = elapsedTime * 0.15;
        ring2.rotation.z = -elapsedTime * 0.2;
        ring3.rotation.z = elapsedTime * 0.1;

        const breath = 1 + Math.sin(elapsedTime * 1.5) * 0.02;
        mainGroup.scale.set(breath, breath, breath);
      }

      // Trigger phase transition when isTriggered becomes true
      if (isTriggered && phase === 0) {
        phase = 1;
        phaseTimer = 0;
      }

      if (phase > 0) {
        phaseTimer += delta;

        // Phase 1: Energy Charge (0 to 0.5s)
        if (phase === 1) {
          const t = phaseTimer / 0.5;
          // Accelerate ring rotation 4x
          ring1.rotation.z += 0.08;
          ring2.rotation.z -= 0.1;
          ring3.rotation.z += 0.06;

          // Camera Dolly Forward
          camera.position.z = 12 - t * 1.5;

          // Energy Pulse Expansion
          pulseMat.opacity = Math.sin(t * Math.PI) * 0.8;
          pulseMesh.scale.set(t * 15, t * 15, 1);

          // Brighten logo and particles
          particleMat.size = 0.048 + t * 0.03;
          logoMat.opacity = 0.95 + t * 0.05;

          if (phaseTimer >= 0.5) {
            phase = 2;
            phaseTimer = 0;
          }
        }
        // Phase 2: Particle Shatter & Explosion (0.5 to 1.4s)
        else if (phase === 2) {
          const t = phaseTimer / 0.9;
          const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;

          // Camera Micro-Shake
          camera.position.x = (Math.random() - 0.5) * 0.08;
          camera.position.y = (Math.random() - 0.5) * 0.08;

          for (let i = 0; i < particleCount; i++) {
            // Swirl turbulence vector
            const swirlX = Math.sin(elapsedTime * 2 + i) * 0.02;
            const swirlY = Math.cos(elapsedTime * 2 + i) * 0.02;

            posArray[i * 3] += (velocities[i * 3] + swirlX) * (1 + t * 4);
            posArray[i * 3 + 1] += (velocities[i * 3 + 1] + swirlY) * (1 + t * 4);
            posArray[i * 3 + 2] += velocities[i * 3 + 2] * (1 + t * 4);
          }
          posAttr.needsUpdate = true;

          // Dissolve rings and logo
          logoMat.opacity = Math.max(0, 1 - t * 1.5);
          plateMat.opacity = Math.max(0, 0.15 - t * 0.2);
          ringMat1.opacity = Math.max(0, 0.5 - t * 0.8);
          ringMat2.opacity = Math.max(0, 0.4 - t * 0.8);
          ringMat3.opacity = Math.max(0, 0.35 - t * 0.8);

          if (phaseTimer >= 0.9) {
            phase = 3;
            phaseTimer = 0;
          }
        }
        // Phase 3: Morph & Homepage Convergence (1.4 to 2.2s)
        else if (phase === 3) {
          const t = Math.min(1, phaseTimer / 0.8);
          const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;

          for (let i = 0; i < particleCount; i++) {
            // Lerp towards target screen coordinates
            posArray[i * 3] += (targetPositions[i * 3] - posArray[i * 3]) * 0.12;
            posArray[i * 3 + 1] += (targetPositions[i * 3 + 1] - posArray[i * 3 + 1]) * 0.12;
            posArray[i * 3 + 2] += (targetPositions[i * 3 + 2] - posArray[i * 3 + 2]) * 0.12;
          }
          posAttr.needsUpdate = true;

          particleMat.opacity = Math.max(0, 0.85 - t);

          if (phaseTimer >= 0.8 && !dissolveTriggeredRef.current) {
            dissolveTriggeredRef.current = true;
            onComplete();
          }
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Complete GPU Cleanup & Resource Disposal
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);

      logoGeo.dispose();
      logoMat.dispose();
      plateGeo.dispose();
      plateMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      ringMat3.dispose();

      renderer.forceContextLoss();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isTriggered]);

  useEffect(() => {
    if (isTriggered && !dissolveTriggeredRef.current) {
      const timer = setTimeout(() => {
        dissolveTriggeredRef.current = true;
        onComplete();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [isTriggered, onComplete]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
}

export default IntroCanvas;

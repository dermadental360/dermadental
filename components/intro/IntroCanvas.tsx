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

    // Group setup
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
    const plateGeo = new THREE.PlaneGeometry(3.5, 0.9);
    const plateMat = new THREE.MeshBasicMaterial({
      color: 0x14b8c4,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.z = -0.05;
    mainGroup.add(plateMesh);

    // 2. Holographic Data Sphere Particles (2,500+ particles)
    const particleCount = 2500;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const radius = 3.6;
    const colorWhite = new THREE.Color(0xffffff);
    const colorTurquoise = new THREE.Color(0x14b8c4);
    const colorCyan = new THREE.Color(0x38d9e6);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius + (Math.random() - 0.5) * 0.4;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.08;

      const randColor = Math.random();
      const c = randColor > 0.6 ? colorWhite : randColor > 0.3 ? colorTurquoise : colorCyan;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particleSystem);

    // 3. Concentric Orbital Rings
    const ringMat1 = new THREE.LineBasicMaterial({ color: 0x14b8c4, transparent: true, opacity: 0.45 });
    const ringMat2 = new THREE.LineBasicMaterial({ color: 0x38d9e6, transparent: true, opacity: 0.35 });
    const ringMat3 = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });

    const createRing = (r: number, mat: THREE.LineBasicMaterial, rotX: number, rotY: number) => {
      const curve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
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

    // Interaction & Inertia Drag State
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

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

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;
    let dissolving = false;
    let dissolveProgress = 0;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      if (!isDragging) {
        // Inertia friction decay
        velX *= 0.95;
        velY *= 0.95;
        targetRotationY += velX + 0.002;
        targetRotationX += velY;
      }

      // Smooth Group Rotation & Tilt
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.08;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.08;

      // Orbital Rings Rotation
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.z = -elapsedTime * 0.2;
      ring3.rotation.z = elapsedTime * 0.1;

      // Breathing Scale & Camera Drift
      if (!dissolving) {
        const breath = 1 + Math.sin(elapsedTime * 1.5) * 0.02;
        mainGroup.scale.set(breath, breath, breath);
        camera.position.x = Math.sin(elapsedTime * 0.5) * 0.3 + mouseX * 0.4;
        camera.position.y = Math.cos(elapsedTime * 0.5) * 0.3 - mouseY * 0.4;
        camera.lookAt(0, 0, 0);
      }

      // Dissolve Burst Transition Logic
      if (dissolving) {
        dissolveProgress += 0.025;
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          posArray[i * 3] += velocities[i * 3] * (1 + dissolveProgress * 5);
          posArray[i * 3 + 1] += velocities[i * 3 + 1] * (1 + dissolveProgress * 5);
          posArray[i * 3 + 2] += velocities[i * 3 + 2] * (1 + dissolveProgress * 5);
        }
        posAttr.needsUpdate = true;

        particleMat.opacity = Math.max(0, 0.85 - dissolveProgress * 0.8);
        logoMat.opacity = Math.max(0, 0.95 - dissolveProgress);
        plateMat.opacity = Math.max(0, 0.12 - dissolveProgress * 0.2);
        ringMat1.opacity = Math.max(0, 0.45 - dissolveProgress);
        ringMat2.opacity = Math.max(0, 0.35 - dissolveProgress);
        ringMat3.opacity = Math.max(0, 0.3 - dissolveProgress);

        mainGroup.scale.multiplyScalar(1.015);

        if (dissolveProgress >= 1.2 && !dissolveTriggeredRef.current) {
          dissolveTriggeredRef.current = true;
          onComplete();
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

    // Cleanup & GPU resource disposal
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
  }, []);

  // Trigger dissolve when triggered prop changes
  useEffect(() => {
    if (isTriggered && !dissolveTriggeredRef.current) {
      dissolveTriggeredRef.current = true;
      const timer = setTimeout(() => {
        onComplete();
      }, 900);
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

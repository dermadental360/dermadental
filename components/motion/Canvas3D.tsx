"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMotion } from "./MotionProvider";

export function Canvas3D() {
  const { isDesktop } = useMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDesktop || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Decorative floating translucent geometric objects
    const group = new THREE.Group();
    scene.add(group);

    const materials = [
      new THREE.MeshBasicMaterial({
        color: 0x14b8a6,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
      }),
      new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.06,
      }),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        wireframe: true,
        transparent: true,
        opacity: 0.05,
      }),
    ];

    const geometries = [
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.TorusGeometry(1.5, 0.3, 8, 24),
      new THREE.OctahedronGeometry(1.0, 0),
    ];

    const meshes: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const geo = geometries[i % geometries.length];
      const mat = materials[i % materials.length];
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        0
      );
      const scale = 0.6 + Math.random() * 0.8;
      mesh.scale.set(scale, scale, scale);

      group.add(mesh);
      meshes.push(mesh);
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let animId: number;
    const animate = () => {
      targetX += (mouseX - targetX) * 0.03;
      targetY += (mouseY - targetY) * 0.03;

      group.rotation.y = targetX * 0.2;
      group.rotation.x = -targetY * 0.2;

      meshes.forEach((m, idx) => {
        m.rotation.x += 0.002 * (idx % 2 === 0 ? 1 : -1);
        m.rotation.y += 0.003 * (idx % 2 === 0 ? 1 : -1);
      });

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

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[0] opacity-70 overflow-hidden mix-blend-screen"
      style={{ willChange: "transform" }}
    />
  );
}

export default Canvas3D;

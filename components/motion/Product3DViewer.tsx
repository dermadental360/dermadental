"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMotion } from "./MotionProvider";

interface Product3DViewerProps {
  imageSrc: string;
  className?: string;
}

export function Product3DViewer({ imageSrc, className = "" }: Product3DViewerProps) {
  const { isDesktop, isReducedMotion } = useMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDesktop || isReducedMotion || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Product Card Plane Geometry
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageSrc);

    const geo = new THREE.PlaneGeometry(3.2, 3.2);
    const mat = new THREE.MeshPhongMaterial({
      map: texture,
      transparent: true,
      shininess: 80,
      specular: 0x38d9e6,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x14b8c4, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38d9e6, 0.8, 10);
    pointLight.position.set(-3, -3, 3);
    scene.add(pointLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX = (x / rect.width - 0.5) * 2;
      mouseY = (y / rect.height - 0.5) * 2;
    };

    container.addEventListener("mousemove", onMouseMove);

    let animId: number;
    const animate = () => {
      targetX += (mouseX - targetX) * 0.08;
      targetY += (mouseY - targetY) * 0.08;

      mesh.rotation.y = targetX * 0.35;
      mesh.rotation.x = -targetY * 0.35;

      pointLight.position.x = targetX * 4;
      pointLight.position.y = -targetY * 4;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousemove", onMouseMove);
      geo.dispose();
      mat.dispose();
      texture.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDesktop, isReducedMotion, imageSrc]);

  if (!isDesktop || isReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-10 pointer-events-auto overflow-hidden rounded-[16px] ${className}`}
    />
  );
}

export default Product3DViewer;

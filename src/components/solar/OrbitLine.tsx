"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface OrbitLineProps {
  radius: number;
  highlighted?: boolean;
  opacity?: number;
  color?: string | number;
  segments?: number;
}

export function OrbitLine({
  radius,
  highlighted = false,
  opacity,
  color,
  segments = 128,
}: OrbitLineProps) {
  const lineObject = useMemo(() => {
    if (radius <= 0) return null;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color ?? (highlighted ? 0xffffff : 0x27272a),
      transparent: true,
      opacity: opacity ?? (highlighted ? 0.9 : 0.3),
    });
    return new THREE.Line(geometry, material);
  }, [radius, highlighted, opacity, color, segments]);

  useEffect(() => {
    return () => {
      if (lineObject) {
        lineObject.geometry.dispose();
        (lineObject.material as THREE.Material).dispose();
      }
    };
  }, [lineObject]);

  if (!lineObject) return null;

  return <primitive object={lineObject} />;
}

"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

export const TEXTURE_PATHS: Record<string, string> = {
  sun: "/textures/2k_sun.jpg",
  mercury: "/textures/2k_mercury.jpg",
  venus: "/textures/2k_venus_atmosphere.jpg",
  earth: "/textures/2k_earth_daymap.jpg",
  mars: "/textures/2k_mars.jpg",
  jupiter: "/textures/2k_jupiter.jpg",
  saturn: "/textures/2k_saturn.jpg",
  uranus: "/textures/2k_uranus.jpg",
  neptune: "/textures/2k_neptune.jpg",
  moon: "/textures/2k_moon.jpg",
  ceres: "/textures/2k_ceres_fictional.jpg",
};

export const SATURN_RING_TEXTURE = "/textures/2k_saturn_ring_alpha.png";

// Singleton texture cache to prevent duplicate GPU memory allocations
const textureCache = new Map<string, THREE.Texture>();
let textureLoaderInstance: THREE.TextureLoader | null = null;

export function getTextureLoader(): THREE.TextureLoader {
  if (!textureLoaderInstance) {
    textureLoaderInstance = new THREE.TextureLoader();
  }
  return textureLoaderInstance;
}

export function useTextureCached(path?: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(() => {
    if (!path) return null;
    return textureCache.get(path) || null;
  });

  useEffect(() => {
    if (!path || textureCache.has(path)) return;

    let isMounted = true;
    const loader = getTextureLoader();
    loader.load(
      path,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(path, loaded);
        if (isMounted) {
          setTexture(loaded);
        }
      },
      undefined,
      (err) => {
        console.warn(`[SolarSystem] Failed to load texture: ${path}`, err);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [path]);

  const cached = path ? textureCache.get(path) || null : null;
  return cached || texture;
}

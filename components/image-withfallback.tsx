'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export function ImageWithFallback({
  src,
  fallbackSrc, // Optional: You can pass a specific fallback if you want
  alt,
  className,
  ...props
}: ImageWithFallbackProps) {
  
  // 1. Define a clean, generic gray placeholder (Data URI) 
  // This loads instantly and looks like a "skeleton" loader.
  // Paper-tone placeholder that matches the Green Circle design tokens.
  const defaultFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 800'%3E%3Crect fill='%23EAE3D2' width='800' height='800'/%3E%3Cpath d='M 624 192 C 736 288 752 464 656 592 C 560 720 368 744 224 656 C 80 568 40 384 128 240 C 216 96 416 48 576 128' fill='none' stroke='%23D9D2C1' stroke-width='8' stroke-linecap='round'/%3E%3C/svg%3E";

  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src as string);
    setHasError(false);
  }, [src]);

  return (
    <Image
      {...props}
      src={hasError || !imgSrc ? (fallbackSrc || defaultFallback) : imgSrc}
      alt={alt || 'Image'}
      // 2. FORCE 'object-cover' so it never goes out of space
      className={`object-cover ${className || ''}`} 
      onError={() => {
        setHasError(true);
      }}
    />
  );
}
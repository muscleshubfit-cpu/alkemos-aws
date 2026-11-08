"use client";
import Image from "next/image";
import { useState } from "react";

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  fallbackElement?: React.ReactNode;
  loading?: "lazy" | "eager";
  priority?: boolean;
  /* P1-2 (PERFORMANCE-AUDIT-2026-11-08): optional prebuilt responsive
   * variants. When srcSet is provided the component renders a plain
   * <img> — next/image cannot emit srcset under images.unoptimized (the
   * Hobby-quota guard law), and the repo's prebuilt-variant pattern
   * (ThemeImg/PageBanner) is plain <img>. Without srcSet the render is
   * byte-identical to the pre-P1-2 next/image path. */
  srcSet?: string;
  sizes?: string;
};

export function ImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  className,
  fallbackSrc,
  fallbackElement,
  loading = "lazy",
  priority,
  srcSet,
  sizes,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error && fallbackElement) {
    return <>{fallbackElement}</>;
  }

  // P1-2: prebuilt-variant path — same fallback semantics (an onError
  // swaps to the fallbackSrc SVG exactly like the next/image path).
  if (srcSet) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- prebuilt responsive variants (unoptimized law — ThemeImg/PageBanner precedent)
      <img
        src={error && fallbackSrc ? fallbackSrc : src}
        srcSet={error ? undefined : srcSet}
        sizes={sizes}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={className}
        loading={loading}
        decoding="async"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image
      src={error && fallbackSrc ? fallbackSrc : src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      sizes={sizes}
      loading={loading}
      priority={priority}
      onError={() => {
        if (fallbackSrc) {
          setError(true);
        } else {
          setError(true);
        }
      }}
    />
  );
}

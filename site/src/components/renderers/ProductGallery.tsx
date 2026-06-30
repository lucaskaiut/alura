'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/api';

interface MediaItem {
  id: number;
  path: string;
  mime_type: string;
}

export default function ProductGallery({ media }: { media: MediaItem[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (media.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
        <div className="flex h-full items-center justify-center text-text-muted">Sem imagem</div>
      </div>
    );
  }

  const selected = media[selectedIdx];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
        <Image
          src={getMediaUrl(selected)}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
      </div>
      {media.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {media.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIdx(i)}
              className={`relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded border-2 transition-colors ${
                i === selectedIdx ? 'border-primary-500' : 'border-transparent hover:border-primary-300'
              }`}
            >
              <Image
                src={getMediaUrl(img)}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

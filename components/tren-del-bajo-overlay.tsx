"use client"

import Image from 'next/image'

export function TrenDelBajoOverlay() {
  return (
    <div className="absolute bottom-2 left-4 z-[1000] pointer-events-none">
     
        <div className="size-32 relative">
          <Image
            src="/images/tren-del-bajo.svg"
            alt="Tren del Bajo"
            fill
            className="object-contain filter drop-shadow-lg"
            style={{
              filter: 'brightness(0) invert(1) drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}
          />
        </div>
    </div>
  )
}

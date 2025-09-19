import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="jelly" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ff006e' }} />
              <stop offset="50%" style={{ stopColor: '#ff4dc7' }} />
              <stop offset="100%" style={{ stopColor: '#c908ff' }} />
            </linearGradient>
            <radialGradient id="glow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#ff006e', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          
          <ellipse cx="16" cy="12" rx="11" ry="9" fill="url(#jelly)"/>
          <ellipse cx="16" cy="11" rx="8" ry="6" fill="url(#glow)" opacity="0.7"/>
          
          <path d="M 10,18 Q 9,22 10,26 T 10,30" stroke="#ff4dc7" strokeWidth="1.5" fill="none" opacity="0.9"/>
          <path d="M 13,19 Q 12,23 13,27 T 13,31" stroke="#ff006e" strokeWidth="1.5" fill="none" opacity="0.9"/>
          <path d="M 16,19 Q 15,24 16,28 T 16,32" stroke="#c908ff" strokeWidth="2" fill="none"/>
          <path d="M 19,19 Q 20,23 19,27 T 19,31" stroke="#ff006e" strokeWidth="1.5" fill="none" opacity="0.9"/>
          <path d="M 22,18 Q 23,22 22,26 T 22,30" stroke="#ff4dc7" strokeWidth="1.5" fill="none" opacity="0.9"/>
          
          <circle cx="12" cy="9" r="1.5" fill="white" opacity="0.6"/>
          <circle cx="18" cy="8" r="1" fill="white" opacity="0.4"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}


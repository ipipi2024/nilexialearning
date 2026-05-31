import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#2563EB',
          borderRadius: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: '-3px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          CQ
        </span>
      </div>
    ),
    { ...size }
  )
}

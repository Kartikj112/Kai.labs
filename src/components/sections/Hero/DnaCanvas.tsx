'use client'

export function DnaCanvas() {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(5,5,7,.92) 0%, rgba(5,5,7,.65) 35%, rgba(5,5,7,.35) 100%)"
        }}
      />
    </>
  )
}

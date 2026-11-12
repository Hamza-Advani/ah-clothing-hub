/**
 * Intro splash — pure CSS so it animates instantly, even before JavaScript loads.
 * Shown once per browser session (see inline script in app/layout.tsx).
 */
export function SplashScreen() {
  return (
    <div id="ah-splash" aria-hidden className="ah-splash">
      <div className="ah-splash__inner">
        <svg className="ah-splash__ring" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="0.75" />
        </svg>
        <span className="ah-splash__mono">AH</span>
      </div>
      <p className="ah-splash__word">Clothing Hub</p>
      <span className="ah-splash__line" />
      <p className="ah-splash__tag">Modern heritage · Since 2026</p>
      <style>{`
        .ah-splash{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
          background:#141414;color:#faf7f2;animation:ahCurtain .9s cubic-bezier(.76,0,.24,1) 2.3s forwards}
        .splash-seen .ah-splash{display:none}
        .ah-splash__inner{position:relative;display:grid;place-items:center;width:120px;height:120px}
        .ah-splash__ring{position:absolute;inset:0;color:#b08d57;stroke-dasharray:352;stroke-dashoffset:352;transform:rotate(-90deg);animation:ahDraw 1.4s cubic-bezier(.22,1,.36,1) .15s forwards}
        .ah-splash__mono{font-family:var(--font-cormorant),Georgia,serif;font-size:52px;font-weight:500;letter-spacing:.02em;opacity:0;transform:translateY(10px);animation:ahUp .9s cubic-bezier(.22,1,.36,1) .45s forwards}
        .ah-splash__word{font-family:var(--font-manrope),sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;opacity:0;animation:ahTrack 1.2s cubic-bezier(.22,1,.36,1) .8s forwards}
        .ah-splash__line{display:block;height:1px;width:140px;background:linear-gradient(90deg,transparent,#b08d57,transparent);transform:scaleX(0);animation:ahLine 1s cubic-bezier(.22,1,.36,1) 1.1s forwards}
        .ah-splash__tag{font-family:var(--font-cormorant),Georgia,serif;font-style:italic;font-size:16px;color:#c9c2b8;opacity:0;animation:ahFade .8s ease 1.4s forwards}
        @keyframes ahDraw{to{stroke-dashoffset:0}}
        @keyframes ahUp{to{opacity:1;transform:none}}
        @keyframes ahTrack{to{opacity:1;letter-spacing:.5em}}
        @keyframes ahLine{to{transform:scaleX(1)}}
        @keyframes ahFade{to{opacity:1}}
        @keyframes ahCurtain{0%{clip-path:inset(0 0 0 0)}99%{clip-path:inset(0 0 100% 0)}100%{clip-path:inset(0 0 100% 0);visibility:hidden;pointer-events:none}}
        @media (prefers-reduced-motion: reduce){.ah-splash{display:none}}
      `}</style>
    </div>
  );
}

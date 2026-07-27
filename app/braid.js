const W = 560;
const MID = 13;
const AMP = 8;
const HALF = 32; // half wavelength

function strand(offset) {
  let x = -HALF * 2 + offset;
  let up = true;
  let d = `M${x} ${MID + (up ? -AMP : AMP)}`;
  while (x < W + HALF * 2) {
    const y0 = MID + (up ? -AMP : AMP);
    const y1 = MID + (up ? AMP : -AMP);
    d += ` C${x + HALF * 0.36} ${y0} ${x + HALF * 0.64} ${y1} ${x + HALF} ${y1}`;
    x += HALF;
    up = !up;
  }
  return d;
}

export default function Braid() {
  return (
    <svg className="braid" viewBox={`0 0 ${W} 26`} preserveAspectRatio="none" aria-hidden="true">
      <path d={strand(0)} stroke="#FF3D7F" />
      <path d={strand(21)} stroke="#FFB627" />
      <path d={strand(42)} stroke="#00C2A8" />
    </svg>
  );
}

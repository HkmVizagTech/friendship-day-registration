const BASE = 150;

function figure(x, i) {
  const headR = 10.5;
  const headY = BASE - 52;
  const shoulderY = BASE - 40;
  const lean = i % 2 === 0 ? 1.5 : -1.5; // tiny variation so they aren't identical
  return (
    <g key={i}>
      <circle cx={x + lean} cy={headY} r={headR} />
      <path
        d={`M${x - 15} ${BASE + 2}
            L${x - 12.5} ${shoulderY + 4}
            Q${x + lean} ${shoulderY - 6} ${x + 12.5} ${shoulderY + 4}
            L${x + 15} ${BASE + 2} Z`}
      />
    </g>
  );
}

export default function Sunset() {
  const xs = [138, 204, 270, 336, 402];
  const shoulderY = BASE - 36;

  // one continuous arm line draped across every shoulder
  let arms = `M${xs[0] - 22} ${shoulderY + 6}`;
  xs.forEach((x, i) => {
    arms += ` Q${x - 16} ${shoulderY - 2} ${x} ${shoulderY - 1}`;
    if (i < xs.length - 1) arms += ` Q${x + 33} ${shoulderY + 9} ${xs[i + 1] - 16} ${shoulderY + 1}`;
  });
  arms += ` Q${xs[xs.length - 1] + 16} ${shoulderY - 2} ${xs[xs.length - 1] + 22} ${shoulderY + 6}`;

  return (
    <svg className="sunset" viewBox="0 0 540 190" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF4F9" />
          <stop offset="34%" stopColor="#F7D89A" />
          <stop offset="72%" stopColor="#F09A52" />
          <stop offset="100%" stopColor="#E8641F" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFF0C4" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFC65C" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="540" height="190" fill="url(#sky)" />
      <circle cx="272" cy="146" r="120" fill="url(#glow)" />
      <circle cx="272" cy="146" r="46" fill="#FFDE95" opacity="0.92" />

      <g stroke="#123A5E" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.75">
        <path d="M96 40 q7 -7 14 0 q7 -7 14 0" />
        <path d="M138 26 q5.5 -5.5 11 0 q5.5 -5.5 11 0" />
        <path d="M432 52 q6 -6 12 0 q6 -6 12 0" />
      </g>

      <g fill="#0B2440">
        <path d="M0 190 L0 156 C110 150 240 155 360 151 C450 148 500 153 540 150 L540 190 Z" />
        {xs.map((x, i) => figure(x, i))}
        <path d={arms} fill="none" stroke="#0B2440" strokeWidth="7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function Logo({ size = 120 }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
      <defs>
        <clipPath id="circle-clip"><circle cx="150" cy="150" r="145" /></clipPath>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8650a" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="150" r="148" fill="none" stroke="#4a1e08" strokeWidth="5" />
      <g clipPath="url(#circle-clip)">
        <rect x="0" y="0" width="300" height="300" fill="url(#sky)" />
        <circle cx="165" cy="105" r="22" fill="#fde047" opacity="0.9" />
        <polygon points="0,170 40,130 80,155 130,100 170,140 210,95 260,135 300,110 300,200 0,200" fill="#5b1a08" opacity="0.5" />
        <polygon points="35,130 40,105 45,130" fill="#4a1e08" />
        <polygon points="25,145 32,115 39,145" fill="#4a1e08" />
        <polygon points="50,140 55,118 60,140" fill="#4a1e08" />
        <polygon points="240,130 246,100 252,130" fill="#4a1e08" />
        <polygon points="255,140 260,115 265,140" fill="#4a1e08" />
        <polygon points="225,145 230,120 235,145" fill="#4a1e08" />
        <polygon points="60,210 150,75 240,210" fill="url(#mountain)" />
        <polygon points="150,75 170,95 155,95 175,115 158,112 185,145 140,145 165,115 148,118 133,95 145,95" fill="#fff" opacity="0.6" />
        <line x1="120" y1="120" x2="135" y2="115" stroke="#fff" strokeWidth="2" opacity="0.7" />
        <line x1="165" y1="110" x2="180" y2="108" stroke="#fff" strokeWidth="2" opacity="0.7" />
        <g transform="translate(62,82)" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.9">
          <line x1="0" y1="-8" x2="0" y2="8" />
          <line x1="-7" y1="-4" x2="7" y2="4" />
          <line x1="-7" y1="4" x2="7" y2="-4" />
          <line x1="-2" y1="-6" x2="2" y2="-6" /><line x1="-2" y1="6" x2="2" y2="6" />
          <line x1="5" y1="-5" x2="6" y2="-2" /><line x1="-5" y1="5" x2="-6" y2="2" />
          <line x1="5" y1="5" x2="6" y2="2" /><line x1="-5" y1="-5" x2="-6" y2="-2" />
        </g>
        <g transform="translate(108,148) rotate(-25)" fill="#4a1e08">
          <circle cx="0" cy="-6" r="3" />
          <line x1="0" y1="-3" x2="0" y2="7" stroke="#4a1e08" strokeWidth="2" />
          <line x1="0" y1="7" x2="-4" y2="13" stroke="#4a1e08" strokeWidth="1.5" />
          <line x1="0" y1="7" x2="4" y2="13" stroke="#4a1e08" strokeWidth="1.5" />
          <line x1="-5" y1="0" x2="6" y2="-3" stroke="#4a1e08" strokeWidth="1.5" />
          <line x1="-6" y1="12" x2="6" y2="15" stroke="#4a1e08" strokeWidth="1" />
        </g>
        <g transform="translate(175,78)" fill="#4a1e08">
          <path d="M-12,-12 Q0,-20 12,-12" stroke="#4a1e08" strokeWidth="1.5" fill="none" />
          <line x1="-10" y1="-12" x2="0" y2="-2" stroke="#4a1e08" strokeWidth="0.8" />
          <line x1="10" y1="-12" x2="0" y2="-2" stroke="#4a1e08" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="2" />
          <line x1="0" y1="2" x2="0" y2="7" stroke="#4a1e08" strokeWidth="1.2" />
        </g>
        <g transform="translate(238,78)" fill="#4a1e08">
          <circle cx="0" cy="-7" r="3" />
          <line x1="0" y1="-4" x2="2" y2="5" stroke="#4a1e08" strokeWidth="2" />
          <line x1="2" y1="5" x2="-1" y2="11" stroke="#4a1e08" strokeWidth="1.5" />
          <line x1="-3" y1="-1" x2="5" y2="-3" stroke="#4a1e08" strokeWidth="1.5" />
          <line x1="-4" y1="10" x2="4" y2="12" stroke="#4a1e08" strokeWidth="2" strokeLinecap="round" />
        </g>
        <rect x="0" y="195" width="300" height="110" fill="#fff" />
        <g stroke="#4a1e08" strokeWidth="1.2" fill="none">
          <line x1="85" y1="175" x2="85" y2="210" />
          <line x1="80" y1="178" x2="90" y2="175" />
          <line x1="85" y1="175" x2="195" y2="195" />
          <rect x="130" y="200" width="25" height="18" rx="3" stroke="#4a1e08" strokeWidth="1.2" />
          <line x1="135" y1="200" x2="140" y2="193" /><line x1="150" y1="200" x2="145" y2="195" />
          <circle cx="137" cy="210" r="2" fill="#4a1e08" /><circle cx="148" cy="210" r="2" fill="#4a1e08" />
        </g>
        <g transform="translate(220,215)" fill="#4a1e08">
          <circle cx="0" cy="-12" r="3" />
          <line x1="0" y1="-9" x2="-2" y2="0" stroke="#4a1e08" strokeWidth="2" />
          <line x1="-2" y1="0" x2="-6" y2="6" stroke="#4a1e08" strokeWidth="1.5" />
          <line x1="-2" y1="0" x2="3" y2="6" stroke="#4a1e08" strokeWidth="1.5" />
          <line x1="-3" y1="-5" x2="5" y2="-8" stroke="#4a1e08" strokeWidth="1.5" />
          <circle cx="-8" cy="8" r="7" fill="none" stroke="#4a1e08" strokeWidth="1.5" />
          <circle cx="7" cy="8" r="7" fill="none" stroke="#4a1e08" strokeWidth="1.5" />
        </g>
        <text x="150" y="55" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="26" fill="#4a1e08" fontWeight="700">Val d'Allos</text>
        <text x="150" y="185" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="36" fill="#4a1e08" fontWeight="700">Le Seignus</text>
        <text x="185" y="208" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="19" fill="#c2410c" fontWeight="600">Renaissance</text>
        <text x="95" y="268" textAnchor="middle" fontFamily="Arial, sans-serif" fontStyle="italic" fontSize="30" fill="#f59e0b" fontWeight="800">1400</text>
        <text x="210" y="268" textAnchor="middle" fontFamily="Arial, sans-serif" fontStyle="italic" fontSize="30" fill="#f59e0b" fontWeight="800">2425</text>
      </g>
    </svg>
  );
}
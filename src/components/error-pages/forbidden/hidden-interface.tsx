import { useId } from "react";

/**
 * Что лежит за барьером: фрагменты интерфейса системы — карточки, график,
 * столбцы, связанные узлы и салатовое ядро в центре. Без текста и цифр:
 * человек должен понять «там что-то есть», а не прочитать, что именно.
 *
 * Рисуется дважды — размытым (видно всегда) и чётким (в окне сканера и по
 * мере удержания), поэтому одной SVG из трёх десятков элементов, а не DOM.
 */
export function HiddenInterface({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const bg = `${id}-bg`;
  const core = `${id}-core`;
  const area = `${id}-area`;

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={bg} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#141c08" />
          <stop offset="60%" stopColor="#0a0b08" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <radialGradient id={core} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e9ff9c" />
          <stop offset="45%" stopColor="#b4e02d" />
          <stop offset="100%" stopColor="#b4e02d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={area} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b4e02d" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#b4e02d" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="400" height="400" fill={`url(#${bg})`} />
      <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
        <path d="M0 80H400M0 160H400M0 240H400M0 320H400M80 0V400M160 0V400M240 0V400M320 0V400" />
      </g>

      {/* Связи узлов вокруг ядра. */}
      <g stroke="rgba(180,224,45,0.35)" strokeWidth="1.2" fill="none">
        <path d="M200 200L118 150M200 200L282 128M200 200L300 270M200 200L110 268M118 150L282 128" />
      </g>

      {/* Карточка со строками. */}
      <rect
        x="52"
        y="104"
        width="128"
        height="86"
        rx="12"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.18)"
      />
      <rect x="66" y="118" width="40" height="8" rx="4" fill="#b4e02d" />
      <rect x="66" y="138" width="96" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
      <rect x="66" y="152" width="78" height="6" rx="3" fill="rgba(255,255,255,0.22)" />
      <rect x="66" y="166" width="88" height="6" rx="3" fill="rgba(255,255,255,0.22)" />

      {/* Карточка с графиком. */}
      <rect
        x="214"
        y="72"
        width="132"
        height="100"
        rx="12"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.18)"
      />
      <path
        d="M226 150 L250 132 L270 140 L292 110 L312 118 L334 92 L334 160 L226 160Z"
        fill={`url(#${area})`}
      />
      <path
        d="M226 150 L250 132 L270 140 L292 110 L312 118 L334 92"
        fill="none"
        stroke="#b4e02d"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Карточка со столбцами. */}
      <rect
        x="92"
        y="236"
        width="216"
        height="92"
        rx="12"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.18)"
      />
      <g fill="rgba(255,255,255,0.3)">
        <rect x="112" y="290" width="16" height="24" rx="3" />
        <rect x="140" y="276" width="16" height="38" rx="3" />
        <rect x="168" y="284" width="16" height="30" rx="3" />
        <rect x="224" y="268" width="16" height="46" rx="3" />
        <rect x="252" y="280" width="16" height="34" rx="3" />
        <rect x="280" y="262" width="16" height="52" rx="3" />
      </g>
      <rect x="196" y="256" width="16" height="58" rx="3" fill="#b4e02d" />

      {/* Узлы. */}
      <g fill="#0b0b0b" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5">
        <circle cx="118" cy="150" r="7" />
        <circle cx="282" cy="128" r="7" />
        <circle cx="300" cy="270" r="6" />
        <circle cx="110" cy="268" r="6" />
      </g>

      {/* Ядро системы — то, к чему не пускают. */}
      <circle cx="200" cy="200" r="58" fill={`url(#${core})`} opacity="0.55" />
      <circle cx="200" cy="200" r="24" fill="#0a0a0a" stroke="#b4e02d" strokeWidth="2" />
      <circle cx="200" cy="200" r="9" fill="#b4e02d" />
      <circle
        cx="200"
        cy="200"
        r="38"
        fill="none"
        stroke="rgba(180,224,45,0.5)"
        strokeDasharray="3 6"
      />
    </svg>
  );
}

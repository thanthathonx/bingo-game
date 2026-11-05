// Small line icons (24x24 grid, stroke based).

function Icon({ size = 20, children, strokeWidth = 2, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconSpeaker = (p) => (
  <Icon {...p}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18.5 7a7 7 0 0 1 0 10" />
  </Icon>
);
export const IconMuted = (p) => (
  <Icon {...p}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="m22 9-6 6M16 9l6 6" />
  </Icon>
);
export const IconGear = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icon>
);
export const IconSignIn = (p) => (
  <Icon {...p}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="m10 17 5-5-5-5" />
    <path d="M15 12H3" />
  </Icon>
);
export const IconMenu = (p) => (
  <Icon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);
export const IconClose = (p) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
export const IconMusic = (p) => (
  <Icon {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Icon>
);
export const IconSparkles = (p) => (
  <Icon {...p}>
    <path d="M10 3.5 11.6 8a2 2 0 0 0 1.3 1.3l4.6 1.6-4.6 1.6a2 2 0 0 0-1.3 1.3L10 18.4 8.4 13.8a2 2 0 0 0-1.3-1.3L2.5 10.9l4.6-1.6A2 2 0 0 0 8.4 8z" />
    <path d="M19 3v4M21 5h-4M18 17v3M19.5 18.5h-3" />
  </Icon>
);
export const IconCheck = (p) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
export const IconHelp = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </Icon>
);
export const IconMessage = (p) => (
  <Icon {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 7v4M12 14h.01" />
  </Icon>
);
export const IconCrown = (p) => (
  <Icon {...p}>
    <path d="M2 7l4.5 5L12 5l5.5 7L22 7l-2 12H4z" />
  </Icon>
);
export const IconKey = (p) => (
  <Icon {...p}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </Icon>
);
export const IconUsers = (p) => (
  <Icon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  </Icon>
);
export const IconSearch = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);
export const IconPlay = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m10 8 6 4-6 4z" />
  </Icon>
);
export const IconClock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);
export const IconGamepad = (p) => (
  <Icon {...p}>
    <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" />
    <rect x="2" y="6" width="20" height="12" rx="4" />
  </Icon>
);
export const IconCopy = (p) => (
  <Icon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
);
export const IconEye = (p) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const IconMinus = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);
export const IconShuffle = (p) => (
  <Icon {...p}>
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </Icon>
);
export const IconPause = (p) => (
  <Icon {...p}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </Icon>
);
export const IconTv = (p) => (
  <Icon {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="m17 2-5 5-5-5" />
  </Icon>
);
export const IconDoor = (p) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Icon>
);
export const IconShield = (p) => (
  <Icon {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Icon>
);
export const IconBook = (p) => (
  <Icon {...p}>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </Icon>
);
export const IconInfo = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Icon>
);
export const IconMail = (p) => (
  <Icon {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Icon>
);
export const IconArrowUp = (p) => (
  <Icon {...p}>
    <path d="m5 12 7-7 7 7M12 19V5" />
  </Icon>
);
export const IconRadio = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2" />
  </Icon>
);
export const IconChevron = (p) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

/** Simple drawn flags (placeholders, 24x16). */
export function Flag({ code, width = 24, height = 16 }) {
  const common = { width, height, viewBox: '0 0 24 16', 'aria-hidden': true };
  if (code === 'de') {
    return (
      <svg {...common}>
        <rect width="24" height="5.34" fill="#111" />
        <rect y="5.33" width="24" height="5.34" fill="#dd0000" />
        <rect y="10.66" width="24" height="5.34" fill="#ffce00" />
      </svg>
    );
  }
  if (code === 'es') {
    return (
      <svg {...common}>
        <rect width="24" height="16" fill="#c60b1e" />
        <rect y="4" width="24" height="8" fill="#ffc400" />
        <rect x="5" y="6" width="3" height="4" fill="#c60b1e" />
      </svg>
    );
  }
  if (code === 'pt-BR') {
    return (
      <svg {...common}>
        <rect width="24" height="16" fill="#009b3a" />
        <path d="M12 2 22 8 12 14 2 8z" fill="#fedf00" />
        <circle cx="12" cy="8" r="3.4" fill="#002776" />
      </svg>
    );
  }
  if (code === 'pt-PT') {
    return (
      <svg {...common}>
        <rect width="24" height="16" fill="#ff0000" />
        <rect width="9.6" height="16" fill="#006600" />
        <circle cx="9.6" cy="8" r="3" fill="#ffcc00" />
      </svg>
    );
  }
  if (code === 'zh-TW') {
    return (
      <svg {...common}>
        <rect width="24" height="16" rx="2" fill="#4b4f7a" />
        <text x="12" y="12.5" fontSize="10" textAnchor="middle" fill="#fff" fontWeight="700">繁</text>
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="1.3" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="2.8" />
    </svg>
  );
}

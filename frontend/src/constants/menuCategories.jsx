// Central category list + real SVG icons (no emojis anywhere).

export const CATEGORIES = ['Launch', 'Junk food', 'Drinks', 'Sweets']

const svgProps = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

/* Launch — fork + spoon (main meal) */
export const IconLaunch = ({ size = 18 }) => (
  <svg {...svgProps(size)}>
    <path d="M4 3v6a3 3 0 0 0 6 0V3" />
    <line x1="7" y1="12" x2="7" y2="21" />
    <path d="M16.5 3c-1.4 2-2 3.9-2 5.8 0 1.8.9 2.9 2 2.9s2-1.1 2-2.9c0-1.9-.6-3.8-2-5.8z" />
    <line x1="16.5" y1="11.7" x2="16.5" y2="21" />
  </svg>
)

/* Junk food — burger */
export const IconJunkFood = ({ size = 18 }) => (
  <svg {...svgProps(size)}>
    <path d="M3 10.5h18A4 4 0 0 0 17 7H7a4 4 0 0 0-4 3.5z" />
    <path d="M3.5 13.5h17" />
    <path d="M4 16.5h16A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5z" />
  </svg>
)

/* Drinks — cup with straw */
export const IconDrinks = ({ size = 18 }) => (
  <svg {...svgProps(size)}>
    <path d="M6 7h12l-1.4 12.2A2 2 0 0 1 14.6 21H9.4a2 2 0 0 1-2-1.8L6 7z" />
    <line x1="4.5" y1="7" x2="19.5" y2="7" />
    <line x1="13.5" y1="7" x2="16" y2="3" />
  </svg>
)

/* Sweets — cupcake */
export const IconSweets = ({ size = 18 }) => (
  <svg {...svgProps(size)}>
    <path d="M5.5 11h13l-1.3 8.3A2 2 0 0 1 15.2 21H8.8a2 2 0 0 1-2-1.7L5.5 11z" />
    <path d="M6.2 11a3.2 3.2 0 0 1 1.2-6 3.8 3.8 0 0 1 7.2-1.3A3 3 0 0 1 17.8 11" />
  </svg>
)

/* Generic helpers used by Menu / Transaction */
export const IconAll = ({ size = 18 }) => (
  <svg {...svgProps(size)}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </svg>
)
export const IconCheck = ({ size = 14 }) => (
  <svg {...svgProps(size)}><polyline points="20 6 9 17 4 12" /></svg>
)
export const IconWarn = ({ size = 14 }) => (
  <svg {...svgProps(size)}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
)
export const IconClose = ({ size = 14 }) => (
  <svg {...svgProps(size)}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
)
export const IconBox = ({ size = 13 }) => (
  <svg {...svgProps(size)}><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.3 7 12 12 20.7 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
)

const MAP = {
  'Launch': IconLaunch,
  'Junk food': IconJunkFood,
  'Drinks': IconDrinks,
  'Sweets': IconSweets,
}

export function CategoryIcon({ category, size = 18 }) {
  const C = MAP[category] || IconLaunch
  return <C size={size} />
}

export default CATEGORIES

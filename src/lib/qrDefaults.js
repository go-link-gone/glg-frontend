export const LOGO_SRC = '/GLG_Logo_square.png';

export const ECC_LEVELS = ['L', 'M', 'Q', 'H'];

export const SHAPES = ['square', 'circle'];

export const DOT_TYPES = [
  'square',
  'dots',
  'rounded',
  'extra-rounded',
  'classy',
  'classy-rounded',
  'dot',
  'random-dot',
  'vertical-line',
  'horizontal-line',
  'small-square',
  'tiny-square',
  'diamond',
  'wave',
  'heart',
  'star',
  'weave',
  'pentagon',
  'hexagon',
  'octagon',
  'circuit',
  'zebra-horizontal',
  'zebra-vertical',
  'blocks-horizontal',
  'blocks-vertical',
  'blobs',
  'soft',
];

export const CORNER_SQUARE_TYPES = [...DOT_TYPES, 'inpoint', 'outpoint', 'center-circle'];

export const CORNER_DOT_TYPES = [...DOT_TYPES, 'inpoint', 'outpoint'];

export const DEFAULT_QR_CONFIG = {
  width: 300,
  height: 300,
  shape: 'square',
  qrOptions: { errorCorrectionLevel: 'H' },
  dotsOptions: { type: 'square', color: '#000000' },
  cornersSquareOptions: { type: 'square', color: '#000000' },
  cornersDotOptions: { type: 'square', color: '#000000' },
  backgroundOptions: { color: '#ffffff' },
  imageOptions: { mode: 'center', imageSize: 0.45, margin: 1 },
  useLogo: true,
};

export function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
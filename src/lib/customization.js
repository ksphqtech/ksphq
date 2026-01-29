// Color Customization Management
// Handles custom theme colors and conversions

const STORAGE_KEY = 'customColors';

// Default theme colors extracted from CSS
export const DEFAULT_COLORS = {
  light: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    'card-foreground': '222.2 84% 4.9%',
    popover: '0 0% 100%',
    'popover-foreground': '222.2 84% 4.9%',
    primary: '222.2 47.4% 11.2%',
    'primary-foreground': '210 40% 98%',
    secondary: '210 40% 96.1%',
    'secondary-foreground': '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    'muted-foreground': '215.4 16.3% 46.9%',
    accent: '210 40% 96.1%',
    'accent-foreground': '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
    'destructive-foreground': '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '222.2 84% 4.9%',
  },
  gray: {
    background: '0 0% 100%',
    foreground: '224 71.4% 4.1%',
    card: '0 0% 100%',
    'card-foreground': '224 71.4% 4.1%',
    popover: '0 0% 100%',
    'popover-foreground': '224 71.4% 4.1%',
    primary: '220.9 39.3% 11%',
    'primary-foreground': '210 20% 98%',
    secondary: '220 14.3% 95.9%',
    'secondary-foreground': '220.9 39.3% 11%',
    muted: '220 14.3% 95.9%',
    'muted-foreground': '220 8.9% 46.1%',
    accent: '220 14.3% 95.9%',
    'accent-foreground': '220.9 39.3% 11%',
    destructive: '0 84.2% 60.2%',
    'destructive-foreground': '210 20% 98%',
    border: '220 13% 91%',
    input: '220 13% 91%',
    ring: '224 71.4% 4.1%',
  },
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    'card-foreground': '210 40% 98%',
    popover: '222.2 84% 4.9%',
    'popover-foreground': '210 40% 98%',
    primary: '210 40% 98%',
    'primary-foreground': '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    'secondary-foreground': '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    'muted-foreground': '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    'accent-foreground': '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    'destructive-foreground': '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '212.7 26.8% 83.9%',
  }
};

/**
 * Get default colors for a specific theme
 * @param {string} theme - Theme name (light, gray, dark)
 * @returns {Object} Default colors for theme
 */
export function getDefaultColors(theme) {
  return DEFAULT_COLORS[theme] || DEFAULT_COLORS.light;
}

/**
 * Get all custom colors from localStorage
 * @returns {Object} Custom colors by theme
 */
export function getCustomColors() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {};
  }
  return JSON.parse(stored);
}

/**
 * Save custom colors to localStorage
 * @param {Object} colors - Colors object by theme
 */
export function saveCustomColors(colors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

/**
 * Reset colors for a specific theme or all themes
 * @param {string} [theme] - Theme to reset (optional, resets all if omitted)
 */
export function resetColors(theme) {
  if (theme) {
    const colors = getCustomColors();
    delete colors[theme];
    saveCustomColors(colors);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Convert HEX color to HSL string
 * @param {string} hex - HEX color (#RRGGBB)
 * @returns {string} HSL string (H S% L%)
 */
export function hexToHsl(hex) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Convert HSL string to HEX color
 * @param {string} hsl - HSL string (H S% L%)
 * @returns {string} HEX color (#RRGGBB)
 */
export function hslToHex(hsl) {
  // Parse HSL values
  const parts = hsl.split(' ');
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Validate HSL string format
 * @param {string} hsl - HSL string
 * @returns {boolean} True if valid
 */
export function validateHslString(hsl) {
  const pattern = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/;
  return pattern.test(hsl);
}

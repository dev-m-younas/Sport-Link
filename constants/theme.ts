/**
 * App colors - Dark Space palette
 * #222831 black, #393E46 grey, #00ADB5 teal, #EEEEEE light
 */

import { Platform } from 'react-native';

const teal = '#00ADB5';
const black = '#222831';
const grey = '#393E46';
const light = '#EEEEEE';

export const Colors = {
  light: {
    text: black,
    textSecondary: grey,
    background: '#fff',
    tint: teal,
    icon: grey,
    tabIconDefault: grey,
    tabIconSelected: teal,
    // Surfaces
    card: '#F5F5F5',
    cardIconBg: 'rgba(0,173,181,0.12)',
    input: '#F5F5F5',
    border: '#E0E0E0',
    // Tab bar
    tabBarBg: '#fff',
    tabBarBorder: '#E0E0E0',
    // Buttons / chips
    buttonSecondary: '#F5F5F5',
    chipBg: 'rgba(0,173,181,0.12)',
    chipText: teal,
    // Semantic
    success: '#10B981',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    errorText: '#991B1B',
    warningBg: '#FEF3C7',
    placeholder: grey,
  },
  dark: {
    text: light,
    textSecondary: '#9BA1A6',
    background: black,
    tint: teal,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: teal,
    // Surfaces
    card: grey,
    cardIconBg: 'rgba(0,173,181,0.2)',
    input: grey,
    border: grey,
    // Tab bar
    tabBarBg: black,
    tabBarBorder: grey,
    // Buttons / chips
    buttonSecondary: grey,
    chipBg: 'rgba(0,173,181,0.2)',
    chipText: teal,
    // Semantic
    success: '#34D399',
    error: '#EF4444',
    errorBg: '#3C1F1F',
    errorText: '#FCA5A5',
    warningBg: '#422F1F',
    placeholder: '#9BA1A6',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

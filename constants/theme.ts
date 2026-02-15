/**
 * App colors for light and dark mode.
 * Use useThemeColors() or useThemeColor() to get current scheme colors.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#5eb8e6';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Surfaces
    card: '#F1F3F4',
    cardIconBg: '#E6F4FE',
    input: '#F1F3F4',
    border: '#E5E5E5',
    // Tab bar
    tabBarBg: '#fff',
    tabBarBorder: '#E5E5E5',
    // Buttons / chips
    buttonSecondary: '#F1F3F4',
    chipBg: '#E6F4FE',
    chipText: tintColorLight,
    // Semantic
    success: '#10B981',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    errorText: '#991B1B',
    warningBg: '#FEF3C7',
    placeholder: '#687076',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Surfaces
    card: '#2C2E31',
    cardIconBg: '#1D3D47',
    input: '#2C2E31',
    border: '#2C2E31',
    // Tab bar
    tabBarBg: '#1C1C1E',
    tabBarBorder: '#2C2E31',
    // Buttons / chips
    buttonSecondary: '#2C2E31',
    chipBg: '#1D3D47',
    chipText: tintColorDark,
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

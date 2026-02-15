import { useMemo } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export type ThemeColors = typeof Colors.light;

export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme() ?? 'light';
  return useMemo(() => Colors[colorScheme], [colorScheme]);
}

export function useIsDark(): boolean {
  const colorScheme = useColorScheme() ?? 'light';
  return colorScheme === 'dark';
}

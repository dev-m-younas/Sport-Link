import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme] as typeof Colors.light;

  const iconMap: Record<string, string> = {
    index: 'home',
    players: 'account-group',
    chat: 'message-text',
    notifications: 'bell',
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.tabBarBg,
          paddingBottom: insets.bottom,
          borderTopColor: theme.tabBarBorder,
        },
      ]}>
      {/* Home and Players - Left */}
      {state.routes
        .filter((route) => route.name === 'index' || route.name === 'players')
        .map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = iconMap[route.name] || 'circle';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}>
              <MaterialCommunityIcons
                name={iconName}
                size={28}
                color={isFocused ? theme.tint : theme.tabIconDefault}
              />
            </TouchableOpacity>
          );
        })}

      {/* Plus Button - Center */}
      <View style={styles.plusButtonContainer}>
        <TouchableOpacity
          style={[
            styles.plusButton,
            {
              backgroundColor: theme.tint,
            },
          ]}
          onPress={() => router.push('/create-activity')}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat and Notifications - Right */}
      {state.routes
        .filter((route) => route.name === 'chat' || route.name === 'notifications')
        .map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = iconMap[route.name] || 'circle';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}>
              <MaterialCommunityIcons
                name={iconName}
                size={28}
                color={isFocused ? theme.tint : theme.tabIconDefault}
              />
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    minHeight: Platform.OS === 'ios' ? 88 : 75,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
  },
  plusButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

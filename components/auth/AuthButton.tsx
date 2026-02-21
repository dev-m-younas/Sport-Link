import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  loadingTitle?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'google';
  disabled?: boolean;
  style?: ViewStyle;
};

export function AuthButton({
  title,
  onPress,
  loading = false,
  loadingTitle,
  variant = 'primary',
  disabled = false,
  style,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;
  const displayText = loading && loadingTitle ? loadingTitle : title;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {loading ? (
        <>
          <ActivityIndicator
            color={
              variant === 'google'
                ? '#333'
                : variant === 'outline' || variant === 'secondary'
                  ? '#00ADB5'
                  : '#fff'
            }
            size="small"
          />
          <Text
            style={[
              styles.text,
              variant === 'google'
                ? styles.textGoogle
                : variant === 'outline' || variant === 'secondary'
                  ? styles.textSecondary
                  : styles.textPrimary,
            ]}>
            {displayText}
          </Text>
        </>
      ) : (
        <>
          {variant === 'google' && (
            <Image
              source={require('@/assets/images/google-logo.png')}
              style={styles.googleLogo}
              contentFit="contain"
            />
          )}
          <Text
            style={[
              styles.text,
              variant === 'google'
                ? styles.textGoogle
                : variant === 'outline' || variant === 'secondary'
                  ? styles.textSecondary
                  : styles.textPrimary,
            ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primary: {
    backgroundColor: '#00ADB5',
  },
  secondary: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ADB5',
  },
  google: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textPrimary: {
    color: '#fff',
  },
  textSecondary: {
    color: '#00ADB5',
  },
  textGoogle: {
    color: '#333',
  },
  googleLogo: {
    width: 100,
    height: 33,
  },
});

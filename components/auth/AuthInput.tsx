import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  Platform,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

type AuthInputProps = TextInputProps & {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
};

export function AuthInput({
  label,
  error,
  style,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePasswordVisibility,
  secureTextEntry,
  ...props
}: AuthInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText style={styles.label}>{label}</ThemedText>
      ) : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            isDark ? styles.inputDark : styles.inputLight,
            error ? styles.inputError : null,
            showPasswordToggle ? styles.inputWithIcon : null,
          ]}
          placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onTogglePasswordVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={isDark ? '#9BA1A6' : '#687076'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputLight: {
    backgroundColor: '#F1F3F4',
    color: '#11181C',
  },
  inputDark: {
    backgroundColor: '#393E46',
    color: '#ECEDEE',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#E53935',
  },
  iconButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
    marginLeft: 4,
  },
});

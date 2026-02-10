import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

type AuthInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function AuthInput({ label, error, style, ...props }: AuthInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText style={styles.label}>{label}</ThemedText>
      ) : null}
      <TextInput
        style={[
          styles.input,
          isDark ? styles.inputDark : styles.inputLight,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
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
  inputLight: {
    backgroundColor: '#F1F3F4',
    color: '#11181C',
  },
  inputDark: {
    backgroundColor: '#2C2E31',
    color: '#ECEDEE',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#E53935',
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
    marginLeft: 4,
  },
});

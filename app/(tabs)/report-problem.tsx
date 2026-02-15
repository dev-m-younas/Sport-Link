import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuth } from '@/contexts/AuthContext';
import { submitReport, REPORT_CATEGORIES } from '@/lib/reports';
import { showToast } from '@/lib/toast';

export default function ReportProblemScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const isDark = colors.background === '#151718';
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0].id);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!description.trim()) {
      showToast.error('Required', 'Please describe your problem');
      return;
    }

    try {
      setSubmitting(true);
      await submitReport(user, category, description.trim());
      showToast.success('Report sent', 'Thank you. We will look into it.');
      setDescription('');
      router.back();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      showToast.error('Error', error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Report a Problem
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.subtitle}>
            Describe the issue you're facing. We'll get back to you.
          </ThemedText>

          <ThemedText style={styles.label}>Category</ThemedText>
          <View style={styles.categoryGrid}>
            {REPORT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: category === cat.id ? colors.tint : colors.chipBg },
                  category === cat.id && { borderColor: colors.tint },
                ]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.id ? '#fff' : colors.tint}
                />
                <ThemedText
                  style={[
                    styles.categoryChipText,
                    { color: category === cat.id ? '#fff' : colors.chipText },
                  ]}
                  numberOfLines={1}>
                  {cat.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <ThemedText style={styles.label}>Describe your problem *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us what went wrong or what you need help with..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
            editable={!submitting}
          />
          <ThemedText style={styles.charCount}>{description.length}/1000</ThemedText>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                <ThemedText style={styles.submitButtonText}>Submit Report</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    maxWidth: 120,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 100,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 140,
    maxHeight: 200,
    marginBottom: 8,
  },
  inputDark: {
    backgroundColor: '#2C2E31',
    color: '#ECEDEE',
  },
  charCount: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

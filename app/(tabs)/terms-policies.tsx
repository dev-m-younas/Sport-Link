import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function TermsPoliciesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24), borderBottomColor: colors.border }]}>
        <ThemedText type="title">Terms & Policies</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Terms of Service</ThemedText>
          <ThemedText style={styles.sectionText}>
            By using Sport Link, you agree to these terms of service. You are responsible for maintaining the confidentiality of your account and password.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>User Conduct</ThemedText>
          <ThemedText style={styles.sectionText}>
            Users must conduct themselves respectfully and responsibly when creating and participating in activities. Harassment, discrimination, or any form of inappropriate behavior will not be tolerated.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Privacy Policy</ThemedText>
          <ThemedText style={styles.sectionText}>
            We respect your privacy and are committed to protecting your personal information. Your location data is used solely to show activities within your area and is not shared with third parties.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Activity Safety</ThemedText>
          <ThemedText style={styles.sectionText}>
            Sport Link is a platform for connecting users. We are not responsible for the safety or conduct of activities. Please exercise caution and use your best judgment when participating in activities.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Content Guidelines</ThemedText>
          <ThemedText style={styles.sectionText}>
            All content posted must be appropriate and related to sports activities. Inappropriate content will be removed, and users may be banned from the platform.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contact</ThemedText>
          <ThemedText style={styles.sectionText}>
            If you have any questions about these terms and policies, please contact us through the app support channels.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },
});

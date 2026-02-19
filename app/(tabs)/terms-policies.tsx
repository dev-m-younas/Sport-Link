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
            Sport Link is committed to protecting your privacy. This summary covers how we collect, use, and share your information.
          </ThemedText>
          <ThemedText style={[styles.sectionText, styles.subSection]}>
            Information we collect: (1) Account & profile — name, email, phone, date of birth, gender, country, city, profile photo, sports interests, expertise level. (2) Location — used only to show activities and players near you and to set activity locations; not sold to third parties. (3) Activity data — activities you create or join, chat messages, join requests. (4) Push token — to send join requests, chat notifications, and activity reminders (with your permission).
          </ThemedText>
          <ThemedText style={[styles.sectionText, styles.subSection]}>
            We use Firebase and Google Sign-In to run the app; Expo for push notifications. We do not sell your data. Other users may see your profile and activity-related info as needed for the app. You can update or delete your account, revoke location or notification permissions in device settings, and contact us for data requests or questions via Report a problem in the app.
          </ThemedText>
          <ThemedText style={[styles.sectionText, styles.subSection]}>
            Full Privacy Policy: See PRIVACY_POLICY.md in the app project or request a copy from support. Last updated: February 2026.
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
  subSection: {
    marginTop: 10,
  },
});

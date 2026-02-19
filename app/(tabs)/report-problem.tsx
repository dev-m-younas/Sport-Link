import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { AuthButton } from "@/components/auth/AuthButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAuth } from "@/contexts/AuthContext";
import { submitReport, REPORT_CATEGORIES } from "@/lib/reports";
import { showToast } from "@/lib/toast";

export default function ReportProblemScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const isDark = colors.background === "#222831";
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0].id);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!description.trim()) {
      showToast.error("Required", "Please describe your problem");
      return;
    }

    try {
      setSubmitting(true);
      await submitReport(user, category, description.trim());
      showToast.success("Report sent", "Thank you. We will look into it.");
      setDescription("");
      router.back();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      showToast.error("Error", error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 24),
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info banner */}
          <View
            style={[
              styles.infoBanner,
              isDark ? styles.infoBannerDark : styles.infoBannerLight,
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={22}
              color="#00ADB5"
            />
            <ThemedText style={styles.infoBannerText}>
              Describe the issue you're facing. We'll review and get back to you
              as soon as possible.
            </ThemedText>
          </View>

          {/* Category */}
          <ThemedText style={styles.label}>Select category</ThemedText>
          <View style={styles.categoryList}>
            {REPORT_CATEGORIES.map((cat) => {
              const selected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: selected
                        ? isDark
                          ? "rgba(10,126,164,0.2)"
                          : "rgba(0,173,181,0.15)"
                        : colors.card,
                      borderColor: selected ? "#00ADB5" : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.categoryIconWrap,
                      {
                        backgroundColor: selected
                          ? "#00ADB5"
                          : isDark
                            ? "rgba(0,173,181,0.2)"
                            : "rgba(0,173,181,0.15)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={22}
                      color={selected ? "#fff" : "#00ADB5"}
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.categoryCardText,
                      selected && { color: "#00ADB5", fontWeight: "600" },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </ThemedText>
                  {selected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="#00ADB5"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <ThemedText style={styles.label}>Describe your problem *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us what went wrong, what you expected, and any steps to reproduce..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
            editable={!submitting}
          />
          <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
            {description.length}/1000
          </ThemedText>

          {/* Submit */}
          <AuthButton
            title="Submit Report"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitButton}
          />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
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
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  infoBannerLight: {
    backgroundColor: "rgba(0,173,181,0.15)",
  },
  infoBannerDark: {
    backgroundColor: "rgba(10,126,164,0.15)",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.95,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  categoryList: {
    gap: 10,
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 14,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardText: {
    flex: 1,
    fontSize: 15,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 160,
    maxHeight: 220,
    borderWidth: 1,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
});

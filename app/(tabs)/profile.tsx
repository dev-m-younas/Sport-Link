import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { getUserProfile, type UserProfile } from "@/lib/userProfile";

const MENU_ITEMS = [
  {
    id: "edit-profile",
    label: "Edit Profile",
    icon: "account-edit",
    route: "/(tabs)/edit-profile",
  },
  {
    id: "my-activities",
    label: "My Activities",
    icon: "calendar-check",
    route: "/(tabs)/my-activities",
  },
  {
    id: "scheduled",
    label: "Scheduled Activities",
    icon: "calendar-clock",
    route: "/(tabs)/scheduled-activities",
  },
] as const;

const SUPPORT_ITEMS = [
  {
    id: "terms",
    label: "Terms & Policies",
    icon: "file-document-outline",
    route: "/(tabs)/terms-policies",
  },
  {
    id: "report",
    label: "Report a Problem",
    icon: "alert-circle-outline",
    route: "/(tabs)/report-problem",
  },
] as const;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = colors.background === "#222831";
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/(auth)/sign-in");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00ADB5" />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  const displayName =
    profile?.name || user?.displayName || user?.email || "User";
  const displayEmail = profile?.email || user?.email || "";
  const subtitle = profile?.city
    ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
    : displayEmail;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 8, 24),
            paddingBottom: Math.max(insets.bottom, 24) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedText type="title" style={styles.headerTitle}>
          Profile
        </ThemedText>

        {/* Profile Card */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.push("/(tabs)/edit-profile")}
          activeOpacity={0.8}
        >
          <View style={styles.profileImageWrap}>
            {profile?.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={[styles.profileImage, { borderColor: colors.tint }]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  {
                    backgroundColor: isDark ? "rgba(0,173,181,0.2)" : "rgba(0,173,181,0.15)",
                    borderColor: colors.tint,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={48}
                  color={colors.tint}
                />
              </View>
            )}
            <View
              style={[
                styles.editBadge,
                { backgroundColor: "#00ADB5" },
              ]}
            >
              <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName} numberOfLines={1}>
              {displayName}
            </ThemedText>
            {subtitle ? (
              <ThemedText
                style={[styles.profileSubtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.icon}
          />
        </TouchableOpacity>

        {/* Account section */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Account
        </ThemedText>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                idx < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  { backgroundColor: isDark ? "rgba(0,173,181,0.2)" : "rgba(0,173,181,0.15)" },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={22}
                  color="#00ADB5"
                />
              </View>
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support section */}
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: colors.textSecondary, marginTop: 28 },
          ]}
        >
          Support
        </ThemedText>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {SUPPORT_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                idx < SUPPORT_ITEMS.length - 1 && styles.menuItemBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  { backgroundColor: isDark ? "rgba(0,173,181,0.2)" : "rgba(0,173,181,0.15)" },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={22}
                  color="#00ADB5"
                />
              </View>
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[
            styles.logoutCard,
            {
              backgroundColor: isDark ? "#3C1F1F" : "#FEE2E2",
              borderColor: isDark ? "#4B2525" : "#FECACA",
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.logoutIconWrap,
              { backgroundColor: "rgba(239,68,68,0.2)" },
            ]}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
          </View>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#EF4444"
          />
        </TouchableOpacity>

        {/* App version */}
        <ThemedText
          style={[
            styles.versionText,
            { color: colors.textSecondary },
          ]}
        >
          Sport Link • v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    marginBottom: 28,
  },
  profileImageWrap: {
    position: "relative",
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  profileImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  editBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginTop: 28,
  },
  logoutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
  },
});

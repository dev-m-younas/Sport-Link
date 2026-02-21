import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthButton } from "@/components/auth/AuthButton";
import { LocationMapPicker } from "@/components/LocationMapPicker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "@/components/ui/Dropdown";
import { ACTIVITIES, EXPERTISE_LEVELS, getActivityConfig, getRequiredMembersRange } from "@/constants/activities";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { saveActivity } from "@/lib/activities";
import { showToast } from "@/lib/toast";
import { getUserProfile } from "@/lib/userProfile";

// Dropdown options from onboarding lists
const ACTIVITY_OPTIONS = ACTIVITIES.map((a) => ({
  label: a.name,
  value: a.id,
}));
const LEVEL_OPTIONS = EXPERTISE_LEVELS.map((l) => ({
  label: l.label,
  value: l.value,
}));

export default function CreateActivityScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(5);
  const [requiredMembers, setRequiredMembers] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const notesInputRef = useRef<TextInput>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  const handleVideoUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast.error(
          "Media Permission Required",
          "Please enable photo library permission in settings to upload videos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        showToast.success(
          "Video Uploaded",
          "Your video has been uploaded successfully.",
        );
      }
    } catch (error: any) {
      showToast.error(
        "Upload Error",
        error?.message || "Failed to upload video. Please try again.",
      );
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!selectedActivity) {
      showToast.error(
        "Missing Field",
        "Please select an activity (e.g. Football, Cricket).",
      );
      return;
    }

    if (!selectedLevel) {
      showToast.error(
        "Missing Field",
        "Please select a level (Beginner, Intermediate or Pro).",
      );
      return;
    }

    if (!location.trim() || locationLat === null || locationLng === null) {
      showToast.error("Missing Field", "Please select location on map.");
      return;
    }

    if (!user) {
      showToast.error("Not Signed In", "Please sign in to create an activity.");
      return;
    }

    setIsLoading(true);
    // Allow loading UI to render before blocking
    await new Promise((r) => setTimeout(r, 50));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast.error(
          "Location Permission Required",
          "We need your location to convert the address to coordinates.",
        );
        setIsLoading(false);
        return;
      }

      // Run location + profile in parallel for faster UX
      const [{ coords }, profile] = await Promise.all([
        Location.getCurrentPositionAsync({}),
        getUserProfile(user.uid),
      ]);

      const config = getActivityConfig(selectedActivity);
      const activityType = config?.type ?? "open";
      const maxPlayers = config?.type === "limited" ? config.maxPlayers : undefined;
      const minPlayersPerTeam = config?.type === "team" ? (playersPerTeam || config.minPlayersPerTeam) : undefined;

      await saveActivity(user, {
        requiredMembers,
        activity: selectedActivity,
        creatorName: profile?.name || undefined,
        activityType,
        maxPlayers,
        minPlayersPerTeam,
        level: selectedLevel,
        date: selectedDate.toISOString(),
        time: selectedTime.toISOString(),
        location: location.trim(),
        locationLat: locationLat!,
        locationLong: locationLng!,
        notes: notes.trim() || undefined,
        videoUri: videoUri || undefined,
        creatorLat: coords.latitude,
        creatorLong: coords.longitude,
      });

      // Also update user profile with current location for Players screen
      try {
        const { saveUserProfile } = await import("@/lib/userProfile");
        await saveUserProfile(user, {
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      } catch (error) {
        console.warn("Failed to update user location in profile:", error);
        // Don't fail activity creation if profile update fails
      }

      showToast.success(
        "Activity Created!",
        "Your activity has been created and will show to users within 15km.",
      );

      setTimeout(() => router.back(), 600);
    } catch (error: any) {
      console.error("Create activity error:", error);
      const errorMessage =
        error?.message ||
        error?.code ||
        "Failed to create activity. Please check your connection and try again.";
      showToast.error("Creation Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={isDark ? "#ECEDEE" : "#11181C"}
            />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Create Activity
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            keyboardDismissMode="interactive"
          >
            {/* Activity Selection - same list as onboarding (Football, Cricket, etc.) */}
            <Dropdown
              label="Select Activity"
              options={ACTIVITY_OPTIONS}
              selectedValue={selectedActivity}
              onSelect={(v) => {
                setSelectedActivity(v);
                if (v) {
                  const range = getRequiredMembersRange(v);
                  setRequiredMembers(range.min);
                }
              }}
              placeholder="e.g. Football, Cricket, Tennis"
              triggerIcon="soccer"
            />

            {/* Required Members - kitne members chahiye */}
            {selectedActivity && (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Required Members</ThemedText>
                <ThemedText style={styles.hintText}>
                  Kitne members aapko chahiye? (e.g. Cricket: 4, Padel: 1 ya 2)
                </ThemedText>
                <View style={styles.playersRow}>
                  {(() => {
                    const range = getRequiredMembersRange(selectedActivity);
                    const options = [];
                    for (let n = range.min; n <= range.max; n++) {
                      options.push(n);
                    }
                    return options.map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.playerChip,
                          requiredMembers === n && styles.playerChipActive,
                          isDark && styles.playerChipDark,
                          requiredMembers === n && isDark && styles.playerChipActiveDark,
                        ]}
                        onPress={() => setRequiredMembers(n)}
                      >
                        <ThemedText
                          style={[
                            styles.playerChipText,
                            requiredMembers === n && styles.playerChipTextActive,
                          ]}
                        >
                          {n}
                        </ThemedText>
                      </TouchableOpacity>
                    ));
                  })()}
                </View>
              </View>
            )}

            {/* Level Selection - same as onboarding (Beginner, Intermediate, Pro) */}
            <Dropdown
              label="Select Level"
              options={LEVEL_OPTIONS}
              selectedValue={selectedLevel}
              onSelect={setSelectedLevel}
              placeholder="Beginner, Intermediate or Pro"
              triggerIcon="trophy"
            />

            {/* Players per team - only for team activities */}
            {selectedActivity && getActivityConfig(selectedActivity)?.type === "team" && (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Players per team (min 5)</ThemedText>
                <View style={styles.playersRow}>
                  {[5, 6, 7, 8, 9, 10, 11].map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.playerChip,
                        playersPerTeam === n && styles.playerChipActive,
                        isDark && styles.playerChipDark,
                        playersPerTeam === n && isDark && styles.playerChipActiveDark,
                      ]}
                      onPress={() => setPlayersPerTeam(n)}
                    >
                      <ThemedText
                        style={[
                          styles.playerChipText,
                          playersPerTeam === n && styles.playerChipTextActive,
                        ]}
                      >
                        {n}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
                <ThemedText style={styles.hintText}>
                  Kya aap ke paas team hai? Har team main kitne players chahiye
                </ThemedText>
              </View>
            )}

            {/* Info for limited (max 4) and open */}
            {selectedActivity && getActivityConfig(selectedActivity)?.type === "limited" && (
              <View style={[styles.infoBanner, isDark && styles.infoBannerDark]}>
                <MaterialCommunityIcons name="account-group" size={20} color="#00ADB5" />
                <ThemedText style={styles.infoBannerText}>Max 4 players</ThemedText>
              </View>
            )}
            {/* Date Selection */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Select Date</ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  isDark ? styles.dateButtonDark : styles.dateButtonLight,
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.dateText,
                    isDark ? styles.dateTextDark : styles.dateTextLight,
                  ]}
                >
                  {formatDate(selectedDate)}
                </Text>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={isDark ? "#9BA1A6" : "#687076"}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Time Selection */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Select Time</ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  isDark ? styles.dateButtonDark : styles.dateButtonLight,
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text
                  style={[
                    styles.dateText,
                    isDark ? styles.dateTextDark : styles.dateTextLight,
                  ]}
                >
                  {formatTime(selectedTime)}
                </Text>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={isDark ? "#9BA1A6" : "#687076"}
                />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Location - Map Picker */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Where will it be?</ThemedText>
              <TouchableOpacity
                style={[
                  styles.mapButton,
                  isDark ? styles.mapButtonDark : styles.mapButtonLight,
                ]}
                onPress={() => setShowMapPicker(true)}
                activeOpacity={0.7}
              >
                {location ? (
                  <View style={styles.locationSelected}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={20}
                      color="#00ADB5"
                    />
                    <View style={styles.locationTextContainer}>
                      <Text
                        style={[
                          styles.locationText,
                          isDark
                            ? styles.locationTextDark
                            : styles.locationTextLight,
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {location}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.locationPlaceholder}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={20}
                      color={isDark ? "#9BA1A6" : "#687076"}
                    />
                    <Text
                      style={[
                        styles.mapButtonText,
                        isDark
                          ? styles.mapButtonTextDark
                          : styles.mapButtonTextLight,
                      ]}
                    >
                      Select location on map
                    </Text>
                  </View>
                )}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={isDark ? "#9BA1A6" : "#687076"}
                />
              </TouchableOpacity>
            </View>

            {/* Map Picker Modal */}
            <LocationMapPicker
              visible={showMapPicker}
              onClose={() => setShowMapPicker(false)}
              onLocationSelect={(loc) => {
                console.log("Location selected:", loc);
                // Set address - if address is just coordinates, use it; otherwise use address
                // Check if address is actually an address or just coordinates
                const isCoordinatesOnly = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(
                  loc.address || "",
                );

                if (loc.address && !isCoordinatesOnly) {
                  // Use the address if it's a real address
                  setLocation(loc.address);
                } else {
                  // Use coordinates formatted nicely
                  setLocation(`${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`);
                }

                setLocationLat(Number(loc.lat));
                setLocationLng(Number(loc.lng));
                console.log("Location state updated:", {
                  address: loc.address,
                  lat: Number(loc.lat),
                  lng: Number(loc.lng),
                });
              }}
              initialLocation={
                locationLat !== null && locationLng !== null
                  ? { lat: locationLat, lng: locationLng }
                  : undefined
              }
            />

            {/* Video Upload */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Video (Optional)</ThemedText>
              <TouchableOpacity
                style={[
                  styles.videoButton,
                  isDark ? styles.videoButtonDark : styles.videoButtonLight,
                ]}
                onPress={handleVideoUpload}
              >
                <MaterialCommunityIcons
                  name={videoUri ? "check-circle" : "video-plus"}
                  size={24}
                  color={videoUri ? "#00ADB5" : isDark ? "#9BA1A6" : "#687076"}
                />
                <Text
                  style={[
                    styles.videoText,
                    isDark ? styles.videoTextDark : styles.videoTextLight,
                  ]}
                >
                  {videoUri ? "Video uploaded" : "Upload video"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Notes</ThemedText>
              <TextInput
                ref={notesInputRef}
                style={[
                  styles.notesInput,
                  isDark ? styles.notesInputDark : styles.notesInputLight,
                ]}
                placeholder="Add notes about the activity..."
                placeholderTextColor={isDark ? "#9BA1A6" : "#687076"}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => {
                  // Let KeyboardAvoidingView handle the scroll automatically
                  // No manual scroll needed
                }}
              />
            </View>

            {/* Submit Button */}
            <AuthButton
              title="Create Activity"
              loadingTitle="Creating activity..."
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 150,
  },
  inputContainer: {
    marginBottom: 16,
  },
  playersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  playerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#dadce0",
    backgroundColor: "#F1F3F4",
  },
  playerChipDark: {
    borderColor: "#3C3E42",
    backgroundColor: "#393E46",
  },
  playerChipActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.15)",
  },
  playerChipActiveDark: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(10,126,164,0.2)",
  },
  playerChipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  playerChipTextActive: {
    color: "#00ADB5",
  },
  hintText: {
    fontSize: 13,
    opacity: 0.7,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,173,181,0.15)",
    marginBottom: 16,
  },
  infoBannerDark: {
    backgroundColor: "rgba(10,126,164,0.15)",
  },
  infoBannerText: {
    fontSize: 14,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateButton: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButtonLight: {
    backgroundColor: "#F1F3F4",
  },
  dateButtonDark: {
    backgroundColor: "#393E46",
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
  dateTextLight: {
    color: "#11181C",
  },
  dateTextDark: {
    color: "#ECEDEE",
  },
  placeholderText: {
    opacity: 0.5,
  },
  videoButton: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  videoButtonLight: {
    backgroundColor: "#F1F3F4",
  },
  videoButtonDark: {
    backgroundColor: "#393E46",
  },
  videoText: {
    fontSize: 16,
  },
  videoTextLight: {
    color: "#11181C",
  },
  videoTextDark: {
    color: "#ECEDEE",
  },
  mapButton: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapButtonLight: {
    backgroundColor: "#F1F3F4",
  },
  mapButtonDark: {
    backgroundColor: "#393E46",
  },
  locationPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  locationSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  locationTextContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  locationText: {
    fontSize: 16,
    lineHeight: 20,
  },
  locationTextLight: {
    color: "#11181C",
  },
  locationTextDark: {
    color: "#ECEDEE",
  },
  locationCoords: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  locationCoordsLight: {
    color: "#687076",
  },
  locationCoordsDark: {
    color: "#9BA1A6",
  },
  mapButtonText: {
    fontSize: 16,
    flex: 1,
  },
  mapButtonTextLight: {
    color: "#687076",
  },
  mapButtonTextDark: {
    color: "#9BA1A6",
  },
  hint: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 6,
  },
  notesInput: {
    minHeight: 100,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    textAlignVertical: "top",
  },
  notesInputLight: {
    backgroundColor: "#F1F3F4",
    color: "#11181C",
  },
  notesInputDark: {
    backgroundColor: "#393E46",
    color: "#ECEDEE",
  },
  submitButton: {
    marginTop: 8,
  },
});

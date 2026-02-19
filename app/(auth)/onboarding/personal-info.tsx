import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { CityDropdown } from "@/components/auth/CityDropdown";
import { CountryDropdown } from "@/components/auth/CountryDropdown";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Country } from "@/lib/countries";
import { showToast } from "@/lib/toast";
import type { Gender } from "@/lib/userProfile";

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] =
    useState<Country | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>("other");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const isValid =
    name.trim() &&
    email.trim() &&
    phoneNumber.trim() &&
    selectedCountryCode &&
    selectedCountry &&
    city;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast.error(
          "Permission Required",
          "Please enable photo library permission in settings.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0 &&
        result.assets[0]?.uri
      ) {
        setProfileImage(result.assets[0].uri);
      } else if (result.canceled) {
        // User canceled, do nothing
        return;
      } else {
        showToast.error("Error", "No image selected or image data is invalid");
      }
    } catch (error: any) {
      showToast.error("Error", error?.message || "Failed to pick image");
    }
  };

  const handleNext = () => {
    if (!isValid) return;
    const fullPhoneNumber = selectedCountryCode
      ? `${selectedCountryCode.phoneCode}${phoneNumber.trim()}`
      : phoneNumber.trim();

    router.push({
      pathname: "/(auth)/onboarding/activities",
      params: {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: fullPhoneNumber,
        dateOfBirth: dateOfBirth.toISOString().split("T")[0],
        gender,
        country: selectedCountry?.name || "",
        countryCode: selectedCountry?.code || "",
        city: city || "",
        // Only include profileImage if it has a value, otherwise don't include it
        ...(profileImage ? { profileImage } : {}),
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Personal Information
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Tell us about yourself
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Profile Image */}
              <View style={styles.profileImageContainer}>
                <TouchableOpacity onPress={handleImagePick} activeOpacity={0.8}>
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.profileImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.profileImagePlaceholder,
                        isDark && styles.profileImagePlaceholderDark,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="camera"
                        size={32}
                        color="#00ADB5"
                      />
                    </View>
                  )}
                  <View
                    style={[styles.editIcon, isDark && styles.editIconDark]}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={16}
                      color="#fff"
                    />
                  </View>
                </TouchableOpacity>
                <ThemedText style={styles.profileImageLabel}>
                  Profile Photo (Optional)
                </ThemedText>
              </View>

              <AuthInput
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                textContentType="name"
              />

              <AuthInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!user?.email}
              />

              <PhoneInput
                label="Phone Number"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                selectedCountry={selectedCountryCode}
                onCountrySelect={(country) => {
                  setSelectedCountryCode(country);
                  // Auto-select country dropdown when phone country code is selected
                  setSelectedCountry(country);
                  // Reset city when country changes
                  setCity(null);
                }}
              />

              {/* Date of Birth */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Date of Birth</ThemedText>
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
                    {formatDate(dateOfBirth)}
                  </Text>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={isDark ? "#9BA1A6" : "#687076"}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Gender Selection */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Gender</ThemedText>
                <View style={styles.genderContainer}>
                  {(["male", "female", "other"] as Gender[]).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderButton,
                        gender === g && styles.genderButtonActive,
                        isDark && styles.genderButtonDark,
                        gender === g && isDark && styles.genderButtonActiveDark,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === g && styles.genderTextActive,
                          isDark && styles.genderTextDark,
                        ]}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <CountryDropdown
                label="Country"
                selectedCountry={selectedCountry}
                onSelect={(country) => {
                  setSelectedCountry(country);
                  // Auto-set phone country code if not already set
                  if (!selectedCountryCode) {
                    setSelectedCountryCode(country);
                  }
                  // Reset city when country changes
                  setCity(null);
                }}
              />

              {selectedCountry && (
                <CityDropdown
                  label="City"
                  selectedCity={city}
                  onSelect={setCity}
                  countryCode={selectedCountry.code}
                  placeholder="Select your city"
                />
              )}

              <AuthButton
                title="Continue"
                onPress={handleNext}
                disabled={!isValid}
              />
            </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
    fontSize: 28,
  },
  subtitle: {
    opacity: 0.8,
    textAlign: "center",
    fontSize: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
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
    backgroundColor: "#2C2E31",
  },
  dateText: {
    fontSize: 16,
  },
  dateTextLight: {
    color: "#11181C",
  },
  dateTextDark: {
    color: "#ECEDEE",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#dadce0",
  },
  genderButtonDark: {
    borderColor: "#3C3E42",
  },
  genderButtonActive: {
    backgroundColor: "#00ADB5",
    borderColor: "#00ADB5",
  },
  genderButtonActiveDark: {
    backgroundColor: "#00ADB5",
    borderColor: "#00ADB5",
  },
  genderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
  },
  genderTextDark: {
    color: "#ECEDEE",
  },
  genderTextActive: {
    color: "#fff",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00ADB5",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,173,181,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#00ADB5",
  },
  profileImagePlaceholderDark: {
    backgroundColor: "rgba(0,173,181,0.2)",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00ADB5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  editIconDark: {
    borderColor: "#1C1C1E",
  },
  profileImageLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 8,
  },
});

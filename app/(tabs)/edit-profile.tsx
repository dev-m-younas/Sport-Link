import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { CountryDropdown } from "@/components/auth/CountryDropdown";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Country } from "@/lib/countries";
import { COUNTRIES, getCountryByCode } from "@/lib/countries";
import { showToast } from "@/lib/toast";
import {
    getUserProfile,
    saveUserProfile,
    type Gender
} from "@/lib/userProfile";

export default function EditProfileScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] =
    useState<Country | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>("other");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [city, setCity] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setName(profile.name || "");
        setEmail(profile.email || "");

        // Parse phone number and country code
        const phoneNumberStr = profile.phoneNumber || "";
        // Try to extract country code from phone number (format: +92XXXXXXXXXX)
        let extractedCountry: Country | null = null;
        if (phoneNumberStr.startsWith("+")) {
          // Find country by phone code
          for (const country of COUNTRIES) {
            if (phoneNumberStr.startsWith(country.phoneCode)) {
              extractedCountry = country;
              // Remove country code from phone number
              const phoneWithoutCode = phoneNumberStr
                .substring(country.phoneCode.length)
                .trim();
              setPhoneNumber(phoneWithoutCode);
              break;
            }
          }
        } else {
          setPhoneNumber(phoneNumberStr);
        }

        setDateOfBirth(
          profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date(),
        );
        setGender(profile.gender || "other");
        setCity(profile.city || "");
        setProfileImage(profile.profileImage || null);

        // Load country from profile
        let country: Country | null = null;
        if (profile.countryCode) {
          // First try to get country by code
          country = getCountryByCode(profile.countryCode) || null;
        }

        if (!country && profile.country) {
          // If country code not found, try to find by country name
          country = COUNTRIES.find((c) => c.name === profile.country) || null;
        }

        if (country) {
          setSelectedCountry(country);
          // Set phone country code if not already set
          if (!extractedCountry) {
            setSelectedCountryCode(country);
          } else {
            setSelectedCountryCode(extractedCountry);
          }
        } else if (extractedCountry) {
          // If country not found in profile but extracted from phone number
          setSelectedCountry(extractedCountry);
          setSelectedCountryCode(extractedCountry);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showToast.error("Error", "Failed to load profile");
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      showToast.error("Validation Error", "Name is required");
      return;
    }

    setSaving(true);
    try {
      const fullPhoneNumber = selectedCountryCode
        ? `${selectedCountryCode.phoneCode}${phoneNumber.trim()}`
        : phoneNumber.trim();

      await saveUserProfile(user, {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: fullPhoneNumber,
        dateOfBirth: dateOfBirth.toISOString().split("T")[0],
        gender,
        country: selectedCountry?.name || "",
        countryCode: selectedCountry?.code || "",
        city: city.trim(),
        // Only include profileImage if it has a value
        ...(profileImage && profileImage.trim() !== "" ? { profileImage } : {}),
      });

      showToast.success("Success", "Profile updated successfully");
      router.back();
    } catch (error: any) {
      showToast.error("Error", error?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 8, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={[styles.editIcon, isDark && styles.editIconDark]}>
              <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
            onCountrySelect={setSelectedCountryCode}
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
              <ThemedText style={styles.dateText}>
                {formatDate(dateOfBirth)}
              </ThemedText>
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
                  <ThemedText
                    style={[
                      styles.genderText,
                      gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <CountryDropdown
            label="Country"
            selectedCountry={selectedCountry}
            onSelect={(country) => {
              setSelectedCountry(country);
              if (!selectedCountryCode) {
                setSelectedCountryCode(country);
              }
            }}
          />

          <AuthInput
            label="City"
            placeholder="Enter your city"
            value={city}
            onChangeText={setCity}
            textContentType="addressCity"
          />

          <AuthButton
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            disabled={!name.trim()}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#00ADB5",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,173,181,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#00ADB5",
  },
  profileImagePlaceholderDark: {
    backgroundColor: "rgba(0,173,181,0.2)",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00ADB5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  editIconDark: {
    borderColor: "#1C1C1E",
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
    backgroundColor: "#393E46",
  },
  dateText: {
    fontSize: 16,
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
  },
  genderTextActive: {
    color: "#fff",
  },
});

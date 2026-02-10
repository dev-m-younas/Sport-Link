import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { CountryDropdown } from '@/components/auth/CountryDropdown';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Gender } from '@/lib/userProfile';
import type { Country } from '@/lib/countries';

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<Country | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>('other');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [city, setCity] = useState('');

  const isValid =
    name.trim() &&
    email.trim() &&
    phoneNumber.trim() &&
    selectedCountryCode &&
    selectedCountry &&
    city.trim();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleNext = () => {
    if (!isValid) return;
    const fullPhoneNumber = selectedCountryCode
      ? `${selectedCountryCode.phoneCode}${phoneNumber.trim()}`
      : phoneNumber.trim();
    
    router.push({
      pathname: '/(auth)/onboarding/activities',
      params: {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: fullPhoneNumber,
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        country: selectedCountry?.name || '',
        countryCode: selectedCountry?.code || '',
        city: city.trim(),
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
                <MaterialCommunityIcons
                  name="account-edit"
                  size={40}
                  color="#0a7ea4"
                />
              </View>
              <ThemedText type="title" style={styles.title}>
                Personal Information
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Tell us about yourself
              </ThemedText>
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
                  onPress={() => setShowDatePicker(true)}>
                  <Text
                    style={[
                      styles.dateText,
                      isDark ? styles.dateTextDark : styles.dateTextLight,
                    ]}>
                    {formatDate(dateOfBirth)}
                  </Text>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={isDark ? '#9BA1A6' : '#687076'}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Gender Selection */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Gender</ThemedText>
                <View style={styles.genderContainer}>
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderButton,
                        gender === g && styles.genderButtonActive,
                        isDark && styles.genderButtonDark,
                        gender === g && isDark && styles.genderButtonActiveDark,
                      ]}
                      onPress={() => setGender(g)}>
                      <Text
                        style={[
                          styles.genderText,
                          gender === g && styles.genderTextActive,
                          isDark && styles.genderTextDark,
                        ]}>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircleDark: {
    backgroundColor: '#1D3D47',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    opacity: 0.8,
    textAlign: 'center',
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
    fontWeight: '600',
    marginBottom: 8,
  },
  dateButton: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonLight: {
    backgroundColor: '#F1F3F4',
  },
  dateButtonDark: {
    backgroundColor: '#2C2E31',
  },
  dateText: {
    fontSize: 16,
  },
  dateTextLight: {
    color: '#11181C',
  },
  dateTextDark: {
    color: '#ECEDEE',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dadce0',
  },
  genderButtonDark: {
    borderColor: '#3C3E42',
  },
  genderButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  genderButtonActiveDark: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  genderTextDark: {
    color: '#ECEDEE',
  },
  genderTextActive: {
    color: '#fff',
  },
});

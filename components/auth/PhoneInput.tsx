import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { COUNTRIES, type Country } from '@/lib/countries';

type PhoneInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  selectedCountry: Country | null;
  onCountrySelect: (country: Country) => void;
  label?: string;
  placeholder?: string;
};

export function PhoneInput({
  value,
  onChangeText,
  selectedCountry,
  onCountrySelect,
  label,
  placeholder = 'Enter phone number',
}: PhoneInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setCountryModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
      <View
        style={[
          styles.inputContainer,
          isDark ? styles.inputContainerDark : styles.inputContainerLight,
        ]}>
        {/* Country Code Button */}
        <TouchableOpacity
          style={[
            styles.countryCodeButton,
            isDark ? styles.countryCodeButtonDark : styles.countryCodeButtonLight,
          ]}
          onPress={() => setCountryModalVisible(true)}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.countryCodeText,
              isDark ? styles.countryCodeTextDark : styles.countryCodeTextLight,
            ]}>
            {selectedCountry ? selectedCountry.phoneCode : '+1'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={18}
            color={isDark ? '#9BA1A6' : '#687076'}
          />
        </TouchableOpacity>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            isDark ? styles.dividerDark : styles.dividerLight,
          ]}
        />

        {/* Phone Number Input */}
        <TextInput
          style={[
            styles.phoneInput,
            isDark ? styles.phoneInputDark : styles.phoneInputLight,
          ]}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          {...Platform.select({
            web: {
              outlineStyle: 'none',
            },
          })}
        />
      </View>

      {/* Country Code Modal */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCountryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              isDark ? styles.modalContentDark : styles.modalContentLight,
            ]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Select Country Code
              </ThemedText>
              <TouchableOpacity
                onPress={() => setCountryModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={isDark ? '#ECEDEE' : '#11181C'}
                />
              </TouchableOpacity>
            </View>

            {/* Countries List */}
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry?.code === item.code && styles.countryItemSelected,
                    isDark && styles.countryItemDark,
                  ]}
                  onPress={() => handleCountrySelect(item)}>
                  <View style={styles.countryInfo}>
                    <View style={styles.countryRow}>
                      <Text
                        style={[
                          styles.countryName,
                          selectedCountry?.code === item.code && styles.countryNameSelected,
                          isDark && styles.countryNameDark,
                        ]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.phoneCode,
                          selectedCountry?.code === item.code && styles.phoneCodeSelected,
                          isDark && styles.phoneCodeDark,
                        ]}>
                        {item.phoneCode}
                      </Text>
                    </View>
                  </View>
                  {selectedCountry?.code === item.code && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#0a7ea4"
                    />
                  )}
                </TouchableOpacity>
              )}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
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
  inputContainer: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  inputContainerLight: {
    backgroundColor: '#F1F3F4',
  },
  inputContainerDark: {
    backgroundColor: '#2C2E31',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    minWidth: 90,
    borderRadius: 8,
  },
  countryCodeButtonLight: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  countryCodeButtonDark: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countryCodeTextLight: {
    color: '#0a7ea4',
  },
  countryCodeTextDark: {
    color: '#4FC3F7',
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  dividerLight: {
    backgroundColor: '#dadce0',
  },
  dividerDark: {
    backgroundColor: '#3C3E42',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
  },
  phoneInputLight: {
    color: '#11181C',
  },
  phoneInputDark: {
    color: '#ECEDEE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalContentLight: {
    backgroundColor: '#fff',
  },
  modalContentDark: {
    backgroundColor: '#1C1C1E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  list: {
    flex: 1,
    paddingTop: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  countryItemDark: {
    borderBottomColor: '#2C2E31',
  },
  countryItemSelected: {
    backgroundColor: '#E6F4FE',
  },
  countryInfo: {
    flex: 1,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  countryName: {
    fontSize: 16,
    color: '#11181C',
    flex: 1,
  },
  countryNameDark: {
    color: '#ECEDEE',
  },
  countryNameSelected: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  phoneCode: {
    fontSize: 16,
    color: '#687076',
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  phoneCodeDark: {
    color: '#9BA1A6',
  },
  phoneCodeSelected: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
});

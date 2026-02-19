import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
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
  const { height: winHeight } = useWindowDimensions();
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const tint = Colors[colorScheme].tint;

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.trim().toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setCountryModalVisible(false);
    setSearchQuery('');
  };

  const closeModal = () => {
    setCountryModalVisible(false);
    setSearchQuery('');
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
        <Pressable
          style={({ pressed }) => [
            styles.countryCodeButton,
            isDark ? styles.countryCodeButtonDark : styles.countryCodeButtonLight,
            pressed && styles.countryCodeButtonPressed,
          ]}
          onPress={() => setCountryModalVisible(true)}
          android_ripple={isDark ? { color: 'rgba(255,255,255,0.08)' } : { color: 'rgba(10,126,164,0.15)' }}>
          <MaterialCommunityIcons name="phone-outline" size={18} color={tint} />
          <Text
            style={[
              styles.countryCodeText,
              { color: tint },
            ]}>
            {selectedCountry ? selectedCountry.phoneCode : '+1'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={18}
            color={tint}
          />
        </Pressable>

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

      {/* Country Code Modal - Modern Bottom Sheet */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View
            style={[
              styles.modalSheet,
              { maxHeight: Math.min(winHeight * 0.65, 520) },
              isDark ? styles.modalSheetDark : styles.modalSheetLight,
            ]}>
            <View style={[styles.handleBar, isDark && styles.handleBarDark]} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <View>
                  <ThemedText style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    Select Country
                  </ThemedText>
                  <ThemedText style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                    Choose your country code
                  </ThemedText>
                </View>
                <TouchableOpacity
                  hitSlop={12}
                  style={[styles.closeBtn, isDark && styles.closeBtnDark]}
                  onPress={closeModal}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={isDark ? '#9BA1A6' : '#687076'}
                  />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={[styles.searchWrap, isDark ? styles.searchWrapDark : styles.searchWrapLight]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={isDark ? '#9BA1A6' : '#687076'}
                />
                <TextInput
                  style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                  placeholder="Search country or code..."
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  {...Platform.select({ web: { outlineStyle: 'none' as const } })}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={isDark ? '#9BA1A6' : '#687076'} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Countries List */}
            <FlatList
              style={styles.listFill}
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="earth-off" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  <ThemedText style={styles.emptyText}>No country found</ThemedText>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedCountry?.code === item.code;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.countryCard,
                      isDark ? styles.countryCardDark : styles.countryCardLight,
                      isSelected && (isDark ? styles.countryCardSelectedDark : styles.countryCardSelectedLight),
                      isSelected && { borderColor: tint },
                      pressed && styles.countryCardPressed,
                    ]}
                    onPress={() => handleCountrySelect(item)}>
                    <View style={styles.countryCardContent}>
                      <Text
                        style={[
                          styles.countryName,
                          isDark ? styles.countryNameDark : styles.countryNameLight,
                          isSelected && { color: tint, fontWeight: '600' },
                        ]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.phoneCode,
                          isDark ? styles.phoneCodeDark : styles.phoneCodeLight,
                          isSelected && { color: tint, fontWeight: '600' },
                        ]}>
                        {item.phoneCode}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={[styles.checkBadge, { backgroundColor: tint }]}>
                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
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
    overflow: 'hidden',
  },
  inputContainerLight: {
    backgroundColor: '#F1F3F4',
  },
  inputContainerDark: {
    backgroundColor: '#393E46',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: 92,
    borderRadius: 10,
  },
  countryCodeButtonLight: {
    backgroundColor: 'rgba(10, 126, 164, 0.12)',
  },
  countryCodeButtonDark: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
  },
  countryCodeButtonPressed: {
    opacity: 0.85,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  dividerLight: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  phoneInputLight: {
    color: '#11181C',
  },
  phoneInputDark: {
    color: '#ECEDEE',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 420,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    overflow: 'hidden',
  },
  modalSheetLight: {
    backgroundColor: '#fff',
  },
  modalSheetDark: {
    backgroundColor: '#1C1C1E',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginTop: 12,
  },
  handleBarDark: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalTitleDark: {
    color: '#ECEDEE',
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalSubtitleDark: {
    color: '#9BA1A6',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  closeBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  searchWrapLight: {
    backgroundColor: '#F5F6F7',
  },
  searchWrapDark: {
    backgroundColor: '#393E46',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  searchInputLight: {
    color: '#11181C',
  },
  searchInputDark: {
    color: '#ECEDEE',
  },
  listFill: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
  },
  itemSeparator: {
    height: 10,
  },
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countryCardLight: {
    backgroundColor: '#F5F6F7',
  },
  countryCardDark: {
    backgroundColor: '#393E46',
  },
  countryCardSelectedLight: {
    backgroundColor: 'rgba(0,173,181,0.15)',
  },
  countryCardSelectedDark: {
    backgroundColor: 'rgba(10,126,164,0.15)',
  },
  countryCardPressed: {
    opacity: 0.9,
  },
  countryCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  countryNameLight: {
    color: '#11181C',
  },
  countryNameDark: {
    color: '#ECEDEE',
  },
  phoneCode: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 48,
    textAlign: 'right',
  },
  phoneCodeLight: {
    color: '#687076',
  },
  phoneCodeDark: {
    color: '#9BA1A6',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    opacity: 0.7,
  },
});

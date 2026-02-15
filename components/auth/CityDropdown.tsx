import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Pressable,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { getCitiesByCountryCode } from '@/lib/countries';

type CityDropdownProps = {
  selectedCity: string | null;
  onSelect: (city: string) => void;
  countryCode: string | null;
  label?: string;
  placeholder?: string;
};

export function CityDropdown({
  selectedCity,
  onSelect,
  countryCode,
  label,
  placeholder = 'Select City',
}: CityDropdownProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { height: winHeight } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const tint = Colors[colorScheme].tint;

  const cities = countryCode ? getCitiesByCountryCode(countryCode) : [];
  const hasCities = cities.length > 0;

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.trim().toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, searchQuery]);

  const handleSelect = (city: string) => {
    onSelect(city);
    setModalVisible(false);
    setSearchQuery('');
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  if (!countryCode || !hasCities) {
    return null;
  }

  return (
    <View style={styles.container}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
      <Pressable
        style={({ pressed }) => [
          styles.dropdownButton,
          isDark ? styles.dropdownButtonDark : styles.dropdownButtonLight,
          pressed && styles.dropdownButtonPressed,
        ]}
        onPress={() => setModalVisible(true)}
        android_ripple={isDark ? { color: 'rgba(255,255,255,0.08)' } : { color: 'rgba(0,0,0,0.06)' }}>
        <View style={[styles.triggerIconWrap, { backgroundColor: isDark ? 'rgba(10,126,164,0.2)' : '#E6F4FE' }]}>
          <MaterialCommunityIcons name="city-variant-outline" size={20} color={tint} />
        </View>
        <Text
          style={[
            styles.dropdownText,
            isDark ? styles.dropdownTextDark : styles.dropdownTextLight,
            !selectedCity && styles.placeholderText,
          ]}
          numberOfLines={1}>
          {selectedCity || placeholder}
        </Text>
        <View style={[styles.chevronWrap, isDark && styles.chevronWrapDark]}>
          <MaterialCommunityIcons
            name="chevron-down"
            size={22}
            color={selectedCity ? tint : (isDark ? '#9BA1A6' : '#687076')}
          />
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View
            style={[
              styles.modalSheet,
              { maxHeight: Math.min(winHeight * 0.55, 450) },
              isDark ? styles.modalSheetDark : styles.modalSheetLight,
            ]}>
            <View style={[styles.handleBar, isDark && styles.handleBarDark]} />

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <View>
                  <ThemedText style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    Select City
                  </ThemedText>
                  <ThemedText style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                    Choose your city
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

              <View style={[styles.searchWrap, isDark ? styles.searchWrapDark : styles.searchWrapLight]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={isDark ? '#9BA1A6' : '#687076'}
                />
                <TextInput
                  style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                  placeholder="Search city..."
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

            <FlatList
              style={styles.listFill}
              data={filteredCities}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="city-variant-outline" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  <ThemedText style={styles.emptyText}>No city found</ThemedText>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedCity === item;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionCard,
                      isDark ? styles.optionCardDark : styles.optionCardLight,
                      isSelected && (isDark ? styles.optionCardSelectedDark : styles.optionCardSelectedLight),
                      isSelected && { borderColor: tint },
                      pressed && styles.optionCardPressed,
                    ]}
                    onPress={() => handleSelect(item)}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isDark ? styles.optionLabelDark : styles.optionLabelLight,
                        isSelected && { color: tint, fontWeight: '600' },
                      ]}>
                      {item}
                    </Text>
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dropdownButtonLight: {
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  dropdownButtonDark: {
    backgroundColor: '#2C2E31',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dropdownButtonPressed: {
    opacity: 0.92,
  },
  triggerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownTextLight: {
    color: '#11181C',
  },
  dropdownTextDark: {
    color: '#ECEDEE',
  },
  placeholderText: {
    fontWeight: '400',
    opacity: 0.5,
  },
  chevronWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  chevronWrapDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    minHeight: 320,
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
    backgroundColor: '#2C2E31',
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardLight: {
    backgroundColor: '#F5F6F7',
  },
  optionCardDark: {
    backgroundColor: '#2C2E31',
  },
  optionCardSelectedLight: {
    backgroundColor: '#E6F4FE',
  },
  optionCardSelectedDark: {
    backgroundColor: 'rgba(10,126,164,0.15)',
  },
  optionCardPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  optionLabelLight: {
    color: '#11181C',
  },
  optionLabelDark: {
    color: '#ECEDEE',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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

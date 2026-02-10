import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { COUNTRIES, type Country } from '@/lib/countries';

type CountryDropdownProps = {
  selectedCountry: Country | null;
  onSelect: (country: Country) => void;
  label?: string;
};

export function CountryDropdown({
  selectedCountry,
  onSelect,
  label,
}: CountryDropdownProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (country: Country) => {
    onSelect(country);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          isDark ? styles.dropdownButtonDark : styles.dropdownButtonLight,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}>
        <Text
          style={[
            styles.dropdownText,
            isDark ? styles.dropdownTextDark : styles.dropdownTextLight,
            !selectedCountry && styles.placeholderText,
          ]}>
          {selectedCountry ? selectedCountry.name : 'Select Country'}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={isDark ? '#9BA1A6' : '#687076'}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              isDark ? styles.modalContentDark : styles.modalContentLight,
            ]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Select Country
              </ThemedText>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}>
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
                  onPress={() => handleSelect(item)}>
                  <Text
                    style={[
                      styles.countryName,
                      selectedCountry?.code === item.code && styles.countryNameSelected,
                      isDark && styles.countryNameDark,
                    ]}>
                    {item.name}
                  </Text>
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
  dropdownButton: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonLight: {
    backgroundColor: '#F1F3F4',
  },
  dropdownButtonDark: {
    backgroundColor: '#2C2E31',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownTextLight: {
    color: '#11181C',
  },
  dropdownTextDark: {
    color: '#ECEDEE',
  },
  placeholderText: {
    opacity: 0.5,
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
  modalHeaderDark: {
    borderBottomColor: '#3C3E42',
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
  countryName: {
    fontSize: 16,
    color: '#11181C',
  },
  countryNameDark: {
    color: '#ECEDEE',
  },
  countryNameSelected: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
});

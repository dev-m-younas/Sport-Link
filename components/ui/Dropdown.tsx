import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Pressable,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: DropdownOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** Optional icon name for trigger (e.g. 'soccer', 'trophy') */
  triggerIcon?: string;
};

export function Dropdown({
  options,
  selectedValue,
  onSelect,
  label,
  placeholder = 'Select an option',
  triggerIcon,
}: DropdownProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const tint = Colors[colorScheme].tint;

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = (value: string) => {
    onSelect(value);
    setModalVisible(false);
  };

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText style={[styles.label, isDark && styles.labelDark]}>
          {label}
        </ThemedText>
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          isDark ? styles.triggerDark : styles.triggerLight,
          pressed && styles.triggerPressed,
        ]}
        onPress={openModal}
        android_ripple={isDark ? { color: 'rgba(255,255,255,0.08)' } : { color: 'rgba(0,0,0,0.06)' }}>
        {triggerIcon ? (
          <View style={[styles.triggerIconWrap, { backgroundColor: isDark ? 'rgba(10,126,164,0.2)' : '#E6F4FE' }]}>
            <MaterialCommunityIcons name={triggerIcon as any} size={22} color={tint} />
          </View>
        ) : null}
        <Text
          style={[
            styles.triggerText,
            isDark ? styles.triggerTextDark : styles.triggerTextLight,
            !selectedValue && styles.placeholderText,
          ]}
          numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <View style={[styles.chevronWrap, isDark && styles.chevronWrapDark]}>
          <MaterialCommunityIcons
            name="chevron-down"
            size={22}
            color={selectedValue ? tint : (isDark ? '#9BA1A6' : '#687076')}
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
              isDark ? styles.modalSheetDark : styles.modalSheetLight,
            ]}>
            <View style={[styles.handleBar, isDark && styles.handleBarDark]} />
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {label || 'Select'}
              </ThemedText>
              <ThemedText style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                Choose an option
              </ThemedText>
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

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.optionSeparator} />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedValue === item.value;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionCard,
                      isDark ? styles.optionCardDark : styles.optionCardLight,
                      isSelected && (isDark ? styles.optionCardSelectedDark : styles.optionCardSelectedLight),
                      isSelected && { borderColor: tint },
                      pressed && styles.optionCardPressed,
                    ]}
                    onPress={() => handleSelect(item.value)}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isDark ? styles.optionLabelDark : styles.optionLabelLight,
                        isSelected && { color: tint, fontWeight: '600' },
                      ]}>
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <View style={[styles.checkWrap, { backgroundColor: tint }]}>
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  labelDark: {
    opacity: 0.95,
  },
  trigger: {
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
  triggerLight: {
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  triggerDark: {
    backgroundColor: '#2C2E31',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  triggerPressed: {
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
  triggerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  triggerTextLight: {
    color: '#11181C',
  },
  triggerTextDark: {
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
    maxHeight: '82%',
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
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
    position: 'absolute',
    top: 12,
    right: 20,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  closeBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
  },
  optionSeparator: {
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
  },
  optionLabelLight: {
    color: '#11181C',
  },
  optionLabelDark: {
    color: '#ECEDEE',
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

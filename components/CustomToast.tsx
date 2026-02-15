import React from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.toastLight, { borderLeftColor: '#10B981' }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={[styles.text1, styles.text1Light]}
      text2Style={[styles.text2, styles.text2Light]}
      renderLeadingIcon={() => (
        <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
        </View>
      )}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={[styles.toast, styles.toastLight, { borderLeftColor: '#EF4444' }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={[styles.text1, styles.text1Light]}
      text2Style={[styles.text2, styles.text2Light]}
      renderLeadingIcon={() => (
        <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
        </View>
      )}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={[styles.toast, styles.toastLight, { borderLeftColor: '#0a7ea4' }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={[styles.text1, styles.text1Light]}
      text2Style={[styles.text2, styles.text2Light]}
      renderLeadingIcon={() => (
        <View style={[styles.iconContainer, { backgroundColor: '#0a7ea420' }]}>
          <MaterialCommunityIcons name="information" size={24} color="#0a7ea4" />
        </View>
      )}
    />
  ),
};

export function CustomToast() {
  return <Toast config={toastConfig} />;
}

const styles = StyleSheet.create({
  toast: {
    height: 'auto',
    minHeight: 70,
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastLight: {
    backgroundColor: '#fff',
  },
  toastDark: {
    backgroundColor: '#1C1C1E',
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    flex: 1,
  },
  text1: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  text1Light: {
    color: '#11181C',
  },
  text1Dark: {
    color: '#ECEDEE',
  },
  text2: {
    fontSize: 14,
    fontWeight: '400',
  },
  text2Light: {
    color: '#687076',
  },
  text2Dark: {
    color: '#9BA1A6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

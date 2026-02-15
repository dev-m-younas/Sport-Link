import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { showToast } from '@/lib/toast';

type LocationMapPickerProps = {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
};

export function LocationMapPicker({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
}: LocationMapPickerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState<string>('');
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (visible) {
      loadCurrentLocation();
    }
  }, [visible]);

  const loadCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast.error('Permission Required', 'Location permission is required to select location on map.');
        onClose();
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setSelectedLocation(coords);
      
      // Set map region
      setRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      // Reverse geocode to get address
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          const addressParts = [
            addr.street,
            addr.city,
            addr.region,
            addr.country,
          ].filter(Boolean);
          setAddress(addressParts.join(', ') || 'Location selected');
        } else {
          setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Reverse geocode error:', error);
        setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      }
      
      // Animate map to location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error loading location:', error);
      showToast.error('Error', 'Failed to load current location');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    if (Platform.OS === 'web') {
      // Web doesn't support native maps well, use current location
      return;
    }

    const coords = {
      lat: Number(event.nativeEvent.coordinate.latitude),
      lng: Number(event.nativeEvent.coordinate.longitude),
    };

    console.log('Map pressed, coordinates:', coords);
    setSelectedLocation(coords);
    
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lng,
      });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const addressParts = [
          addr.street,
          addr.city,
          addr.region,
          addr.country,
        ].filter(Boolean);
        setAddress(addressParts.join(', ') || 'Location selected');
      } else {
        setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    // Update region when user drags map
    setRegion(newRegion);
  };

  const handleConfirm = () => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      const lat = Number(selectedLocation.lat);
      const lng = Number(selectedLocation.lng);
      
      console.log('Confirming location:', { lat, lng, address });
      
      onLocationSelect({
        lat: lat,
        lng: lng,
        address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
      onClose();
    } else {
      showToast.error('Error', 'Please select a location on the map');
    }
  };

  const handleUseCurrentLocation = async () => {
    await loadCurrentLocation();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            isDark ? styles.modalContentDark : styles.modalContentLight,
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Select Location
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={isDark ? '#ECEDEE' : '#11181C'}
              />
            </TouchableOpacity>
          </View>

          {/* Map Container */}
          <View style={styles.mapContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
                <ThemedText style={styles.loadingText}>Loading map...</ThemedText>
              </View>
            ) : Platform.OS === 'web' ? (
              <View style={styles.mapPlaceholder}>
                <MaterialCommunityIcons name="map" size={64} color="#0a7ea4" />
                <ThemedText style={styles.mapPlaceholderText}>
                  Map view requires native app (iOS/Android)
                </ThemedText>
                {selectedLocation && (
                  <View style={styles.locationInfo}>
                    <ThemedText style={styles.coordinatesText}>
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </ThemedText>
                    {address && (
                      <ThemedText style={styles.addressText}>{address}</ThemedText>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  initialRegion={
                    region || {
                      latitude: selectedLocation?.lat || 0,
                      longitude: selectedLocation?.lng || 0,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
                  }
                  region={region || undefined}
                  onPress={handleMapPress}
                  onRegionChangeComplete={handleRegionChangeComplete}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                  mapType="standard">
                  {selectedLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.lat,
                        longitude: selectedLocation.lng,
                      }}
                      draggable
                      onDragEnd={async (e) => {
                        const coords = {
                          lat: Number(e.nativeEvent.coordinate.latitude),
                          lng: Number(e.nativeEvent.coordinate.longitude),
                        };
                        console.log('Marker dragged, coordinates:', coords);
                        setSelectedLocation(coords);
                        
                        // Update address
                        try {
                          const addresses = await Location.reverseGeocodeAsync({
                            latitude: coords.lat,
                            longitude: coords.lng,
                          });
                          if (addresses && addresses.length > 0) {
                            const addr = addresses[0];
                            const addressParts = [
                              addr.street,
                              addr.city,
                              addr.region,
                              addr.country,
                            ].filter(Boolean);
                            setAddress(addressParts.join(', ') || 'Location selected');
                          } else {
                            setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                          }
                        } catch (error) {
                          console.error('Reverse geocode error:', error);
                          setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                        }
                      }}
                    />
                  )}
                </MapView>
                {selectedLocation && (
                  <View style={styles.locationInfoOverlay}>
                    <ThemedText style={styles.coordinatesText}>
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </ThemedText>
                    {address && (
                      <ThemedText style={styles.addressText} numberOfLines={2}>
                        {address}
                      </ThemedText>
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.currentLocationButton]}
              onPress={handleUseCurrentLocation}
              disabled={loading}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#0a7ea4" />
              <ThemedText style={styles.currentLocationText}>Use Current Location</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                !selectedLocation && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedLocation || loading}>
              <ThemedText
                style={[
                  styles.confirmButtonText,
                  !selectedLocation && styles.confirmButtonTextDisabled,
                ]}>
                Confirm Location
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalContentLight: {
    backgroundColor: '#fff',
  },
  modalContentDark: {
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  mapContainer: {
    height: 400,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F3F4',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  locationInfoOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  locationInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    alignItems: 'center',
    gap: 4,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0a7ea4',
  },
  addressText: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currentLocationButton: {
    backgroundColor: '#E6F4FE',
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  currentLocationText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#0a7ea4',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9BA1A6',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: '#fff',
    opacity: 0.7,
  },
});

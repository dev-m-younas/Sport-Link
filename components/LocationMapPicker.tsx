import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { showToast } from "@/lib/toast";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

type LocationMapPickerProps = {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
};

export function LocationMapPicker({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
}: LocationMapPickerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(initialLocation || null);
  const [address, setAddress] = useState<string>("");
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
      if (status !== "granted") {
        showToast.error(
          "Permission Required",
          "Location permission is required to select location.",
        );
        onClose();
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setSelectedLocation(coords);
      setRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

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
          setAddress(addressParts.join(", ") || "Location selected");
        } else {
          setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        }
      } catch {
        setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      }

      if (mapRef.current && Platform.OS !== "web") {
        mapRef.current.animateToRegion(
          {
            latitude: coords.lat,
            longitude: coords.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000,
        );
      }
    } catch (error: unknown) {
      console.error("Error loading location:", error);
      showToast.error("Error", "Failed to get current location. Check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const updateAddressForCoords = async (coords: { lat: number; lng: number }) => {
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
        setAddress(addressParts.join(", ") || "Location selected");
      } else {
        setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      }
    } catch {
      setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    }
  };

  const handleMapPress = async (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    if (Platform.OS === "web") return;

    const coords = {
      lat: Number(event.nativeEvent.coordinate.latitude),
      lng: Number(event.nativeEvent.coordinate.longitude),
    };
    setSelectedLocation(coords);
    await updateAddressForCoords(coords);
  };

  const handleMarkerDragEnd = async (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const coords = {
      lat: Number(e.nativeEvent.coordinate.latitude),
      lng: Number(e.nativeEvent.coordinate.longitude),
    };
    setSelectedLocation(coords);
    await updateAddressForCoords(coords);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleConfirm = () => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      onLocationSelect({
        lat: Number(selectedLocation.lat),
        lng: Number(selectedLocation.lng),
        address: address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
      });
      onClose();
    } else {
      showToast.error("Error", "Please use current location to select");
    }
  };

  // Map on iOS (Apple Maps) and Android (Google Maps - apiKey in app.json).
  const showMap = Platform.OS !== "web";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            isDark ? styles.modalContentDark : styles.modalContentLight,
          ]}
        >
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Select Location
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={isDark ? "#ECEDEE" : "#11181C"}
              />
            </TouchableOpacity>
          </View>

          {/* Map Container */}
          <View style={styles.mapContainer}>
            {loading && !selectedLocation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00ADB5" />
                <ThemedText style={styles.loadingText}>
                  {showMap ? "Loading map..." : "Getting location..."}
                </ThemedText>
              </View>
            ) : !showMap ? (
              <View style={styles.mapPlaceholder}>
                <MaterialCommunityIcons name="map-marker" size={64} color="#00ADB5" />
                <ThemedText style={styles.mapPlaceholderText}>
                  Use current location below
                </ThemedText>
                {selectedLocation && (
                  <View style={styles.locationInfo}>
                    <ThemedText style={styles.coordinatesText}>
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </ThemedText>
                    {address ? (
                      <ThemedText style={styles.addressText}>{address}</ThemedText>
                    ) : null}
                  </View>
                )}
              </View>
            ) : (
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
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
                  mapType="standard"
                >
                  {selectedLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.lat,
                        longitude: selectedLocation.lng,
                      }}
                      draggable
                      onDragEnd={handleMarkerDragEnd}
                    />
                  )}
                </MapView>
                {selectedLocation && (
                  <View style={styles.locationInfoOverlay}>
                    <ThemedText style={styles.coordinatesText}>
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </ThemedText>
                    {address ? (
                      <ThemedText style={styles.addressText} numberOfLines={2}>
                        {address}
                      </ThemedText>
                    ) : null}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.currentLocationButton]}
              onPress={loadCurrentLocation}
              disabled={loading}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#00ADB5" />
              <ThemedText style={styles.currentLocationText}>
                Use Current Location
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                !selectedLocation && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedLocation || loading}
            >
              <ThemedText
                style={[
                  styles.confirmButtonText,
                  !selectedLocation && styles.confirmButtonTextDisabled,
                ]}
              >
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalContentLight: {
    backgroundColor: "#fff",
  },
  modalContentDark: {
    backgroundColor: "#1C1C1E",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  mapContainer: {
    height: 340,
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F3F4",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  locationInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(10, 126, 164, 0.1)",
    alignItems: "center",
    gap: 4,
  },
  locationInfoOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#00ADB5",
  },
  addressText: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: "center",
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  currentLocationButton: {
    backgroundColor: "rgba(0,173,181,0.15)",
    borderWidth: 1,
    borderColor: "#00ADB5",
  },
  currentLocationText: {
    color: "#00ADB5",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#00ADB5",
  },
  confirmButtonDisabled: {
    backgroundColor: "#9BA1A6",
    opacity: 0.5,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonTextDisabled: {
    color: "#fff",
    opacity: 0.7,
  },
});

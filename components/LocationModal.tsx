import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Coordinates } from 'adhan';
import { colors, spacing, fontSize } from '../config/theme';
import * as Location from 'expo-location';

// Common cities with their coordinates and time zones
const PRESET_CITIES = [
  { name: 'Auckland', coordinates: new Coordinates(-36.8509, 174.7645), timezone: 'UTC+12' },
  { name: 'Berlin', coordinates: new Coordinates(52.5200, 13.4050), timezone: 'UTC+1' },
  { name: 'Cairo', coordinates: new Coordinates(30.0444, 31.2357), timezone: 'UTC+2' },
  { name: 'Chicago', coordinates: new Coordinates(41.8781, -87.6298), timezone: 'UTC-6' },
  { name: 'Dhaka', coordinates: new Coordinates(23.8103, 90.4125), timezone: 'UTC+6' },
  { name: 'Dubai', coordinates: new Coordinates(25.2048, 55.2708), timezone: 'UTC+4' },
  { name: 'Hong Kong', coordinates: new Coordinates(22.3193, 114.1694), timezone: 'UTC+8' },
  { name: 'Houston', coordinates: new Coordinates(29.7604, -95.3698), timezone: 'UTC-6' },
  { name: 'Istanbul', coordinates: new Coordinates(41.0082, 28.9784), timezone: 'UTC+3' },
  { name: 'Jakarta', coordinates: new Coordinates(-6.2088, 106.8456), timezone: 'UTC+7' },
  { name: 'Johannesburg', coordinates: new Coordinates(-26.2041, 28.0473), timezone: 'UTC+2' },
  { name: 'Karachi', coordinates: new Coordinates(24.8607, 67.0011), timezone: 'UTC+5' },
  { name: 'Kuala Lumpur', coordinates: new Coordinates(3.1390, 101.6869), timezone: 'UTC+8' },
  { name: 'Lagos', coordinates: new Coordinates(6.5244, 3.3792), timezone: 'UTC+1' },
  { name: 'Lahore', coordinates: new Coordinates(31.5204, 74.3587), timezone: 'UTC+5' },
  { name: 'London', coordinates: new Coordinates(51.5074, -0.1278), timezone: 'UTC+0' },
  { name: 'Los Angeles', coordinates: new Coordinates(34.0522, -118.2437), timezone: 'UTC-8' },
  { name: 'Mecca', coordinates: new Coordinates(21.4225, 39.8262), timezone: 'UTC+3' },
  { name: 'Medina', coordinates: new Coordinates(24.5247, 39.5692), timezone: 'UTC+3' },
  { name: 'Nairobi', coordinates: new Coordinates(-1.2921, 36.8219), timezone: 'UTC+3' },
  { name: 'New York', coordinates: new Coordinates(40.7128, -74.0060), timezone: 'UTC-5' },
  { name: 'Paris', coordinates: new Coordinates(48.8566, 2.3522), timezone: 'UTC+1' },
  { name: 'Perth', coordinates: new Coordinates(-31.9505, 115.8605), timezone: 'UTC+8' },
  { name: 'Riyadh', coordinates: new Coordinates(24.7136, 46.6753), timezone: 'UTC+3' },
  { name: 'Singapore', coordinates: new Coordinates(1.3521, 103.8198), timezone: 'UTC+8' },
  { name: 'Sydney', coordinates: new Coordinates(-33.8688, 151.2093), timezone: 'UTC+10' },
  { name: 'Tokyo', coordinates: new Coordinates(35.6762, 139.6503), timezone: 'UTC+9' },
  { name: 'Toronto', coordinates: new Coordinates(43.6532, -79.3832), timezone: 'UTC-5' },
  { name: 'Vancouver', coordinates: new Coordinates(49.2827, -123.1207), timezone: 'UTC-8' }
];

// Update the interface to include timezone
interface LocationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectLocation: (coordinates: Coordinates, name: string) => void;
  theme: any;
}

export function LocationModal({ isVisible, onClose, onSelectLocation, theme }: LocationModalProps) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleSelectCity = (city: { name: string; coordinates: Coordinates; timezone: string }) => {
    onSelectLocation(city.coordinates, city.name);
    onClose();
  };

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // Check current permission status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      // If not granted, request permission
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          // Permission denied
          setIsLoadingLocation(false);
          return;
        }
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get location name using reverse geocoding
      const [geocodeResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const coordinates = new Coordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      const locationName = geocodeResult
        ? geocodeResult.city || geocodeResult.region || geocodeResult.country || 'Current Location'
        : 'Current Location';

      onSelectLocation(coordinates, locationName);
      onClose();
    } catch (error) {
      console.log('Error getting current location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Select Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.currentLocationButton, { backgroundColor: theme.primary + '15' }]}
            onPress={handleGetCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Text style={[styles.currentLocationText, { color: theme.text }]}>
                  📍 Use Current Location
                </Text>
                <Text style={[styles.currentLocationSubtext, { color: theme.textSecondary }]}>
                  Get prayer times for your location
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <ScrollView style={styles.citiesList}>
            {PRESET_CITIES.map((city) => (
              <TouchableOpacity
                key={city.name}
                style={[styles.cityItem, { backgroundColor: theme.primary + '15' }]}
                onPress={() => handleSelectCity(city)}
              >
                <Text style={[styles.cityName, { color: theme.text }]}>
                  {city.name}
                </Text>
                <Text style={[styles.timezone, { color: theme.textSecondary }]}>
                  {city.timezone}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: 40,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xlarge,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  citiesList: {
    marginTop: spacing.md,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  cityName: {
    fontSize: fontSize.large,
    fontWeight: '500',
  },
  timezone: {
    fontSize: fontSize.regular,
    opacity: 0.8,
  },
  currentLocationButton: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    width: '100%',
  },
  currentLocationText: {
    fontSize: fontSize.large,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  currentLocationSubtext: {
    fontSize: fontSize.regular,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.md,
  },
}); 
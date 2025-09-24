import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';

import { useTheme } from '../contexts/ThemeContext';
import { healthService } from '../services/HealthService';

interface Gym {
  id: string;
  name: string;
  address: string;
  distance: number; // in meters
  rating: number;
  isOpen: boolean;
  phone?: string;
  website?: string;
  amenities: string[];
  priceRange: '$' | '$$' | '$$$';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photos?: string[];
  openingHours?: {
    [key: string]: string;
  };
}

const MOCK_GYMS: Gym[] = [
  {
    id: '1',
    name: 'SmartFit Academia',
    address: 'Rua das Flores, 123 - Centro',
    distance: 850,
    rating: 4.5,
    isOpen: true,
    phone: '+55 (11) 1234-5678',
    website: 'https://smartfit.com.br',
    amenities: ['Musculação', 'Cardio', 'Grupo', 'Piscina'],
    priceRange: '$$',
    coordinates: {
      latitude: -23.550520,
      longitude: -46.633309,
    },
    openingHours: {
      'Segunda': '06:00 - 22:00',
      'Terça': '06:00 - 22:00',
      'Quarta': '06:00 - 22:00',
      'Quinta': '06:00 - 22:00',
      'Sexta': '06:00 - 22:00',
      'Sábado': '08:00 - 18:00',
      'Domingo': '08:00 - 16:00',
    },
  },
  {
    id: '2',
    name: 'Bio Ritmo',
    address: 'Av. Principal, 456 - Jardins',
    distance: 1200,
    rating: 4.2,
    isOpen: true,
    phone: '+55 (11) 8765-4321',
    amenities: ['Musculação', 'Spinning', 'Yoga', 'Pilates'],
    priceRange: '$$$',
    coordinates: {
      latitude: -23.561684,
      longitude: -46.656139,
    },
  },
  {
    id: '3',
    name: 'Competition',
    address: 'Rua Fitness, 789 - Vila Nova',
    distance: 2100,
    rating: 4.7,
    isOpen: false,
    phone: '+55 (11) 5555-0123',
    amenities: ['Musculação', 'Crossfit', 'Funcional'],
    priceRange: '$$$',
    coordinates: {
      latitude: -23.572940,
      longitude: -46.641354,
    },
  },
  {
    id: '4',
    name: 'Bodytech',
    address: 'Shopping Center, Loja 201',
    distance: 3200,
    rating: 4.3,
    isOpen: true,
    amenities: ['Musculação', 'Natação', 'Spa', 'Personal'],
    priceRange: '$$$',
    coordinates: {
      latitude: -23.590308,
      longitude: -46.682579,
    },
  },
];

export const GymFinderScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: -23.550520,
    longitude: -46.633309,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useState(5000); // 5km default

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      findNearbyGyms();
    }
  }, [userLocation, radius]);

  const getCurrentLocation = async () => {
    try {
      const location = await healthService.getCurrentLocation();
      if (location) {
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Localização',
        'Não foi possível obter sua localização. Usando localização padrão.',
        [{ text: 'OK' }]
      );
    }
  };

  const findNearbyGyms = async () => {
    try {
      if (!userLocation) return;

      // In production, would call actual gym finder API
      const nearbyGyms = MOCK_GYMS.map(gym => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          gym.coordinates.latitude,
          gym.coordinates.longitude
        );

        return {
          ...gym,
          distance: Math.round(distance),
        };
      })
      .filter(gym => gym.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

      setGyms(nearbyGyms);
    } catch (error) {
      console.error('Error finding nearby gyms:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const openDirections = (gym: Gym) => {
    const url = `https://maps.google.com/maps?daddr=${gym.coordinates.latitude},${gym.coordinates.longitude}`;
    Linking.openURL(url);
  };

  const callGym = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^0-9]/g, '')}`);
  };

  const openWebsite = (website: string) => {
    Linking.openURL(website);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getCurrentLocation();
    setRefreshing(false);
  }, []);

  const GymCard = ({ gym }: { gym: Gym }) => (
    <TouchableOpacity
      style={[styles.gymCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => setSelectedGym(gym)}
    >
      <View style={styles.gymHeader}>
        <View style={styles.gymInfo}>
          <Text style={[styles.gymName, { color: theme.colors.text }]}>
            {gym.name}
          </Text>
          <Text style={[styles.gymAddress, { color: theme.colors.textSecondary }]}>
            {gym.address}
          </Text>
        </View>
        <View style={styles.gymMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.rating, { color: theme.colors.text }]}>
              {gym.rating}
            </Text>
          </View>
          <Text style={[styles.distance, { color: theme.colors.primary }]}>
            {formatDistance(gym.distance)}
          </Text>
        </View>
      </View>

      <View style={styles.gymDetails}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: gym.isOpen ? '#4CAF50' : '#F44336' }
          ]} />
          <Text style={[styles.status, { color: theme.colors.text }]}>
            {gym.isOpen ? 'Aberto' : 'Fechado'}
          </Text>
          <Text style={[styles.priceRange, { color: theme.colors.textSecondary }]}>
            • {gym.priceRange}
          </Text>
        </View>

        <View style={styles.amenitiesContainer}>
          {gym.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={[styles.amenity, { backgroundColor: theme.colors.primary + '10' }]}>
              <Text style={[styles.amenityText, { color: theme.colors.primary }]}>
                {amenity}
              </Text>
            </View>
          ))}
          {gym.amenities.length > 3 && (
            <Text style={[styles.moreAmenities, { color: theme.colors.textSecondary }]}>
              +{gym.amenities.length - 3} mais
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => openDirections(gym)}
          >
            <Ionicons name="navigate" size={16} color="white" />
            <Text style={styles.actionButtonText}>Rotas</Text>
          </TouchableOpacity>

          {gym.phone && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              onPress={() => callGym(gym.phone!)}
            >
              <Ionicons name="call" size={16} color="white" />
              <Text style={styles.actionButtonText}>Ligar</Text>
            </TouchableOpacity>
          )}

          {gym.website && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.info }]}
              onPress={() => openWebsite(gym.website!)}
            >
              <Ionicons name="globe" size={16} color="white" />
              <Text style={styles.actionButtonText}>Site</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Academias Próximas
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor: viewMode === 'map' ? theme.colors.primary : 'transparent',
              }
            ]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons
              name="map"
              size={20}
              color={viewMode === 'map' ? 'white' : theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor: viewMode === 'list' ? theme.colors.primary : 'transparent',
              }
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === 'list' ? 'white' : theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Radius Filter */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
          Raio: {radius >= 1000 ? `${radius/1000}km` : `${radius}m`}
        </Text>
        <View style={styles.radiusButtons}>
          {[1000, 2000, 5000, 10000].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.radiusButton,
                {
                  backgroundColor: radius === r ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => setRadius(r)}
            >
              <Text style={[
                styles.radiusButtonText,
                { color: radius === r ? 'white' : theme.colors.text }
              ]}>
                {r >= 1000 ? `${r/1000}km` : `${r}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {viewMode === 'map' ? (
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {gyms.map((gym) => (
            <Marker
              key={gym.id}
              coordinate={gym.coordinates}
              title={gym.name}
              description={`${formatDistance(gym.distance)} • ${gym.rating}⭐`}
              pinColor={gym.isOpen ? '#4CAF50' : '#F44336'}
              onPress={() => setSelectedGym(gym)}
            />
          ))}
        </MapView>
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GymCard gym={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="location" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Nenhuma academia encontrada no raio selecionado
              </Text>
              <TouchableOpacity
                style={[styles.expandRadiusButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setRadius(radius * 2)}
              >
                <Text style={styles.expandRadiusText}>Expandir Busca</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Selected Gym Bottom Sheet */}
      {selectedGym && viewMode === 'map' && (
        <View style={[styles.bottomSheet, { backgroundColor: theme.colors.surface }]}>
          <GymCard gym={selectedGym} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedGym(null)}
          >
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  radiusButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  list: {
    padding: 20,
  },
  gymCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  gymHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gymAddress: {
    fontSize: 14,
  },
  gymMeta: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
  },
  distance: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gymDetails: {
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceRange: {
    fontSize: 12,
    marginLeft: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  amenity: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreAmenities: {
    fontSize: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  expandRadiusButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  expandRadiusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { getNearbyPlayers, type NearbyPlayer } from '@/lib/userProfile';
import { ACTIVITIES } from '@/constants/activities';
import { showToast } from '@/lib/toast';

function getActivityName(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.name ?? activityId;
}

function PlayerCard({
  player,
  isDark,
}: {
  player: NearbyPlayer;
  isDark: boolean;
}) {
  const handlePress = () => {
    router.push({
      pathname: '/(tabs)/player-detail',
      params: { id: player.uid },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}>
      <ThemedView
        style={[
          styles.card,
          isDark ? styles.cardDark : styles.cardLight,
        ]}>
        <View style={styles.cardHeader}>
          {player.profileImage ? (
            <Image
              source={{ uri: player.profileImage }}
              style={styles.profileImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, isDark && styles.profileImagePlaceholderDark]}>
              <MaterialCommunityIcons name="account" size={24} color="#0a7ea4" />
            </View>
          )}
          <View style={styles.cardInfo}>
            <ThemedText style={styles.cardName}>{player.name}</ThemedText>
            <ThemedText style={styles.cardLocation}>
              {player.city ? `${player.city}, ` : ''}{player.country}
            </ThemedText>
            <ThemedText style={styles.cardDistance}>
              {player.distance} km away
            </ThemedText>
          </View>
        </View>
        
        {player.activities && player.activities.length > 0 && (
          <View style={styles.activitiesRow}>
            {player.activities.slice(0, 3).map((activityId) => {
              const activity = ACTIVITIES.find((a) => a.id === activityId);
              return (
                <View
                  key={activityId}
                  style={[styles.activityBadge, isDark && styles.activityBadgeDark]}>
                  <MaterialCommunityIcons
                    name={(activity?.icon as any) || 'run'}
                    size={14}
                    color="#0a7ea4"
                  />
                  <ThemedText style={styles.activityBadgeText}>
                    {getActivityName(activityId)}
                  </ThemedText>
                </View>
              );
            })}
            {player.activities.length > 3 && (
              <ThemedText style={styles.moreActivities}>
                +{player.activities.length - 3} more
              </ThemedText>
            )}
          </View>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function PlayersScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  const [players, setPlayers] = useState<NearbyPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const fetchNearbyPlayers = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setPlayers([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setLocationDenied(false);
      const pos = await Location.getCurrentPositionAsync({
        maximumAge: 60000, // Use cached location if < 1 min old (faster)
      });

      // Update location in background - don't block players loading
      if (user?.uid) {
        import('@/lib/userProfile').then(({ saveUserProfile }) =>
          saveUserProfile(user, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {})
        );
      }

      const list = await getNearbyPlayers(
        pos.coords.latitude,
        pos.coords.longitude,
        30, // 30KM radius
        user?.uid // Exclude current user
      );

      setPlayers(list);
    } catch (e) {
      showToast.error(
        'Could not load players',
        (e as Error)?.message || 'Please try again.'
      );
      setPlayers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNearbyPlayers();
    }, [fetchNearbyPlayers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNearbyPlayers();
  }, [fetchNearbyPlayers]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24) }]}>
        <ThemedText type="title">Players</ThemedText>
      </View>

      {locationDenied && (
        <View style={styles.banner}>
          <MaterialCommunityIcons name="map-marker-off" size={24} color="#EF4444" />
          <ThemedText style={styles.bannerText}>
            Turn on location to see players near you (within 30km).
          </ThemedText>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading players...</ThemedText>
        </View>
      ) : players.length === 0 && !locationDenied ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="account-group" size={64} color="#9BA1A6" />
          <ThemedText style={styles.emptyTitle}>No players nearby</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Players within 30km will show here.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => <PlayerCard player={item} isDark={isDark} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0a7ea4']}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardLight: {
    backgroundColor: '#F1F3F4',
  },
  cardDark: {
    backgroundColor: '#2C2E31',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  profileImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  profileImagePlaceholderDark: {
    backgroundColor: '#1D3D47',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  cardDistance: {
    fontSize: 12,
    opacity: 0.6,
    color: '#0a7ea4',
  },
  activitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E6F4FE',
  },
  activityBadgeDark: {
    backgroundColor: '#1D3D47',
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  moreActivities: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});

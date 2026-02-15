import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { getUserActivities, type ActivityDoc } from '@/lib/activities';
import { ACTIVITIES } from '@/constants/activities';
import { showToast } from '@/lib/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';

function getActivityName(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.name ?? activityId;
}

function ActivityCard({
  item,
  isDark,
}: {
  item: ActivityDoc;
  isDark: boolean;
}) {
  const activityName = getActivityName(item.activity);
  const dateObj = new Date(item.date);
  const timeStr = new Date(item.time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handlePress = () => {
    router.push({
      pathname: '/(tabs)/activity-detail',
      params: { id: item.id },
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
          <View style={[styles.iconWrap, isDark && styles.iconWrapDark]}>
            <MaterialCommunityIcons
              name={
                ACTIVITIES.find((a) => a.id === item.activity)?.icon as any ||
                'run'
              }
              size={24}
              color="#0a7ea4"
            />
          </View>
          <View style={styles.cardTitleBlock}>
            <ThemedText style={styles.cardTitle}>{activityName}</ThemedText>
            <ThemedText style={styles.cardMeta}>
              {item.level}
            </ThemedText>
          </View>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color={isDark ? '#9BA1A6' : '#687076'}
          />
          <ThemedText style={styles.cardLocation}>{item.location}</ThemedText>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={isDark ? '#9BA1A6' : '#687076'}
          />
          <ThemedText style={styles.cardDate}>
            {dateStr} at {timeStr}
          </ThemedText>
        </View>
        {item.notes ? (
          <ThemedText style={styles.cardNotes} numberOfLines={2}>
            {item.notes}
          </ThemedText>
        ) : null}
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function MyActivitiesScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getUserActivities(user.uid);
      setActivities(list);
    } catch (e) {
      showToast.error(
        'Could not load activities',
        (e as Error)?.message || 'Please try again.'
      );
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchActivities();
    }, [fetchActivities])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
  }, [fetchActivities]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24) }]}>
        <ThemedText type="title">My Activities</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading activities...</ThemedText>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="calendar-remove" size={64} color="#9BA1A6" />
          <ThemedText style={styles.emptyTitle}>No activities yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Create your first activity using the + button!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityCard item={item} isDark={isDark} />}
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapDark: {
    backgroundColor: '#1D3D47',
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardLocation: {
    fontSize: 14,
    flex: 1,
  },
  cardDate: {
    fontSize: 14,
  },
  cardNotes: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

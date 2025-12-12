import { useAuthContext } from '@/hooks/use-auth-context';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Initialize Supabase client (make sure to set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env)
const supabase = createClient(
  (Constants.expoConfig?.extra as { supabaseUrl?: string })?.supabaseUrl || '',
  (Constants.expoConfig?.extra as { supabaseAnonKey?: string })?.supabaseAnonKey || ''
);

interface AnalyticsData {
  totalTrips: number;
  hoursDriven: number;
  totalEarnings: number;
  averagePerTrip: number;
  dailyEarnings: Array<{ day: string; value: string; progress: number }>;
}

// Helper function to get date range based on period
const getDateRange = (period: 'today' | 'weekly' | 'annual' | 'all') => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'today':
      // Use local timezone for "today"
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Sunday
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Saturday
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'annual':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'all':
      startDate = new Date(2000, 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999);
      break;
  }

  return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
};


// Fetch analytics data from Supabase
const fetchAnalyticsData = async (
  driverId: string,
  period: 'today' | 'weekly' | 'annual' | 'all'
): Promise<AnalyticsData> => {
  try {
    const { startDate, endDate } = getDateRange(period);
    const now = new Date();
    
    // Check current session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    console.log('Current auth session user ID:', currentSession?.user?.id);
    console.log('Driver ID being queried:', driverId);
    console.log('Do they match?', currentSession?.user?.id === driverId);
    
    console.log('Fetching trips for driver', driverId, 'from', startDate, 'to', endDate);
    console.log('Local time now:', now.toLocaleString());
    console.log('Date range:', new Date(startDate).toLocaleString(), 'to', new Date(endDate).toLocaleString());

    // Fetch trips for the driver within the date range
    const { data: trips, error: tripsError, count } = await supabase
      .from('trips')
      .select('trip_id, start_time, end_time', { count: 'exact' })
      .eq('driver_id', driverId)
      .gte('start_time', startDate)
      .lt('start_time', new Date(new Date(endDate).getTime() + 1000).toISOString());

    if (tripsError) {
      console.error('Trips error:', tripsError);
      console.error('Error details:', JSON.stringify(tripsError, null, 2));
      throw tripsError;
    }
    console.log('Trips fetched:', trips);
    console.log('Total trips found:', trips?.length || 0);
    console.log('Count from query:', count);
    
    // Check if RLS might be blocking
    if (trips && trips.length === 0 && count === 0) {
      console.warn('⚠️ No trips returned. This might be due to RLS policies. Check your Supabase RLS settings.');
    }

    const totalTrips = trips?.length || 0;

    // Calculate hours driven
    const hoursDriven = trips?.reduce((sum, trip) => {
      const start = new Date(trip.start_time).getTime();
      const end = trip.end_time ? new Date(trip.end_time).getTime() : start;
      return sum + (end - start) / (1000 * 60 * 60); // convert ms to hours
    }, 0) || 0;

    // Fetch payments for these trips
    const tripIds = trips?.map(t => t.trip_id) || [];
    let totalEarnings = 0;
    const dailyEarningsMap = new Map<string, number>();

    if (tripIds.length > 0) {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_time')
        .in('trip_id', tripIds);

      if (paymentsError) {
        console.error('Payments error:', paymentsError);
        throw paymentsError;
      }
      console.log('Payments fetched:', payments);

      payments?.forEach(payment => {
        const amount = payment.amount || 0;
        totalEarnings += amount;

        const date = new Date(payment.payment_time);
        const dayName = date.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
        dailyEarningsMap.set(dayName, (dailyEarningsMap.get(dayName) || 0) + amount);
      });
    }

    const averagePerTrip = totalTrips > 0 ? totalEarnings / totalTrips : 0;

    const daysOrder = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dailyEarnings = daysOrder.map(day => {
      const value = dailyEarningsMap.get(day) || 0;
      return {
        day,
        value: `₱${value.toFixed(2)}`,
        progress: totalEarnings > 0 ? value / totalEarnings : 0,
      };
    });

    return { totalTrips, hoursDriven, totalEarnings, averagePerTrip, dailyEarnings };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      totalTrips: 0,
      hoursDriven: 0,
      totalEarnings: 0,
      averagePerTrip: 0,
      dailyEarnings: Array.from({ length: 7 }, (_, i) => ({
        day: ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][i],
        value: '₱0.00',
        progress: 0,
      })),
    };
  }
};

const AnalyticsOverview: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'weekly' | 'annual' | 'all'>('today');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the logged-in driver's ID from auth context
  const { session } = useAuthContext();
  const driverId = session?.user?.id || '';

  // Set the session on Supabase client whenever it changes
  useEffect(() => {
    if (session) {
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  }, [session]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const analyticsData = await fetchAnalyticsData(driverId, period);
      setData(analyticsData);
      setLoading(false);
    };

    if (driverId) {
      loadData();
    }
  }, [period, driverId]);

  const periods = [
    { key: 'today', label: 'TODAY' },
    { key: 'weekly', label: 'WEEKLY' },
    { key: 'annual', label: 'ANNUAL' },
    { key: 'all', label: 'ALL TIME' },
  ];

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics Overview</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#BBA3E1" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Overview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pillRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              activeOpacity={0.8}
              onPress={() => setPeriod(p.key as any)}
              style={[
                styles.pill,
                period === p.key ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text style={styles.pillText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.topGrid}>
          <View style={[styles.card, { backgroundColor: '#C4B5D8' }]}>
            <Text style={styles.cardTitle}>Total Trips</Text>
            <Text style={styles.cardBig}>{data.totalTrips}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#C4B5D8' }]}>
            <Text style={styles.cardTitle}>Hours Driven</Text>
            <Text style={styles.cardBig}>{data.hoursDriven.toFixed(1)} hr</Text>
          </View>
        </View>

        <View style={styles.topGrid}>
          <View style={[styles.card, { backgroundColor: '#D4C4A8' }]}>
            <Text style={styles.cardTitle}>Daily Earnings</Text>
            <Text style={styles.cardSubtitle}>₱{data.totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#C4B5D8' }]}>
            <Text style={styles.cardTitle}>Average/Trip</Text>
            <Text style={styles.cardSubtitle}>₱{data.averagePerTrip.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>DAILY EARNINGS</Text>
          {data.dailyEarnings.map((d) => (
            <View key={d.day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{d.day}</Text>
              <Text style={styles.earningValueRow}>{d.value}</Text>
              <View style={styles.barContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[styles.progressBarFill, { width: `${Math.round(d.progress * 100)}%`, backgroundColor: '#BBA3E1' }]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
};

export default AnalyticsOverview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  header: {
    height: 75,
    backgroundColor: '#C4B5D8',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
    minHeight: Dimensions.get("screen").height * 0.9,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  pill: {
    flex: 1,
    height: 35,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  pillActive: {
    backgroundColor: '#BBA3E1',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pillInactive: {
    backgroundColor: '#D7BEFF',
  },
  pillText: { color: 'white', fontWeight: '700', fontSize: 12 },
  topGrid: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'stretch',
  },
  card: {
    flex: 1,
    height: 105,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cardTitle: { color: 'white', fontWeight: '700', fontSize: 12 },
  cardSubtitle: { color: 'white', fontSize: 16, marginTop: 6 },
  cardBig: { color: 'white', fontSize: 32, marginTop: 6 },
  earningsCard: {
    backgroundColor: '#FBF8FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  earningsTitle: { color: '#A68B7B', fontWeight: '700', marginBottom: 12 },
  earningsRow: { flexDirection: 'column' },
  dayRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 6,
  },
  earningsColumn: { width: 100 },
  dayLabel: { 
    color: '#A68B7B', 
    fontSize: 14, 
    fontWeight: '500',
    width: 100,
  },
  earningsValues: { flex: 1, alignItems: 'flex-end', paddingRight: 12 },
  earningValue: { color: '#A68B7B', marginVertical: 6, fontSize: 16, fontWeight: '400' },
  earningValueRow: { 
    width: 80, 
    textAlign: 'right', 
    color: '#A68B7B', 
    fontSize: 15,
    fontWeight: '500',
  },
  progressColumn: { width: 120, paddingLeft: 12, justifyContent: 'center' },
  barContainer: { 
    flex: 1, 
    paddingLeft: 8,
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E3E3E3',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 20,
  },
});
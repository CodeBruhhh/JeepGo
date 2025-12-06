import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
 
const SteeringWheelIcon = require('../../assets/icons/Steering.png');
 
const BACKGROUND_LIGHT = "#F0ECE1";
const PURPLE_HEADER = "#DAC8E9";
const PURPLE_CARD_BG = "#E4D9EF";
const CARD_OVERLAY_BG = "#FFFFFF";
const ACCENT_PURPLE = "#A68FC9";
const TEXT_DARK = "#4F4C52";
const TEXT_LIGHT = "#9B98A2";
const TEXT_WHITE = "#FFFFFF";
 
type TripRecord = {
  id: number | string;
  fare_collected?: number;
  passengers_dropped?: number;
  passenger_count?: number;
  destination?: string;
  pick_up?: string;
  time_of_trip?: string;
};
 
type SummaryData = {
  totalTrips: number;
  totalPassengers: number;
  totalEarnings: number;
};
 
const formatDateTime = (iso?: string) => {
  if (!iso) {
    return { date: "", time: "" };
  }
  const d = new Date(iso);
 
  const datePart = d.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
 
  const timePart = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
 
  return { date: datePart, time: timePart };
};
 
// -----------------------------
// Fetch & Process (Using Supabase JOIN for accurate data)
// -----------------------------
async function fetchTripActivitiesFromSupabase(
  driverId?: string
): Promise<{ trips: TripRecord[]; summary: SummaryData }> {
  const tableName = "trips";
 
  const { data, error } = await supabase
    .from(tableName)
    .select(
      "trip_id, destination, pick_up, start_time, payments(amount)"
    )
    .order("start_time", { ascending: false });
 
  if (error) throw error;
  if (!data) return { trips: [], summary: { totalTrips: 0, totalPassengers: 0, totalEarnings: 0 } };
 
  const normalized: TripRecord[] = data.map((row: any) => {
    const paymentRecord = row.payments && row.payments.length > 0 ? row.payments[0] : null;
    const fare = paymentRecord?.amount ?? 0;
 
    return {
      id: row.trip_id,
      passenger_count: 1,
      passengers_dropped: 1,
      fare_collected: typeof fare === "number" ? fare : 0,
      destination: row.destination ?? "Unknown Destination",
      pick_up: row.pick_up ?? "Unknown Start",
      time_of_trip: row.start_time ?? null,
    };
  });
 
  const summary = normalized.reduce(
    (acc, trip) => ({
      totalTrips: acc.totalTrips + 1,
      totalPassengers: acc.totalPassengers + (trip.passenger_count ?? 1),
      totalEarnings: acc.totalEarnings + (trip.fare_collected ?? 0),
    }),
    { totalTrips: 0, totalPassengers: 0, totalEarnings: 0 }
  );
 
  return { trips: normalized, summary };
}
 
 
/** The main summary card at the top of the screen */
const SummaryCard: React.FC<{ data: SummaryData }> = ({ data }) => (
  <View style={summaryStyles.container}>
    {/* Stats container */}
    <View style={summaryStyles.statsContainer}>
        <View style={summaryStyles.statItem}>
          <Ionicons name="bus-outline" size={18} color={TEXT_DARK} />
          <Text style={summaryStyles.statText}>Total Trips: {data.totalTrips}</Text>
        </View>
        <View style={summaryStyles.statItem}>
          <Ionicons name="people-outline" size={18} color={TEXT_DARK} />
          <Text style={summaryStyles.statText}>Total Passengers: {data.totalPassengers}</Text>
        </View>
       
        {/* Earnings */}
        <View style={summaryStyles.earningsWrapper}>
            <Text style={summaryStyles.earningsLabel}>Total Earnings</Text>
            <Text style={summaryStyles.earningsValue}>₱{data.totalEarnings.toFixed(2)}</Text>
        </View>
    </View>
   
    {/* Steering wheel icon placeholder */}
      <Image
          source={SteeringWheelIcon}
          style={summaryStyles.customWheelIcon}
          resizeMode="contain"
      />
  </View>
);
 
/** Single trip item component */
const TripItem: React.FC<{ trip: TripRecord }> = ({ trip }) => {
  const { date, time } = formatDateTime(trip.time_of_trip);
 
  const destinationHeader = `${trip.pick_up?.toUpperCase() ?? "START"} - ${
    trip.destination?.toUpperCase() ?? "END"
  }`;
 
  const cardTitle = trip.destination?.toUpperCase() || "UNKNOWN DESTINATION";
 
  return (
    <View style={tripStyles.card}>
      {/* Top Header Section */}
      <View style={tripStyles.headerBar}>
        <Text style={tripStyles.headerTitle}>{cardTitle}</Text>
      </View>
     
      {/* Detail Section (White overlay) */}
      <View style={tripStyles.detailOverlay}>
       
        {/* Destination Line */}
        <Text style={tripStyles.destinationLine}>{destinationHeader}</Text>
       
        {/* Passengers */}
        <Text style={tripStyles.detailText}>
          Passengers dropped: {trip.passengers_dropped ?? 1}
        </Text>
       
        {/* Earnings */}
        <Text style={tripStyles.detailText}>
          Earnings: ₱ {trip.fare_collected?.toFixed(2) ?? 0}
        </Text>
       
        {/* Time */}
        <View style={tripStyles.timeRow}>
          <Ionicons name="time-outline" size={14} color={TEXT_LIGHT} style={{ marginRight: 5 }} />
          <Text style={tripStyles.timeText}>{time}</Text>
        </View>
       
        {/* Date Separator (Bottom of card) */}
        <View style={tripStyles.dateSeparator}>
          <Text style={tripStyles.dateText}>{date}</Text>
        </View>
      </View>
    </View>
  );
};
 
// -----------------------------
// Main Component
// -----------------------------
export default function HistoryScreen() {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ totalTrips: 0, totalPassengers: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    load();
  }, []);
 
  async function load() {
    try {
      setLoading(true);
      setError(null);
      const { trips: fetchedTrips, summary: fetchedSummary } = await fetchTripActivitiesFromSupabase();
      setTrips(fetchedTrips);
      setSummary(fetchedSummary);
    } catch (err: any) {
      console.error("fetch error:", err);
      setError(err?.message ?? "Failed to load history. Check database columns.");
    } finally {
      setLoading(false);
    }
  }
 
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={TEXT_DARK} />
      </View>
    );
 
  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={load} style={styles.reloadButton}>
          <Text style={styles.reloadButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
 
  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Travel History</Text>
     
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SummaryCard data={summary} />
 
        <View style={styles.recentRidesHeader}>
          <Text style={styles.recentRidesText}>RECENT RIDES</Text>
        </View>
 
        {trips.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No travel history yet.</Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            renderItem={({ item }) => <TripItem trip={item} />}
            keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </View>
  );
}
 
// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
    paddingTop: 50,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: TEXT_DARK,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: "#b91c1c",
    marginBottom: 12,
  },
  reloadButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: ACCENT_PURPLE,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: TEXT_WHITE,
    fontWeight: "600",
  },
  emptyText: {
    color: TEXT_LIGHT,
    marginTop: 20,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  recentRidesHeader: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  recentRidesText: {
    backgroundColor: ACCENT_PURPLE,
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
    fontWeight: "bold",
    color: TEXT_WHITE,
    fontSize: 14,
    opacity: 0.85,
    shadowColor: TEXT_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});
 
const summaryStyles = StyleSheet.create({
  container: {
    backgroundColor: PURPLE_CARD_BG,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statsContainer: {
    flex: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  statText: {
    fontSize: 14,
    color: TEXT_DARK,
    marginLeft: 8,
    fontWeight: "600",
  },
  earningsWrapper: {
    marginTop: 15,
  },
  earningsLabel: {
    fontSize: 14,
    color: TEXT_DARK,
    opacity: 0.7,
  },
  earningsValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: TEXT_DARK,
    marginTop: 2,
  },
  wheelContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TEXT_WHITE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PURPLE_HEADER,
    overflow: 'hidden',
    marginLeft: 20,
    opacity: 0.7,
  },
  wheelIcon: {
    color: TEXT_DARK,
    opacity: 0.4,
    transform: [{ rotate: '0deg' }],
  },
  customWheelIcon: {
    width: 75,
    height: 75,
    tintColor: TEXT_WHITE,
    opacity: 1,
  },
});
 
const tripStyles = StyleSheet.create({
  card: {
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: PURPLE_CARD_BG,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: PURPLE_CARD_BG,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: TEXT_DARK,
  },
  detailOverlay: {
    backgroundColor: CARD_OVERLAY_BG,
    padding: 15,
  },
  destinationLine: {
    fontSize: 15,
    fontWeight: "bold",
    color: TEXT_DARK,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 13,
    color: TEXT_LIGHT,
  },
  dateSeparator: {
    backgroundColor: ACCENT_PURPLE,
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 10,
    marginHorizontal: -15,
  },
  dateText: {
    fontSize: 14,
    color: TEXT_WHITE,
    fontWeight: "600",
  },
});
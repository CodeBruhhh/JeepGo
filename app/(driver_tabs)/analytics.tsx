import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const AnalyticsOverview: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'weekly' | 'annual' | 'all'>('today');
  const periods = [
    { key: 'today', label: 'TODAY' },
    { key: 'weekly', label: 'WEEKLY' },
    { key: 'annual', label: 'ANNUAL' },
    { key: 'all', label: 'ALL TIME' },
  ];
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
            <Text style={styles.cardBig}>10</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#C4B5D8' }]}>
            <Text style={styles.cardTitle}>Hours Driven</Text>
            <Text style={styles.cardBig}>7.5 hr</Text>
          </View>
        </View>

        <View style={styles.topGrid}>
          <View style={[styles.card, { backgroundColor: '#D4C4A8' }]}>
            <Text style={styles.cardTitle}>Daily Earnings</Text>
            <Text style={styles.cardSubtitle}>₱1,234</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#C4B5D8' }]}>
            <Text style={styles.cardTitle}>Average/Trip</Text>
            <Text style={styles.cardSubtitle}>₱210.35</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>DAILY EARNINGS</Text>
          {[
            { day: 'MONDAY', value: '₱1,234', progress: 0.7 },
            { day: 'TUESDAY', value: '₱982', progress: 0.55 },
            { day: 'WEDNESDAY', value: '₱1,345', progress: 0.65 },
            { day: 'THURSDAY', value: '₱1,390', progress: 0.82 },
            { day: 'FRIDAY', value: '₱1,120', progress: 0.6 },
            { day: 'SATURDAY', value: '₱1,190', progress: 0.64 },
            { day: 'SUNDAY', value: '₱994', progress: 0.52 },
          ].map((d) => (
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
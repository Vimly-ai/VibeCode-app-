import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useEmployeeStore } from '../state/employeeStore';

type LeaderboardFilter = 'all' | 'weekly' | 'monthly' | 'quarterly';

export const LeaderboardScreen: React.FC = () => {
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const { getLeaderboard, currentEmployee } = useEmployeeStore();
  
  const leaderboard = getLeaderboard();
  
  const getPointsForFilter = (employee: any) => {
    switch (filter) {
      case 'weekly': return employee.weeklyPoints;
      case 'monthly': return employee.monthlyPoints;
      case 'quarterly': return employee.quarterlyPoints;
      default: return employee.totalPoints;
    }
  };
  
  const sortedLeaderboard = [...leaderboard].sort((a, b) => 
    getPointsForFilter(b) - getPointsForFilter(a)
  );
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return { name: 'trophy', color: '#F59E0B' };
      case 2: return { name: 'medal', color: '#9CA3AF' };
      case 3: return { name: 'ribbon', color: '#CD7F32' };
      default: return { name: 'person', color: '#6B7280' };
    }
  };
  
  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1: return ['#FEF3C7', '#FCD34D'];
      case 2: return ['#F3F4F6', '#D1D5DB'];
      case 3: return ['#FED7AA', '#FB923C'];
      default: return ['#FFFFFF', '#FFFFFF'];
    }
  };
  
  const filterOptions = [
    { key: 'all', label: 'All Time' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'quarterly', label: 'This Quarter' },
  ];
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#18181b' }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.glassCard, { alignItems: 'center', padding: 36 }]}>
          <Text style={{ color: '#b87333', fontSize: 32, fontWeight: 'bold', fontFamily: 'UnifrakturCook', marginBottom: 8 }}>Leaderboard</Text>
          <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>See how you stack up against your teammates and climb the ranks!</Text>
        </View>
        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', marginBottom: 24, width: '100%', maxWidth: 600, justifyContent: 'center' }}>
          {filterOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key as LeaderboardFilter)}
              style={{
                backgroundColor: filter === option.key ? 'rgba(255,255,255,0.22)' : 'rgba(40,40,48,0.5)',
                borderColor: filter === option.key ? '#b87333' : 'transparent',
                borderWidth: 2,
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 24,
                marginHorizontal: 6,
                marginBottom: 2,
              }}
            >
              <Text style={{ color: filter === option.key ? '#b87333' : '#fff', fontWeight: 'bold', fontSize: 16 }}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {/* Podium for Top 3 */}
        {sortedLeaderboard.length >= 3 && (
          <View style={{ flexDirection: 'row', width: '100%', maxWidth: 600, justifyContent: 'center', marginBottom: 32 }}>
            {/* 2nd Place */}
            <View style={[styles.glassCard, { flex: 1, marginRight: 8, alignItems: 'center', backgroundColor: 'rgba(220,220,220,0.18)', borderColor: '#9CA3AF' }]}>
              <Ionicons name="medal" size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#9CA3AF', fontSize: 22, fontWeight: 'bold' }}>{sortedLeaderboard[1]?.name.split(' ')[0]}</Text>
              <Text style={{ color: '#fff', fontSize: 18 }}>{getPointsForFilter(sortedLeaderboard[1])} pts</Text>
            </View>
            {/* 1st Place */}
            <View style={[styles.glassCard, { flex: 1, marginHorizontal: 4, alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.18)', borderColor: '#F59E0B' }]}>
              <Ionicons name="trophy" size={44} color="#F59E0B" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#F59E0B', fontSize: 26, fontWeight: 'bold' }}>{sortedLeaderboard[0]?.name.split(' ')[0]}</Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{getPointsForFilter(sortedLeaderboard[0])} pts</Text>
            </View>
            {/* 3rd Place */}
            <View style={[styles.glassCard, { flex: 1, marginLeft: 8, alignItems: 'center', backgroundColor: 'rgba(205,127,50,0.18)', borderColor: '#CD7F32' }]}>
              <Ionicons name="ribbon" size={36} color="#CD7F32" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#CD7F32', fontSize: 22, fontWeight: 'bold' }}>{sortedLeaderboard[2]?.name.split(' ')[0]}</Text>
              <Text style={{ color: '#fff', fontSize: 18 }}>{getPointsForFilter(sortedLeaderboard[2])} pts</Text>
            </View>
          </View>
        )}
        {/* Leaderboard List */}
        <View style={{ width: '100%', maxWidth: 600 }}>
          {sortedLeaderboard.map((employee, index) => {
            const rank = index + 1;
            const isCurrentUser = employee.id === currentEmployee?.id;
            return (
              <View
                key={employee.id}
                style={[
                  styles.glassCard,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16,
                    borderColor: rank <= 10 ? '#b87333' : 'rgba(255,255,255,0.12)',
                    backgroundColor: isCurrentUser ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.10)',
                    shadowColor: isCurrentUser ? '#3B82F6' : '#b87333',
                    shadowOpacity: isCurrentUser ? 0.25 : 0.15,
                  },
                ]}
              >
                <View style={{ width: 36, alignItems: 'center' }}>
                  <Text style={{ color: isCurrentUser ? '#3B82F6' : '#b87333', fontSize: 22, fontWeight: 'bold' }}>{rank}</Text>
                </View>
                <Ionicons name={getRankIcon(rank).name as any} size={28} color={getRankIcon(rank).color} style={{ marginHorizontal: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isCurrentUser ? '#3B82F6' : '#fff', fontSize: 18, fontWeight: isCurrentUser ? 'bold' : 'normal' }}>{employee.name}{isCurrentUser && <Text style={{ color: '#3B82F6' }}> (You)</Text>}</Text>
                  <Text style={{ color: '#e5e7eb', fontSize: 14 }}>{employee.currentStreak} day streak</Text>
                </View>
                <Text style={{ color: isCurrentUser ? '#3B82F6' : '#fff', fontSize: 20, fontWeight: 'bold', marginRight: 12 }}>{getPointsForFilter(employee)}</Text>
                <Text style={{ color: '#e5e7eb', fontSize: 14 }}>pts</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { width: '100%', maxWidth: 800, alignItems: 'center' },
  glassCard: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: '#b87333',
    shadowColor: '#b87333',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    padding: 32,
    marginBottom: 24,
  },
  heading: { fontSize: 32, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#b87333', fontFamily: 'UnifrakturCook' },
  subheading: { color: '#b87333', fontSize: 16, marginBottom: 16, textAlign: 'center' },
  filterTabsWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabInactive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterTabText: {
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterTabTextInactive: {
    color: '#666',
  },
  podiumContainer: {
    width: '100%',
    maxWidth: 800,
    padding: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: '#7c7c7c',
    shadowColor: '#7c7c7c',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginBottom: 16,
  },
  podiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#7c7c7c',
    fontFamily: 'UnifrakturCook',
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  podiumItem: {
    alignItems: 'center',
  },
  podiumIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 14,
    color: '#666',
  },
  leaderboardList: {
    width: '100%',
  },
  leaderboardItem: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankTextWhite: {
    color: 'white',
  },
  rankTextGray: {
    color: '#6B7280',
  },
  rankIconContainer: {
    marginRight: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  employeeNameWhite: {
    color: 'white',
  },
  employeeNameGray: {
    color: '#6B7280',
  },
  employeeNameYou: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  employeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  employeeBadgeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  employeeBadgeTextWhite: {
    color: 'white',
  },
  employeeBadgeTextGray: {
    color: '#6B7280',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsTextWhite: {
    color: 'white',
  },
  pointsTextGray: {
    color: '#6B7280',
  },
  pointsUnit: {
    fontSize: 14,
    color: '#666',
  },
  pointsUnitWhite: {
    color: 'white',
  },
  pointsUnitGray: {
    color: '#6B7280',
  },
  badgesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  badgesList: {
    flexDirection: 'row',
    marginRight: 8,
  },
  badgeItem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesCount: {
    fontSize: 14,
    color: '#666',
  },
  badgesCountWhite: {
    color: 'white',
  },
  badgesCountGray: {
    color: '#6B7280',
  },
  emptyStateContainer: {
    width: '100%',
    maxWidth: 800,
    padding: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: '#7c7c7c',
    shadowColor: '#7c7c7c',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c7c7c',
    marginTop: 16,
  },
  emptyStateText: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});
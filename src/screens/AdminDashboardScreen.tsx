import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../state/authStore';
import { useEmployeeStore } from '../state/employeeStore';
import { format, parseISO, subDays, subWeeks, subMonths } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

// Move checkInBadge out of StyleSheet.create
const checkInBadge = (type: 'early' | 'ontime' | 'late') => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: type === 'early' ? '#F59E0B' : type === 'ontime' ? '#10B981' : '#E5E7EB',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { width: '100%', maxWidth: 800, alignItems: 'center' },
  glassCard: { width: '100%', padding: 32, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: '#b87333', shadowColor: '#b87333', shadowOpacity: 0.25, shadowRadius: 8, marginBottom: 24 },
  heading: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#b87333', fontFamily: 'UnifrakturCook' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subheading: { color: '#b87333', fontSize: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  iconBox: { width: 48, height: 48, backgroundColor: '#b87333', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  // ...add more styles for other sections as needed...
});

export const AdminDashboardScreen: React.FC = () => {
  try {
    const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
    const navigation = useNavigation();
    const { currentUser, getAllUsers, getPendingUsers } = useAuthStore();
    const { employees, getLeaderboard, approveRewardRedemption } = useEmployeeStore();
    
    if (!currentUser) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
          <Ionicons name="person-circle-outline" size={120} color="#9CA3AF" />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a202c', marginTop: 16 }}>No admin user found</Text>
          <Text style={{ color: '#4b5563', marginTop: 8, textAlign: 'center' }}>
            Please log in as an admin to view this dashboard.
          </Text>
        </SafeAreaView>
      );
    }
    if (!employees || employees.length === 0) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
          <Text style={{ fontSize: 18, color: '#EF4444' }}>No employee data available. Please check your connection or try again later.</Text>
        </SafeAreaView>
      );
    }
    
    const allUsers = getAllUsers();
    const pendingUsers = getPendingUsers();
    const leaderboard = getLeaderboard();
    
    // Calculate analytics
    const totalEmployees = allUsers.length;
    const pendingApprovals = pendingUsers.length;
    const totalPoints = employees.reduce((sum, emp) => sum + emp.totalPoints, 0);
    const totalCheckIns = employees.reduce((sum, emp) => sum + (emp.checkIns || []).length, 0);
    const averagePoints = totalEmployees > 0 ? Math.round(totalPoints / totalEmployees) : 0;
    
    // Recent activity
    const recentCheckIns = employees
      .flatMap(emp => (emp.checkIns || []).map(ci => ({ ...ci, employeeName: emp.name })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
        
    // Recent bonus points
    const recentBonusPoints = employees
      .flatMap(emp => (emp.bonusPoints || []).map(bp => ({ ...bp, employeeName: emp.name })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    // Pending rewards
    const pendingRewards = employees
      .flatMap(emp => (emp.rewardsRedeemed || []).filter(reward => reward.status === 'pending'))
      .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
    
    const timeframeOptions = [
      { key: 'week', label: 'This Week' },
      { key: 'month', label: 'This Month' },
      { key: 'quarter', label: 'This Quarter' },
    ];
    
    const handleApproveReward = (rewardId: string) => {
      Alert.alert(
        'Approve Reward',
        'Are you sure you want to approve this reward redemption?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            onPress: () => {
              const success = approveRewardRedemption(rewardId);
              if (success) {
                Alert.alert('Success', 'Reward approved successfully!');
              } else {
                Alert.alert('Error', 'Failed to approve reward');
              }
            }
          }
        ]
      );
    };
    
    if (currentUser?.role !== 'admin') {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="shield" size={64} color="#EF4444" />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1a202c', marginTop: 16 }}>Access Denied</Text>
          <Text style={{ color: '#4b5563', marginTop: 8 }}>Admin access required</Text>
        </SafeAreaView>
      );
    }
    
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.centered}>
            <View style={styles.glassCard}>
              <Text style={styles.heading}>Admin Dashboard</Text>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.subheading}>Admin Dashboard</Text>
                  <Text style={styles.name}>Welcome, {currentUser.name}</Text>
                </View>
                <View style={styles.iconBox}>
                  <Ionicons name="shield-checkmark" size={24} color="#fff" />
                </View>
              </View>
            </View>
            
            {/* Quick Stats */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Animated.View entering={FadeInRight.delay(100)} style={{ flex: 1, marginRight: 8 }}>
                  <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    style={{ padding: 16, borderRadius: 16 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ color: '#dbeafe', fontSize: 14 }}>Total Employees</Text>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{totalEmployees}</Text>
                      </View>
                      <Ionicons name="people" size={24} color="white" />
                    </View>
                  </LinearGradient>
                </Animated.View>
                
                <Animated.View entering={FadeInRight.delay(200)} style={{ flex: 1, marginLeft: 8 }}>
                  <Pressable
                    onPress={() => navigation.navigate('Employees' as never)}
                    style={{ flex: 1 }}
                  >
                    <LinearGradient
                      colors={pendingApprovals > 0 ? ['#F59E0B', '#D97706'] : ['#9CA3AF', '#6B7280']}
                      style={{ padding: 16, borderRadius: 16 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{ color: '#fef3c7', fontSize: 14 }}>Pending Approvals</Text>
                          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{pendingApprovals}</Text>
                          {pendingApprovals > 0 ? (
                            <Text style={{ color: '#fef3c7', fontSize: 12, marginTop: 4 }}>Tap to review →</Text>
                          ) : (
                            <Text style={{ color: '#fef3c7', fontSize: 12, marginTop: 4 }}>All caught up!</Text>
                          )}
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Ionicons name="time" size={24} color="white" />
                          {pendingApprovals > 0 && (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>!</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
            
            {/* Timeframe Filter */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24, width: '100%' }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {timeframeOptions.map((option) => {
                    const isActive = selectedTimeframe === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => setSelectedTimeframe(option.key as any)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 24,
                          marginRight: 8,
                          backgroundColor: isActive ? '#2563eb' : '#fff',
                          borderWidth: isActive ? 0 : 1,
                          borderColor: isActive ? 'transparent' : '#e5e7eb',
                        }}
                      >
                        <Text style={{
                          fontWeight: '500',
                          color: isActive ? '#fff' : '#4b5563',
                        }}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
            {/* Analytics Cards */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Animated.View entering={FadeInDown.delay(300)} style={{ flex: 1, marginRight: 8, backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, backgroundColor: '#bbf7d0', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="diamond" size={24} color="#10B981" />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a202c' }}>{totalPoints.toLocaleString()}</Text>
                    <Text style={{ color: '#4b5563', fontSize: 14, textAlign: 'center' }}>Total Points Earned</Text>
                  </View>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(400)} style={{ flex: 1, marginLeft: 8, backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, backgroundColor: '#e9d5ff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a202c' }}>{totalCheckIns}</Text>
                    <Text style={{ color: '#4b5563', fontSize: 14, textAlign: 'center' }}>Total Check-ins</Text>
                  </View>
                </Animated.View>
              </View>
            </View>
            
            {/* Top Performers */}
            <Animated.View entering={FadeInDown.delay(500)} style={{ paddingHorizontal: 24, marginBottom: 24, width: '100%' }}>
              <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a202c', marginBottom: 16 }}>Top Performers</Text>
                <View>
                  {leaderboard.slice(0, 5).map((employee, index) => (
                    <View key={employee.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ width: 32, height: 32, backgroundColor: '#dbeafe', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 14 }}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '500', color: '#1a202c' }}>{employee.name}</Text>
                          <Text style={{ fontSize: 12, color: '#4b5563' }}>{employee.currentStreak} day streak</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a202c' }}>{employee.totalPoints}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
            
            {/* Pending Rewards */}
            {pendingRewards.length > 0 && (
              <Animated.View entering={FadeInDown.delay(600)} style={{ paddingHorizontal: 24, marginBottom: 24, width: '100%' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a202c' }}>Pending Rewards</Text>
                    <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
                      <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 14 }}>{pendingRewards.length}</Text>
                    </View>
                  </View>
                  <View>
                    {pendingRewards.slice(0, 5).map((reward, index) => {
                      const employee = employees.find(emp => 
                        emp.rewardsRedeemed.some(r => r.id === reward.id)
                      );
                      return (
                        <View key={reward.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '500', color: '#1a202c' }}>{reward.rewardName}</Text>
                            <Text style={{ fontSize: 12, color: '#4b5563' }}>
                              {employee?.name} • {format(parseISO(reward.redeemedAt), 'MMM d, yyyy')}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: '#4b5563', marginRight: 8 }}>{reward.pointsCost} pts</Text>
                            <Pressable 
                              onPress={() => handleApproveReward(reward.id)}
                              style={{ backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}
                            >
                              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Approve</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>
            )}
            
            {/* Recent Activity */}
            <Animated.View entering={FadeInDown.delay(700)} style={{ paddingHorizontal: 24, marginBottom: 24, width: '100%' }}>
              <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a202c', marginBottom: 16 }}>Recent Check-ins</Text>
                <View>
                  {recentCheckIns.slice(0, 8).map((checkIn, index) => (
                    <View key={checkIn.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={checkInBadge(checkIn.type)}>
                          <Ionicons 
                            name={checkIn.type === 'early' ? "sunny" : checkIn.type === 'ontime' ? "checkmark" : "time"} 
                            size={16} 
                            color={checkIn.type === 'early' ? "#F59E0B" : checkIn.type === 'ontime' ? "#10B981" : "#6B7280"} 
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontWeight: '500', color: '#1a202c' }}>{checkIn.employeeName}</Text>
                          <Text style={{ fontSize: 12, color: '#4b5563' }}>
                            {format(parseISO(checkIn.timestamp), 'MMM d, h:mm a')}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1a202c' }}>+{checkIn.pointsEarned}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Recent Bonus Points */}
            {recentBonusPoints.length > 0 && (
              <Animated.View entering={FadeInDown.delay(750)} style={{ paddingHorizontal: 24, marginBottom: 24, width: '100%' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, borderLeftWidth: 4, borderLeftColor: '#3B82F6' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a202c', marginBottom: 16 }}>Recent Bonus Points</Text>
                  <View>
                    {recentBonusPoints.slice(0, 8).map((bonus, index) => (
                      <View key={bonus.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: '#dbeafe' }}>
                            <Ionicons 
                              name="star" 
                              size={16} 
                              color="#3B82F6" 
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '500', color: '#1a202c' }}>{bonus.employeeName}</Text>
                            <Text style={{ fontSize: 12, color: '#4b5563' }}>
                              {format(parseISO(bonus.timestamp), 'MMM d, h:mm a')}
                            </Text>
                            <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                              {bonus.reason}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3B82F6' }}>+{bonus.pointsAwarded}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
            
            {/* Bottom padding */}
            <View style={{ height: 80 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  } catch (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ fontSize: 18, color: '#EF4444' }}>An unexpected error occurred: {String(error)}</Text>
      </SafeAreaView>
    );
  }
};
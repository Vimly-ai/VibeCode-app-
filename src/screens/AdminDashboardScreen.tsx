import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../state/authStore';
import { useEmployeeStore } from '../state/employeeStore';
import { format, parseISO, subDays, subWeeks, subMonths } from 'date-fns';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { cn } from '../utils/cn';

const { width: screenWidth } = Dimensions.get('window');

export const AdminDashboardScreen: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const navigation = useNavigation();
  const { currentUser, getAllUsers, getPendingUsers } = useAuthStore();
  const { employees, getLeaderboard, approveRewardRedemption } = useEmployeeStore();
  
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
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Ionicons name="shield" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-900 mt-4">Access Denied</Text>
        <Text className="text-gray-600 mt-2">Admin access required</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-600 text-base">Admin Dashboard</Text>
              <Text className="text-2xl font-bold text-gray-900">
                Welcome, {currentUser.name}
              </Text>
            </View>
            <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
              <Ionicons name="shield-checkmark" size={24} color="white" />
            </View>
          </View>
        </View>
        
        {/* Quick Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row space-x-4">
            <Animated.View entering={FadeInRight.delay(100)} className="flex-1">
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                className="p-4 rounded-xl"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-blue-100 text-sm">Total Employees</Text>
                    <Text className="text-white text-2xl font-bold">{totalEmployees}</Text>
                  </View>
                  <Ionicons name="people" size={24} color="white" />
                </View>
              </LinearGradient>
            </Animated.View>
            
            <Animated.View entering={FadeInRight.delay(200)} className="flex-1">
              <Pressable
                onPress={() => navigation.navigate('Employees' as never)}
                className="flex-1"
              >
                <LinearGradient
                  colors={pendingApprovals > 0 ? ['#F59E0B', '#D97706'] : ['#9CA3AF', '#6B7280']}
                  className="p-4 rounded-xl"
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-orange-100 text-sm">Pending Approvals</Text>
                      <Text className="text-white text-2xl font-bold">{pendingApprovals}</Text>
                      {pendingApprovals > 0 ? (
                        <Text className="text-orange-100 text-xs mt-1">Tap to review →</Text>
                      ) : (
                        <Text className="text-orange-100 text-xs mt-1">All caught up!</Text>
                      )}
                    </View>
                    <View className="items-center">
                      <Ionicons name="time" size={24} color="white" />
                      {pendingApprovals > 0 && (
                        <View className="bg-white/20 rounded-full w-6 h-6 items-center justify-center mt-1">
                          <Text className="text-white text-xs font-bold">!</Text>
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
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {timeframeOptions.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedTimeframe(option.key as any)}
                  className={cn(
                    "px-4 py-2 rounded-full",
                    selectedTimeframe === option.key
                      ? "bg-blue-600"
                      : "bg-white border border-gray-200"
                  )}
                >
                  <Text
                    className={cn(
                      "font-medium",
                      selectedTimeframe === option.key
                        ? "text-white"
                        : "text-gray-600"
                    )}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Analytics Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row space-x-4">
            <Animated.View entering={FadeInDown.delay(300)} className="flex-1 bg-white p-5 rounded-xl shadow-sm">
              <View className="items-center">
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="diamond" size={24} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">{totalPoints.toLocaleString()}</Text>
                <Text className="text-gray-600 text-sm text-center">Total Points Earned</Text>
              </View>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.delay(400)} className="flex-1 bg-white p-5 rounded-xl shadow-sm">
              <View className="items-center">
                <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">{totalCheckIns}</Text>
                <Text className="text-gray-600 text-sm text-center">Total Check-ins</Text>
              </View>
            </Animated.View>
          </View>
        </View>
        
        {/* Top Performers */}
        <Animated.View entering={FadeInDown.delay(500)} className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Top Performers</Text>
            <View className="space-y-3">
              {leaderboard.slice(0, 5).map((employee, index) => (
                <View key={employee.id} className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 font-semibold text-sm">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{employee.name}</Text>
                      <Text className="text-sm text-gray-600">{employee.currentStreak} day streak</Text>
                    </View>
                  </View>
                  <Text className="text-lg font-semibold text-gray-900">
                    {employee.totalPoints}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Pending Rewards */}
        {pendingRewards.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)} className="px-6 mb-6">
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Pending Rewards</Text>
                <View className="bg-red-100 px-3 py-1 rounded-full">
                  <Text className="text-red-600 font-semibold text-sm">{pendingRewards.length}</Text>
                </View>
              </View>
              <View className="space-y-3">
                {pendingRewards.slice(0, 5).map((reward, index) => {
                  const employee = employees.find(emp => 
                    emp.rewardsRedeemed.some(r => r.id === reward.id)
                  );
                  return (
                    <View key={reward.id} className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">{reward.rewardName}</Text>
                        <Text className="text-sm text-gray-600">
                          {employee?.name} • {format(parseISO(reward.redeemedAt), 'MMM d, yyyy')}
                        </Text>
                      </View>
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-sm text-gray-600">{reward.pointsCost} pts</Text>
                        <Pressable 
                          onPress={() => handleApproveReward(reward.id)}
                          className="bg-green-600 px-3 py-1 rounded-full"
                        >
                          <Text className="text-white text-sm font-medium">Approve</Text>
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
        <Animated.View entering={FadeInDown.delay(700)} className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Check-ins</Text>
            <View className="space-y-3">
              {recentCheckIns.slice(0, 8).map((checkIn, index) => (
                <View key={checkIn.id} className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className={cn(
                      "w-8 h-8 rounded-full items-center justify-center mr-3",
                      checkIn.type === 'early' ? "bg-yellow-100" :
                      checkIn.type === 'ontime' ? "bg-green-100" : "bg-gray-100"
                    )}>
                      <Ionicons 
                        name={checkIn.type === 'early' ? "sunny" : checkIn.type === 'ontime' ? "checkmark" : "time"} 
                        size={16} 
                        color={checkIn.type === 'early' ? "#F59E0B" : checkIn.type === 'ontime' ? "#10B981" : "#6B7280"} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{checkIn.employeeName}</Text>
                      <Text className="text-sm text-gray-600">
                        {format(parseISO(checkIn.timestamp), 'MMM d, h:mm a')}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">
                    +{checkIn.pointsEarned}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Recent Bonus Points */}
        {recentBonusPoints.length > 0 && (
          <Animated.View entering={FadeInDown.delay(750)} className="px-6 mb-6">
            <View className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-blue-500">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Bonus Points</Text>
              <View className="space-y-3">
                {recentBonusPoints.slice(0, 8).map((bonus, index) => (
                  <View key={bonus.id} className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-blue-100">
                        <Ionicons 
                          name="star" 
                          size={16} 
                          color="#3B82F6" 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">{bonus.employeeName}</Text>
                        <Text className="text-sm text-gray-600">
                          {format(parseISO(bonus.timestamp), 'MMM d, h:mm a')}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {bonus.reason}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-semibold text-blue-600">
                      +{bonus.pointsAwarded}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};
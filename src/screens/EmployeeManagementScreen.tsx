import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, parseISO, getDay, getHours, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useAuthStore } from '../state/authStore';
import { useEmployeeStore } from '../state/employeeStore';
import { cn } from '../utils/cn';

type TabType = 'approved' | 'pending' | 'analytics';

export const EmployeeManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('approved');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardPoints, setRewardPoints] = useState('');
  const [rewardReason, setRewardReason] = useState('');
  
  const { currentUser, getAllUsers, getPendingUsers, approveUser, rejectUser, updateUserRole } = useAuthStore();
  const { employees, getEmployeeStats, awardBonusPoints } = useEmployeeStore();
  
  const approvedUsers = getAllUsers();
  const pendingUsers = getPendingUsers();
  
  // Merge auth users with employee data
  const employeesWithData = approvedUsers.map(user => {
    const employeeData = employees.find(emp => emp.email === user.email);
    return {
      ...user,
      ...employeeData,
      totalPoints: employeeData?.totalPoints || 0,
      currentStreak: employeeData?.currentStreak || 0,
      checkIns: employeeData?.checkIns || [],
      badges: employeeData?.badges || [],
    };
  });
  
  if (currentUser?.role !== 'admin') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Ionicons name="shield-off" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-900 mt-4">Access Denied</Text>
        <Text className="text-gray-600 mt-2">Admin access required</Text>
      </SafeAreaView>
    );
  }
  
  const handleApproveUser = (userId: string) => {
    Alert.alert(
      'Approve User',
      'Are you sure you want to approve this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            const success = approveUser(userId, currentUser.id);
            if (success) {
              Alert.alert('Success', 'User approved successfully');
            }
          }
        }
      ]
    );
  };
  
  const handleRejectUser = (userId: string) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            const success = rejectUser(userId, currentUser.id);
            if (success) {
              Alert.alert('Success', 'User rejected');
            }
          }
        }
      ]
    );
  };
  
  const analyzeEmployeeData = (employee: any) => {
    if (!employee.checkIns || employee.checkIns.length === 0) {
      return {
        weeklyPatterns: {},
        timePatterns: {},
        insights: ['No check-in data available yet.'],
        averageCheckInTime: null,
        consistencyScore: 0,
        earlyDays: 0,
        onTimeDays: 0,
        lateDays: 0
      };
    }

    const checkIns = employee.checkIns || [];
    const weeklyPatterns: { [key: string]: { early: number; ontime: number; late: number } } = {};
    const timePatterns: { [key: string]: number } = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let totalMinutes = 0;
    let earlyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    // Initialize weekly patterns
    dayNames.forEach(day => {
      weeklyPatterns[day] = { early: 0, ontime: 0, late: 0 };
    });

    checkIns.forEach((checkIn: any) => {
      const date = parseISO(checkIn.timestamp);
      const dayOfWeek = dayNames[getDay(date)];
      const hour = getHours(date);
      const minute = date.getMinutes();
      const totalMinutesInDay = hour * 60 + minute;
      
      totalMinutes += totalMinutesInDay;
      
      // Weekly patterns
      weeklyPatterns[dayOfWeek][checkIn.type]++;
      
      // Time patterns (group by hour)
      const hourKey = `${hour}:00`;
      timePatterns[hourKey] = (timePatterns[hourKey] || 0) + 1;
      
      // Count by type
      if (checkIn.type === 'early') earlyCount++;
      else if (checkIn.type === 'ontime') onTimeCount++;
      else lateCount++;
    });

    const averageMinutes = checkIns.length > 0 ? totalMinutes / checkIns.length : 0;
    const averageHour = Math.floor(averageMinutes / 60);
    const averageMinute = Math.round(averageMinutes % 60);
    const averageCheckInTime = checkIns.length > 0 ? `${averageHour.toString().padStart(2, '0')}:${averageMinute.toString().padStart(2, '0')}` : null;

    // Calculate consistency score (percentage of on-time or early)
    const consistencyScore = checkIns.length > 0 ? Math.round(((earlyCount + onTimeCount) / checkIns.length) * 100) : 0;

    // Generate insights
    const insights = [];
    
    // Weekly pattern insights
    const mostConsistentDay = Object.entries(weeklyPatterns).reduce((best, [day, pattern]) => {
      const consistency = (pattern.early + pattern.ontime) / Math.max(1, pattern.early + pattern.ontime + pattern.late);
      const bestConsistency = (best.pattern.early + best.pattern.ontime) / Math.max(1, best.pattern.early + best.pattern.ontime + best.pattern.late);
      return consistency > bestConsistency ? { day, pattern } : best;
    }, { day: dayNames[0], pattern: weeklyPatterns[dayNames[0]] });

    const mostProblematicDay = Object.entries(weeklyPatterns).reduce((worst, [day, pattern]) => {
      const latePercentage = pattern.late / Math.max(1, pattern.early + pattern.ontime + pattern.late);
      const worstPercentage = worst.pattern.late / Math.max(1, worst.pattern.early + worst.pattern.ontime + worst.pattern.late);
      return latePercentage > worstPercentage ? { day, pattern } : worst;
    }, { day: dayNames[0], pattern: weeklyPatterns[dayNames[0]] });

    if (mostConsistentDay.day !== dayNames[0] || (mostConsistentDay.pattern.early + mostConsistentDay.pattern.ontime) > 0) {
      insights.push(`Most consistent on ${mostConsistentDay.day}s`);
    }

    if (mostProblematicDay.pattern.late > 0) {
      insights.push(`Tends to be late on ${mostProblematicDay.day}s`);
    }

    // Time pattern insights
    const peakHour = Object.entries(timePatterns).reduce((peak, [hour, count]) => 
      count > peak.count ? { hour, count } : peak, { hour: '8:00', count: 0 });
    
    if (peakHour.count > 1) {
      insights.push(`Usually checks in around ${peakHour.hour}`);
    }

    // Performance insights
    if (consistencyScore >= 90) {
      insights.push('Excellent attendance consistency');
    } else if (consistencyScore >= 70) {
      insights.push('Good attendance with room for improvement');
    } else if (consistencyScore >= 50) {
      insights.push('Inconsistent attendance pattern');
    } else {
      insights.push('Needs significant improvement in punctuality');
    }

    if (earlyCount > onTimeCount && earlyCount > lateCount) {
      insights.push('Frequently arrives early - shows great dedication');
    }

    if (employee.currentStreak >= 7) {
      insights.push(`Strong momentum with ${employee.currentStreak} day streak`);
    }

    return {
      weeklyPatterns,
      timePatterns,
      insights: insights.length > 0 ? insights : ['Analyzing patterns...'],
      averageCheckInTime,
      consistencyScore,
      earlyDays: earlyCount,
      onTimeDays: onTimeCount,
      lateDays: lateCount
    };
  };

  const handleGiveReward = () => {
    if (!rewardPoints || !rewardReason.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const points = parseInt(rewardPoints);
    if (isNaN(points) || points <= 0) {
      Alert.alert('Error', 'Please enter a valid number of points');
      return;
    }
    
    const success = awardBonusPoints(selectedEmployee.id, points, rewardReason);
    if (success) {
      Alert.alert('Success', `Awarded ${points} points to ${selectedEmployee?.name}`);
    } else {
      Alert.alert('Error', 'Failed to award points');
    }
    setShowRewardModal(false);
    setRewardPoints('');
    setRewardReason('');
    setSelectedEmployee(null);
  };
  
  const tabs = [
    { key: 'approved', label: 'Employees', icon: 'people', count: approvedUsers.length },
    { key: 'pending', label: 'Pending', icon: 'time', count: pendingUsers.length },
    { key: 'analytics', label: 'Analytics', icon: 'analytics', count: 0 },
  ];
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-2xl font-bold text-gray-900">Employee Management</Text>
        <Text className="text-gray-600 mt-1">Manage users and track performance</Text>
      </View>
      
      {/* Tabs */}
      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  "px-4 py-3 rounded-full flex-row items-center space-x-2",
                  activeTab === tab.key
                    ? "bg-blue-600"
                    : "bg-white border border-gray-200"
                )}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={18} 
                  color={activeTab === tab.key ? 'white' : '#6B7280'} 
                />
                <Text
                  className={cn(
                    "font-medium",
                    activeTab === tab.key
                      ? "text-white"
                      : "text-gray-600"
                  )}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View className={cn(
                    "px-2 py-1 rounded-full",
                    activeTab === tab.key ? "bg-white/20" : "bg-gray-100"
                  )}>
                    <Text className={cn(
                      "text-xs font-semibold",
                      activeTab === tab.key ? "text-white" : "text-gray-600"
                    )}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Approved Employees */}
        {activeTab === 'approved' && (
          <View className="space-y-4">
            {employeesWithData.map((employee, index) => (
              <Animated.View
                key={employee.id}
                entering={FadeInRight.delay(index * 50)}
                className="bg-white rounded-xl p-5 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                      <Text className="text-blue-600 font-semibold">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{employee.name}</Text>
                      <Text className="text-sm text-gray-600">{employee.email}</Text>
                      <Text className="text-sm text-gray-500 capitalize">{employee.department}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-gray-900">{employee.totalPoints}</Text>
                    <Text className="text-sm text-gray-600">points</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <View className="flex-row items-center space-x-4">
                    <View className="flex-row items-center">
                      <Ionicons name="flame" size={16} color="#F59E0B" />
                      <Text className="text-sm text-gray-600 ml-1">{employee.currentStreak} streak</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text className="text-sm text-gray-600 ml-1">{employee.checkIns.length} check-ins</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      console.log('View Details pressed for:', employee.name);
                      Alert.alert('Debug', `Opening details for ${employee.name}`, [
                        { text: 'Cancel' },
                        { text: 'Open', onPress: () => setSelectedEmployee(employee) }
                      ]);
                    }}
                    className="bg-blue-600 px-4 py-2 rounded-full"
                  >
                    <Text className="text-white text-sm font-medium">View Details</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
        
        {/* Pending Users */}
        {activeTab === 'pending' && (
          <View className="space-y-4">
            {pendingUsers.map((user, index) => (
              <Animated.View
                key={user.id}
                entering={FadeInRight.delay(index * 50)}
                className="bg-white rounded-xl p-5 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center mr-4">
                      <Ionicons name="time" size={24} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{user.name}</Text>
                      <Text className="text-sm text-gray-600">{user.email}</Text>
                      <Text className="text-sm text-gray-500 capitalize">{user.department}</Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        Applied {format(parseISO(user.createdAt), 'MMM d, yyyy')}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row space-x-3 mt-4">
                  <Pressable
                    onPress={() => handleRejectUser(user.id)}
                    className="flex-1 bg-red-100 py-3 rounded-full"
                  >
                    <Text className="text-red-600 font-semibold text-center">Reject</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleApproveUser(user.id)}
                    className="flex-1 bg-green-600 py-3 rounded-full"
                  >
                    <Text className="text-white font-semibold text-center">Approve</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ))}
            
            {pendingUsers.length === 0 && (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                <Text className="text-xl font-semibold text-gray-900 mt-4">All Caught Up!</Text>
                <Text className="text-gray-600 text-center mt-2">No pending user approvals</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Analytics */}
        {activeTab === 'analytics' && (
          <View className="space-y-8">
            {/* Attendance Trends */}
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">📊 Attendance Trends</Text>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Today's Check-in Rate</Text>
                  <Text className="font-semibold text-green-600">
                    {Math.round((employeesWithData.filter(emp => 
                      (emp.checkIns || []).some(ci => 
                        format(parseISO(ci.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      )
                    ).length / Math.max(employeesWithData.length, 1)) * 100)}%
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">This Week's Average</Text>
                  <Text className="font-semibold text-blue-600">
                    {Math.round((employeesWithData.reduce((sum, emp) => sum + emp.weeklyPoints, 0) / Math.max(employeesWithData.length, 1)) * 10) / 10} pts/person
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Early Birds This Week</Text>
                  <Text className="font-semibold text-orange-600">
                    {employeesWithData.filter(emp => 
                      (emp.checkIns || []).filter(ci => ci.type === 'early').length >= 3
                    ).length} employees
                  </Text>
                </View>
              </View>
            </View>

            {/* Problem Areas */}
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">⚠️ Areas Needing Attention</Text>
              <View className="space-y-4">
                <View className="flex-row items-start justify-between">
                  <Text className="text-gray-700 flex-1 mr-3">Employees with Low Consistency (&lt;70%)</Text>
                  <Text className="font-semibold text-red-600 text-right">
                    {employeesWithData.filter(emp => {
                      const checkIns = emp.checkIns || [];
                      const totalCheckins = checkIns.length;
                      const goodCheckins = checkIns.filter(ci => ci.type === 'early' || ci.type === 'ontime').length;
                      return totalCheckins > 0 && (goodCheckins / totalCheckins * 100) < 70;
                    }).length} employees
                  </Text>
                </View>
                <View className="flex-row items-start justify-between">
                  <Text className="text-gray-700 flex-1 mr-3">Lost Streaks This Week</Text>
                  <Text className="font-semibold text-yellow-600 text-right">
                    {employeesWithData.filter(emp => emp.longestStreak > emp.currentStreak + 3).length} employees
                  </Text>
                </View>
                <View className="flex-row items-start justify-between">
                  <Text className="text-gray-700 flex-1 mr-3">No Check-ins Last 3 Days</Text>
                  <Text className="font-semibold text-red-600 text-right">
                    {employeesWithData.filter(emp => {
                      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                      return !(emp.checkIns || []).some(ci => parseISO(ci.timestamp) > threeDaysAgo);
                    }).length} employees
                  </Text>
                </View>
              </View>
            </View>

            {/* Performance Insights */}
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">🏆 Team Performance</Text>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Top Performer (Most Points)</Text>
                  <Text className="font-semibold text-green-600">
                    {employeesWithData.length > 0 ? 
                      employeesWithData.reduce((top, emp) => emp.totalPoints > top.totalPoints ? emp : top).name.split(' ')[0]
                      : 'None'
                    }
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Longest Current Streak</Text>
                  <Text className="font-semibold text-orange-600">
                    {Math.max(...employeesWithData.map(emp => emp.currentStreak), 0)} days
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Team Consistency Average</Text>
                  <Text className={cn(
                    "font-semibold",
                    employeesWithData.length > 0 && 
                    (employeesWithData.reduce((sum, emp) => {
                      const checkIns = emp.checkIns || [];
                      const total = checkIns.length;
                      const good = checkIns.filter(ci => ci.type === 'early' || ci.type === 'ontime').length;
                      return sum + (total > 0 ? good / total * 100 : 0);
                    }, 0) / employeesWithData.length) >= 80 ? "text-green-600" : 
                    (employeesWithData.reduce((sum, emp) => {
                      const checkIns = emp.checkIns || [];
                      const total = checkIns.length;
                      const good = checkIns.filter(ci => ci.type === 'early' || ci.type === 'ontime').length;
                      return sum + (total > 0 ? good / total * 100 : 0);
                    }, 0) / employeesWithData.length) >= 60 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {employeesWithData.length > 0 ? 
                      Math.round(employeesWithData.reduce((sum, emp) => {
                        const checkIns = emp.checkIns || [];
                        const total = checkIns.length;
                        const good = checkIns.filter(ci => ci.type === 'early' || ci.type === 'ontime').length;
                        return sum + (total > 0 ? good / total * 100 : 0);
                      }, 0) / employeesWithData.length) + '%'
                      : '0%'
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Weekly Patterns */}
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">📅 Weekly Patterns</Text>
              <View className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                  const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(day) + 1;
                  const dayCheckIns = employeesWithData.flatMap(emp => 
                    (emp.checkIns || []).filter(ci => {
                      const checkInDay = parseISO(ci.timestamp).getDay();
                      return checkInDay === dayIndex;
                    })
                  );
                  const lateCount = dayCheckIns.filter(ci => ci.type === 'late').length;
                  const totalCount = dayCheckIns.length;
                  const latePercentage = totalCount > 0 ? Math.round((lateCount / totalCount) * 100) : 0;
                  
                  return (
                    <View key={day} className="flex-row items-center justify-between">
                      <Text className="text-gray-700">{day} Late Rate</Text>
                      <Text className={cn(
                        "font-semibold",
                        latePercentage <= 10 ? "text-green-600" :
                        latePercentage <= 25 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {latePercentage}% ({lateCount}/{totalCount})
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Reward System Health */}
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">💎 Reward System Health</Text>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Total Points Distributed</Text>
                  <Text className="font-semibold text-blue-600">
                    {employeesWithData.reduce((sum, emp) => sum + emp.totalPoints, 0).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Pending Reward Approvals</Text>
                  <Text className="font-semibold text-orange-600">
                    {employeesWithData.reduce((sum, emp) => 
                      sum + (emp.rewardsRedeemed || []).filter(r => r.status === 'pending').length, 0
                    )}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Points Spent on Rewards</Text>
                  <Text className="font-semibold text-green-600">
                    {employeesWithData.reduce((sum, emp) => 
                      sum + (emp.rewardsRedeemed || []).reduce((rewardSum, r) => rewardSum + r.pointsCost, 0), 0
                    ).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Bonus Points Awarded</Text>
                  <Text className="font-semibold text-purple-600">
                    {employeesWithData.reduce((sum, emp) => 
                      sum + (emp.bonusPoints || []).reduce((bonusSum, b) => bonusSum + b.pointsAwarded, 0), 0
                    ).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Employees with Bonuses</Text>
                  <Text className="font-semibold text-purple-600">
                    {employeesWithData.filter(emp => (emp.bonusPoints || []).length > 0).length} employees
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Bottom padding */}
        <View className="h-32" />
      </ScrollView>
      
      {/* Employee Detail Modal */}
      <Modal 
        visible={!!selectedEmployee && !showRewardModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEmployee(null)}
      >
        {selectedEmployee && (
          <View className="flex-1 bg-white">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-900">Employee Details</Text>
                <Pressable 
                  onPress={() => {
                    setSelectedEmployee(null);
                    setShowRewardModal(false); // Close reward modal if open
                    setRewardPoints('');
                    setRewardReason('');
                  }} 
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            <ScrollView 
              className="flex-1 p-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                const analysis = analyzeEmployeeData(selectedEmployee);
                return (
                  <>
                    {/* Employee Header */}
                    <View className="items-center mb-6">
                      <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <Text className="text-blue-600 font-bold text-2xl">
                          {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <Text className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</Text>
                      <Text className="text-gray-600 mt-1">{selectedEmployee.email}</Text>
                      <Text className="text-gray-500 capitalize">{selectedEmployee.department}</Text>
                    </View>
                    
                    {/* Quick Stats */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-6">
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-gray-700">Total Points</Text>
                        <Text className="font-bold text-2xl text-blue-600">{selectedEmployee.totalPoints}</Text>
                      </View>
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-gray-700">Current Streak</Text>
                        <Text className="font-semibold text-orange-600">{selectedEmployee.currentStreak} days</Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-gray-700">Total Check-ins</Text>
                        <Text className="font-semibold text-green-600">{(selectedEmployee.checkIns || []).length}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-700">Consistency Score</Text>
                        <Text className={cn(
                          "font-semibold",
                          analysis.consistencyScore >= 80 ? "text-green-600" :
                          analysis.consistencyScore >= 60 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {analysis.consistencyScore}%
                        </Text>
                      </View>
                    </View>

                    {/* Attendance Breakdown */}
                    <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4">Attendance Breakdown</Text>
                      <View className="space-y-3">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <View className="w-4 h-4 bg-green-500 rounded-full mr-3" />
                            <Text className="text-gray-700">Early Arrivals</Text>
                          </View>
                          <Text className="font-semibold text-gray-900">{analysis.earlyDays}</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <View className="w-4 h-4 bg-blue-500 rounded-full mr-3" />
                            <Text className="text-gray-700">On Time</Text>
                          </View>
                          <Text className="font-semibold text-gray-900">{analysis.onTimeDays}</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <View className="w-4 h-4 bg-red-500 rounded-full mr-3" />
                            <Text className="text-gray-700">Late Arrivals</Text>
                          </View>
                          <Text className="font-semibold text-gray-900">{analysis.lateDays}</Text>
                        </View>
                        {analysis.averageCheckInTime && (
                          <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <Text className="text-gray-700">Average Check-in Time</Text>
                            <Text className="font-semibold text-gray-900">{analysis.averageCheckInTime}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Weekly Patterns */}
                    <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4">Weekly Patterns</Text>
                      <View className="space-y-3">
                        {Object.entries(analysis.weeklyPatterns).map(([day, pattern]) => {
                          const total = pattern.early + pattern.ontime + pattern.late;
                          if (total === 0) return null;
                          
                          return (
                            <View key={day} className="space-y-2">
                              <View className="flex-row justify-between items-center">
                                <Text className="font-medium text-gray-900">{day}</Text>
                                <Text className="text-sm text-gray-600">{total} check-ins</Text>
                              </View>
                              <View className="flex-row h-2 bg-gray-200 rounded-full overflow-hidden">
                                {pattern.early > 0 && (
                                  <View 
                                    className="bg-green-500"
                                    style={{ flex: pattern.early }}
                                  />
                                )}
                                {pattern.ontime > 0 && (
                                  <View 
                                    className="bg-blue-500"
                                    style={{ flex: pattern.ontime }}
                                  />
                                )}
                                {pattern.late > 0 && (
                                  <View 
                                    className="bg-red-500"
                                    style={{ flex: pattern.late }}
                                  />
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* AI Insights */}
                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="analytics" size={20} color="#3B82F6" />
                        <Text className="text-lg font-semibold text-blue-900 ml-2">Employee Insights</Text>
                      </View>
                      <View className="space-y-2">
                        {analysis.insights.map((insight, index) => (
                          <View key={index} className="flex-row items-start">
                            <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                            <Text className="text-blue-800 flex-1">{insight}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Bonus Points History */}
                    {selectedEmployee.bonusPoints && selectedEmployee.bonusPoints.length > 0 && (
                      <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
                        <Text className="text-lg font-semibold text-gray-900 mb-4">Bonus Points History</Text>
                        <View className="space-y-3">
                          {selectedEmployee.bonusPoints.slice(-5).reverse().map((bonus, index) => (
                            <View key={bonus.id} className="flex-row items-start justify-between p-3 bg-blue-50 rounded-lg">
                              <View className="flex-1 mr-3">
                                <Text className="text-gray-900 font-medium">
                                  {format(parseISO(bonus.timestamp), 'MMM d, yyyy • h:mm a')}
                                </Text>
                                <Text className="text-sm text-gray-600 mt-1">
                                  {bonus.reason}
                                </Text>
                                <Text className="text-xs text-gray-500 mt-1">
                                  Awarded by {bonus.awardedBy}
                                </Text>
                              </View>
                              <Text className="text-lg font-bold text-blue-600">
                                +{bonus.pointsAwarded}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Action Buttons */}
                    <View className="space-y-3 mb-8" style={{ zIndex: 10 }}>
                      <Pressable
                        onPress={() => setShowRewardModal(true)}
                        className="bg-blue-600 py-4 rounded-xl"
                        style={{ 
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          elevation: 5,
                        }}
                      >
                        <Text className="text-white text-center font-semibold text-lg">Award Bonus Points</Text>
                      </Pressable>
                      
                      {analysis.consistencyScore < 70 && (
                        <Pressable
                          onPress={() => Alert.alert('Improvement Plan', 'Consider scheduling a one-on-one meeting to discuss attendance patterns and provide support.')}
                          className="bg-yellow-600 py-4 rounded-xl"
                        >
                          <Text className="text-white text-center font-semibold text-lg">Create Improvement Plan</Text>
                        </Pressable>
                      )}
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </View>
        )}
      </Modal>
      
      {/* Reward Modal - Moved outside and given higher priority */}
      <Modal 
        visible={showRewardModal} 
        transparent 
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6" style={{ zIndex: 9999 }}>
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Award Bonus Points</Text>
              <Pressable
                onPress={() => setShowRewardModal(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 font-medium mb-2">Points to Award</Text>
                <TextInput
                  value={rewardPoints}
                  onChangeText={setRewardPoints}
                  placeholder="Enter points (e.g., 10)"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View>
                <Text className="text-gray-700 font-medium mb-2">Reason</Text>
                <TextInput
                  value={rewardReason}
                  onChangeText={setRewardReason}
                  placeholder="e.g., Exceptional performance this week"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
              </View>
              
              {selectedEmployee && (
                <View className="bg-blue-50 p-3 rounded-xl">
                  <Text className="text-blue-800 font-medium">Awarding to: {selectedEmployee.name}</Text>
                  <Text className="text-blue-600 text-sm">Current Points: {selectedEmployee.totalPoints}</Text>
                </View>
              )}
            </View>
            
            <View className="flex-row space-x-3 mt-6">
              <Pressable
                onPress={() => setShowRewardModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-full"
              >
                <Text className="text-gray-800 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleGiveReward}
                className="flex-1 bg-blue-600 py-3 rounded-full"
              >
                <Text className="text-white text-center font-semibold">Award Points</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
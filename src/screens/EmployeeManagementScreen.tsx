import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, TextInput, StyleSheet } from 'react-native';
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
  const { employees, getEmployeeStats, awardBonusPoints, initializeEmployee } = useEmployeeStore();
  
  const approvedUsers = getAllUsers();
  const pendingUsers = getPendingUsers();
  
  // Ensure all approved users have employee records
  useEffect(() => {
    approvedUsers.forEach(user => {
      const existingEmployee = employees.find(emp => emp.email === user.email);
      if (!existingEmployee) {
        // Initialize employee record for approved user without employee data
        initializeEmployee(user.name, user.email);
      }
    });
  }, [approvedUsers.length, employees, initializeEmployee]);
  
  // Merge auth users with employee data
  const employeesWithData = approvedUsers.map(user => {
    const employeeData = employees.find(emp => emp.email === user.email);
    return {
      ...user,
      ...employeeData,
      totalPoints: employeeData?.totalPoints || 0,
      currentStreak: employeeData?.currentStreak || 0,
      checkIns: employeeData?.checkIns || [],
      bonusPoints: employeeData?.bonusPoints || [],
      badges: employeeData?.badges || [],
      rewardsRedeemed: employeeData?.rewardsRedeemed || [],
    };
  });
  
  if (currentUser?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Ionicons name="shield" size={64} color="#EF4444" />
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
            const user = pendingUsers.find(u => u.id === userId);
            const success = approveUser(userId, currentUser.id);
            if (success && user) {
              // Initialize the employee in the employee store
              initializeEmployee(user.name, user.email);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.heading}>Employee Management</Text>
            <View style={styles.tabContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabButtons}>
                  {tabs.map((tab) => (
                    <Pressable
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key as TabType)}
                      style={[
                        styles.tabButton,
                        activeTab === tab.key && styles.activeTabButton,
                      ]}
                    >
                      <Ionicons 
                        name={tab.icon as any} 
                        size={18} 
                        color={activeTab === tab.key ? 'white' : '#6B7280'} 
                      />
                      <Text
                        style={[
                          styles.tabButtonText,
                          activeTab === tab.key && styles.activeTabButtonText,
                        ]}
                      >
                        {tab.label}
                      </Text>
                      {tab.count > 0 && (
                        <View style={[
                          styles.tabCountBadge,
                          activeTab === tab.key && styles.activeTabCountBadge,
                        ]}>
                          <Text style={[
                            styles.tabCountText,
                            activeTab === tab.key && styles.activeTabCountText,
                          ]}>
                            {tab.count}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            {/* Approved Employees */}
            {activeTab === 'approved' && (
              <View style={styles.sectionContainer}>
                {employeesWithData.map((employee, index) => (
                  <Animated.View
                    key={employee.id}
                    entering={FadeInRight.delay(index * 50)}
                    style={styles.employeeCard}
                  >
                    <View style={styles.employeeHeader}>
                      <View style={styles.employeeAvatar}>
                        <Text style={styles.employeeAvatarText}>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{employee.name}</Text>
                        <Text style={styles.employeeEmail}>{employee.email}</Text>
                        <Text style={styles.employeeDepartment}>{employee.department}</Text>
                      </View>
                      <View style={styles.employeePoints}>
                        <Text style={styles.employeeTotalPoints}>{employee.totalPoints}</Text>
                        <Text style={styles.employeePointsLabel}>points</Text>
                      </View>
                    </View>
                    
                    <View style={styles.employeeDetails}>
                      <View style={styles.employeeStats}>
                        <View style={styles.employeeStatItem}>
                          <Ionicons name="flame" size={16} color="#F59E0B" />
                          <Text style={styles.employeeStatLabel}>{employee.currentStreak} streak</Text>
                        </View>
                        <View style={styles.employeeStatItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text style={styles.employeeStatLabel}>{(employee.checkIns || []).length} check-ins</Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => setSelectedEmployee(employee)}
                        style={styles.viewDetailsButton}
                      >
                        <Text style={styles.viewDetailsButtonText}>View Details</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
            
            {/* Pending Users */}
            {activeTab === 'pending' && (
              <View style={styles.sectionContainer}>
                {pendingUsers.map((user, index) => (
                  <Animated.View
                    key={user.id}
                    entering={FadeInRight.delay(index * 50)}
                    style={styles.employeeCard}
                  >
                    <View style={styles.employeeHeader}>
                      <View style={styles.employeeAvatar}>
                        <Ionicons name="time" size={24} color="#F59E0B" />
                      </View>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{user.name}</Text>
                        <Text style={styles.employeeEmail}>{user.email}</Text>
                        <Text style={styles.employeeDepartment}>{user.department}</Text>
                        <Text style={styles.employeeAppliedDate}>
                          Applied {format(parseISO(user.createdAt), 'MMM d, yyyy')}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.employeeActions}>
                      <Pressable
                        onPress={() => handleRejectUser(user.id)}
                        style={styles.rejectButton}
                      >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleApproveUser(user.id)}
                        style={styles.approveButton}
                      >
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ))}
                
                {pendingUsers.length === 0 && (
                  <View style={styles.noPendingUsersContainer}>
                    <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                    <Text style={styles.noPendingUsersTitle}>All Caught Up!</Text>
                    <Text style={styles.noPendingUsersSubtitle}>No pending user approvals</Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Analytics */}
            {activeTab === 'analytics' && (
              <View style={styles.sectionContainer}>
                {/* Attendance Trends */}
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsHeading}>📊 Attendance Trends</Text>
                  <View style={styles.analyticsStats}>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Today's Check-in Rate</Text>
                      <Text style={styles.analyticsStatValue}>
                        {Math.round((employeesWithData.filter(emp => 
                          (emp.checkIns || []).some(ci => 
                            format(parseISO(ci.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          )
                        ).length / Math.max(employeesWithData.length, 1)) * 100)}%
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>This Week's Average</Text>
                      <Text style={styles.analyticsStatValue}>
                        {Math.round((employeesWithData.reduce((sum, emp) => sum + emp.weeklyPoints, 0) / Math.max(employeesWithData.length, 1)) * 10) / 10} pts/person
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Early Birds This Week</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.filter(emp => 
                          (emp.checkIns || []).filter(ci => ci.type === 'early').length >= 3
                        ).length} employees
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Problem Areas */}
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsHeading}>⚠️ Areas Needing Attention</Text>
                  <View style={styles.analyticsStats}>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Employees with Low Consistency (&lt;70%)</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.filter(emp => {
                          const checkIns = emp.checkIns || [];
                          const totalCheckins = checkIns.length;
                          const goodCheckins = checkIns.filter(ci => ci.type === 'early' || ci.type === 'ontime').length;
                          return totalCheckins > 0 && (goodCheckins / totalCheckins * 100) < 70;
                        }).length} employees
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Lost Streaks This Week</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.filter(emp => emp.longestStreak > emp.currentStreak + 3).length} employees
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>No Check-ins Last 3 Days</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.filter(emp => {
                          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                          return !(emp.checkIns || []).some(ci => parseISO(ci.timestamp) > threeDaysAgo);
                        }).length} employees
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Performance Insights */}
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsHeading}>🏆 Team Performance</Text>
                  <View style={styles.analyticsStats}>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Top Performer (Most Points)</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.length > 0 ? 
                          employeesWithData.reduce((top, emp) => emp.totalPoints > top.totalPoints ? emp : top).name.split(' ')[0]
                          : 'None'
                        }
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Longest Current Streak</Text>
                      <Text style={styles.analyticsStatValue}>
                        {Math.max(...employeesWithData.map(emp => emp.currentStreak), 0)} days
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Team Consistency Average</Text>
                      <Text style={[
                        styles.analyticsStatValue,
                        employeesWithData.length > 0 && 
                        (employeesWithData.reduce((sum, emp) => {
                          const checkIns = emp.checkIns || [];
                          const total = checkIns.length;
                          const good = checkIns.filter(ci => ci.type === 'early' || ci.type === 'ontime').length;
                          return sum + (total > 0 ? good / total * 100 : 0);
                        }, 0) / employeesWithData.length) >= 80 ? styles.highPerformance : 
                        (employeesWithData.reduce((sum, emp) => {
                          const checkIns = emp.checkIns || [];
                          const total = checkIns.length;
                          const good = checkIns.filter(ci => ci.type === 'early' || ci.type === 'ontime').length;
                          return sum + (total > 0 ? good / total * 100 : 0);
                        }, 0) / employeesWithData.length) >= 60 ? styles.mediumPerformance : styles.lowPerformance
                      ]}>
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
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsHeading}>📅 Weekly Patterns</Text>
                  <View style={styles.weeklyPatternsContainer}>
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
                        <View key={day} style={styles.weeklyPatternItem}>
                          <Text style={styles.weeklyPatternLabel}>{day} Late Rate</Text>
                          <Text style={[
                            styles.weeklyPatternValue,
                            latePercentage <= 10 ? styles.lowPerformance :
                            latePercentage <= 25 ? styles.mediumPerformance : styles.highPerformance
                          ]}>
                            {latePercentage}% ({lateCount}/{totalCount})
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Reward System Health */}
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsHeading}>💎 Reward System Health</Text>
                  <View style={styles.analyticsStats}>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Total Points Distributed</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.reduce((sum, emp) => sum + emp.totalPoints, 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Pending Reward Approvals</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.reduce((sum, emp) => 
                          sum + (emp.rewardsRedeemed || []).filter(r => r.status === 'pending').length, 0
                        )}
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Points Spent on Rewards</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.reduce((sum, emp) => 
                          sum + (emp.rewardsRedeemed || []).reduce((rewardSum, r) => rewardSum + r.pointsCost, 0), 0
                        ).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Bonus Points Awarded</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.reduce((sum, emp) => 
                          sum + (emp.bonusPoints || []).reduce((bonusSum, b) => bonusSum + b.pointsAwarded, 0), 0
                        ).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <Text style={styles.analyticsStatLabel}>Employees with Bonuses</Text>
                      <Text style={styles.analyticsStatValue}>
                        {employeesWithData.filter(emp => (emp.bonusPoints || []).length > 0).length} employees
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            
            {/* Bottom padding */}
            <View style={styles.bottomPadding} />
          </View>
        </View>
      </ScrollView>
      
      {/* Employee Detail Modal */}
      <Modal 
        visible={!!selectedEmployee && !showRewardModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEmployee(null)}
      >
        {selectedEmployee && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Employee Details</Text>
                <Pressable 
                  onPress={() => {
                    setSelectedEmployee(null);
                    setShowRewardModal(false); // Close reward modal if open
                    setRewardPoints('');
                    setRewardReason('');
                  }} 
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            <ScrollView 
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                const analysis = analyzeEmployeeData(selectedEmployee);
                return (
                  <>
                    {/* Employee Header */}
                    <View style={styles.employeeHeaderModal}>
                      <View style={styles.employeeAvatarModal}>
                        <Text style={styles.employeeAvatarTextModal}>
                          {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <Text style={styles.employeeNameModal}>{selectedEmployee.name}</Text>
                      <Text style={styles.employeeEmailModal}>{selectedEmployee.email}</Text>
                      <Text style={styles.employeeDepartmentModal}>{selectedEmployee.department}</Text>
                    </View>
                    
                    {/* Quick Stats */}
                    <View style={styles.quickStatsCard}>
                      <View style={styles.quickStatsRow}>
                        <Text style={styles.quickStatsLabel}>Total Points</Text>
                        <Text style={styles.quickStatsValue}>{selectedEmployee.totalPoints}</Text>
                      </View>
                      <View style={styles.quickStatsRow}>
                        <Text style={styles.quickStatsLabel}>Current Streak</Text>
                        <Text style={styles.quickStatsValue}>{selectedEmployee.currentStreak} days</Text>
                      </View>
                      <View style={styles.quickStatsRow}>
                        <Text style={styles.quickStatsLabel}>Total Check-ins</Text>
                        <Text style={styles.quickStatsValue}>{(selectedEmployee.checkIns || []).length}</Text>
                      </View>
                      <View style={styles.quickStatsRow}>
                        <Text style={styles.quickStatsLabel}>Consistency Score</Text>
                        <Text style={[
                          styles.quickStatsValue,
                          analysis.consistencyScore >= 80 ? styles.highPerformance :
                          analysis.consistencyScore >= 60 ? styles.mediumPerformance : styles.lowPerformance
                        ]}>
                          {analysis.consistencyScore}%
                        </Text>
                      </View>
                    </View>

                    {/* Attendance Breakdown */}
                    <View style={styles.attendanceBreakdownCard}>
                      <Text style={styles.attendanceBreakdownTitle}>Attendance Breakdown</Text>
                      <View style={styles.attendanceBreakdownStats}>
                        <View style={styles.attendanceBreakdownStatItem}>
                          <View style={styles.attendanceBreakdownStatIcon} />
                          <Text style={styles.attendanceBreakdownStatLabel}>Early Arrivals</Text>
                          <Text style={styles.attendanceBreakdownStatValue}>{analysis.earlyDays}</Text>
                        </View>
                        <View style={styles.attendanceBreakdownStatItem}>
                          <View style={styles.attendanceBreakdownStatIcon} />
                          <Text style={styles.attendanceBreakdownStatLabel}>On Time</Text>
                          <Text style={styles.attendanceBreakdownStatValue}>{analysis.onTimeDays}</Text>
                        </View>
                        <View style={styles.attendanceBreakdownStatItem}>
                          <View style={styles.attendanceBreakdownStatIcon} />
                          <Text style={styles.attendanceBreakdownStatLabel}>Late Arrivals</Text>
                          <Text style={styles.attendanceBreakdownStatValue}>{analysis.lateDays}</Text>
                        </View>
                        {analysis.averageCheckInTime && (
                          <View style={styles.quickStatsRow}>
                            <Text style={styles.quickStatsLabel}>Average Check-in Time</Text>
                            <Text style={styles.quickStatsValue}>{analysis.averageCheckInTime}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Weekly Patterns */}
                    <View style={styles.weeklyPatternsCard}>
                      <Text style={styles.weeklyPatternsTitle}>Weekly Patterns</Text>
                      <View style={styles.weeklyPatternsStats}>
                        {Object.entries(analysis.weeklyPatterns).map(([day, pattern]) => {
                          const total = pattern.early + pattern.ontime + pattern.late;
                          if (total === 0) return null;
                          
                          return (
                            <View key={day} style={styles.weeklyPatternItem}>
                              <View style={styles.weeklyPatternHeader}>
                                <Text style={styles.weeklyPatternDay}>{day}</Text>
                                <Text style={styles.weeklyPatternTotal}>{total} check-ins</Text>
                              </View>
                              <View style={styles.weeklyPatternBar}>
                                {pattern.early > 0 && (
                                  <View 
                                    style={[styles.weeklyPatternBarSegment, { backgroundColor: '#10B981' }]}
                                  />
                                )}
                                {pattern.ontime > 0 && (
                                  <View 
                                    style={[styles.weeklyPatternBarSegment, { backgroundColor: '#3B82F6' }]}
                                  />
                                )}
                                {pattern.late > 0 && (
                                  <View 
                                    style={[styles.weeklyPatternBarSegment, { backgroundColor: '#EF4444' }]}
                                  />
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* AI Insights */}
                    <View style={styles.aiInsightsCard}>
                      <View style={styles.aiInsightsHeader}>
                        <Ionicons name="analytics" size={20} color="#3B82F6" />
                        <Text style={styles.aiInsightsTitle}>Employee Insights</Text>
                      </View>
                      <View style={styles.aiInsightsList}>
                        {analysis.insights.map((insight, index) => (
                          <View key={index} style={styles.aiInsightsItem}>
                            <View style={styles.aiInsightsBullet} />
                            <Text style={styles.aiInsightsInsight}>{insight}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Bonus Points History */}
                    {selectedEmployee.bonusPoints && selectedEmployee.bonusPoints.length > 0 && (
                      <View style={styles.bonusPointsHistoryCard}>
                        <Text style={styles.bonusPointsHistoryTitle}>Bonus Points History</Text>
                        <View style={styles.bonusPointsHistoryList}>
                          {selectedEmployee.bonusPoints.slice(-5).reverse().map((bonus, index) => (
                            <View key={bonus.id} style={styles.bonusPointsHistoryItem}>
                              <View style={styles.bonusPointsHistoryContent}>
                                <Text style={styles.bonusPointsHistoryDate}>
                                  {format(parseISO(bonus.timestamp), 'MMM d, yyyy • h:mm a')}
                                </Text>
                                <Text style={styles.bonusPointsHistoryReason}>
                                  {bonus.reason}
                                </Text>
                                <Text style={styles.bonusPointsHistoryAwardedBy}>
                                  Awarded by {bonus.awardedBy}
                                </Text>
                              </View>
                              <Text style={styles.bonusPointsHistoryPoints}>
                                +{bonus.pointsAwarded}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                      <Pressable
                        onPress={() => setShowRewardModal(true)}
                        style={styles.awardBonusButton}
                      >
                        <Text style={styles.awardBonusButtonText}>Award Bonus Points</Text>
                      </Pressable>
                      
                      {analysis.consistencyScore < 70 && (
                        <Pressable
                          onPress={() => Alert.alert('Improvement Plan', 'Consider scheduling a one-on-one meeting to discuss attendance patterns and provide support.')}
                          style={styles.createImprovementPlanButton}
                        >
                          <Text style={styles.createImprovementPlanButtonText}>Create Improvement Plan</Text>
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
        <View style={styles.rewardModalOverlay}>
          <View style={styles.rewardModalContent}>
            <View style={styles.rewardModalHeader}>
              <Text style={styles.rewardModalTitle}>Award Bonus Points</Text>
              <Pressable
                onPress={() => setShowRewardModal(false)}
                style={styles.rewardModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            
            <View style={styles.rewardModalForm}>
              <View style={styles.rewardModalField}>
                <Text style={styles.rewardModalLabel}>Points to Award</Text>
                <TextInput
                  value={rewardPoints}
                  onChangeText={setRewardPoints}
                  placeholder="Enter points (e.g., 10)"
                  keyboardType="numeric"
                  style={styles.rewardModalInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.rewardModalField}>
                <Text style={styles.rewardModalLabel}>Reason</Text>
                <TextInput
                  value={rewardReason}
                  onChangeText={setRewardReason}
                  placeholder="e.g., Exceptional performance this week"
                  multiline
                  numberOfLines={3}
                  style={styles.rewardModalInput}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
              </View>
              
              {selectedEmployee && (
                <View style={styles.rewardModalAwardingInfo}>
                  <Text style={styles.rewardModalAwardingInfoTitle}>Awarding to: {selectedEmployee.name}</Text>
                  <Text style={styles.rewardModalAwardingInfoPoints}>Current Points: {selectedEmployee.totalPoints}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.rewardModalActions}>
              <Pressable
                onPress={() => setShowRewardModal(false)}
                style={styles.rewardModalCancelButton}
              >
                <Text style={styles.rewardModalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleGiveReward}
                style={styles.rewardModalAwardButton}
              >
                <Text style={styles.rewardModalAwardButtonText}>Award Points</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { width: '100%', maxWidth: 800, alignItems: 'center' },
  glassCard: { width: '100%', padding: 32, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: '#b87333', shadowColor: '#b87333', shadowOpacity: 0.25, shadowRadius: 8, marginBottom: 24 },
  heading: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#b87333', fontFamily: 'UnifrakturCook' },
  tabContainer: { marginBottom: 24 },
  tabButtons: { flexDirection: 'row', paddingHorizontal: 10 },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  activeTabButton: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  activeTabButtonText: {
    color: 'white',
  },
  tabCountBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeTabCountBadge: {
    backgroundColor: 'white',
  },
  tabCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  activeTabCountText: {
    color: '#4f46e5',
  },
  sectionContainer: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  employeeCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  employeeAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  employeeInfo: {
    flex: 1,
    marginRight: 10,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  employeeEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  employeeDepartment: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 2,
  },
  employeePoints: {
    alignItems: 'flex-end',
  },
  employeeTotalPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  employeePointsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  employeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  employeeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  employeeStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  viewDetailsButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noPendingUsersContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPendingUsersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 15,
  },
  noPendingUsersSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  analyticsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  analyticsStats: {
    flexDirection: 'column',
  },
  analyticsStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  analyticsStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  analyticsStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  highPerformance: {
    color: '#10B981',
  },
  mediumPerformance: {
    color: '#F59E0B',
  },
  lowPerformance: {
    color: '#EF4444',
  },
  weeklyPatternsContainer: {
    flexDirection: 'column',
  },
  weeklyPatternItem: {
    marginBottom: 10,
  },
  weeklyPatternLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  weeklyPatternValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 10,
  },
  employeeHeaderModal: {
    alignItems: 'center',
    marginBottom: 15,
  },
  employeeAvatarModal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  employeeAvatarTextModal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  employeeNameModal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  employeeEmailModal: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 2,
  },
  employeeDepartmentModal: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 2,
  },
  quickStatsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickStatsLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickStatsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  attendanceBreakdownCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendanceBreakdownTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  attendanceBreakdownStats: {
    flexDirection: 'column',
  },
  attendanceBreakdownStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  attendanceBreakdownStatIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  attendanceBreakdownStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  attendanceBreakdownStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  weeklyPatternsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyPatternsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  weeklyPatternsStats: {
    flexDirection: 'column',
  },
  weeklyPatternItem: {
    marginBottom: 10,
  },
  weeklyPatternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  weeklyPatternDay: {
    fontSize: 14,
    color: '#6b7280',
  },
  weeklyPatternTotal: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  weeklyPatternBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  weeklyPatternBarSegment: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  aiInsightsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiInsightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 10,
  },
  aiInsightsList: {
    flexDirection: 'column',
  },
  aiInsightsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  aiInsightsBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    marginTop: 5,
    marginRight: 10,
  },
  aiInsightsInsight: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  bonusPointsHistoryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bonusPointsHistoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  bonusPointsHistoryList: {
    flexDirection: 'column',
  },
  bonusPointsHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    marginBottom: 10,
  },
  bonusPointsHistoryContent: {
    flex: 1,
  },
  bonusPointsHistoryDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  bonusPointsHistoryReason: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 2,
  },
  bonusPointsHistoryAwardedBy: {
    fontSize: 12,
    color: '#6b7280',
  },
  bonusPointsHistoryPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    marginTop: 20,
  },
  awardBonusButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 5,
  },
  awardBonusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createImprovementPlanButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 5,
    marginTop: 10,
  },
  createImprovementPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rewardModalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 10,
  },
  rewardModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  rewardModalCloseButton: {
    padding: 5,
  },
  rewardModalForm: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  rewardModalField: {
    marginBottom: 15,
  },
  rewardModalLabel: {
    fontSize: 14,
    fontWeight: 'medium',
    color: '#6b7280',
    marginBottom: 8,
  },
  rewardModalInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rewardModalAwardingInfo: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  rewardModalAwardingInfoTitle: {
    fontSize: 15,
    fontWeight: 'medium',
    color: '#3b82f6',
    marginBottom: 5,
  },
  rewardModalAwardingInfoPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  rewardModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardModalCancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  rewardModalCancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardModalAwardButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  rewardModalAwardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
  employeeAppliedDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  employeeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  approveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
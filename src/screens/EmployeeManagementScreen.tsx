import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
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
  const { employees, getEmployeeStats } = useEmployeeStore();
  
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
    
    // In a real app, this would update the employee's points
    Alert.alert('Success', `Awarded ${points} points to ${selectedEmployee?.name}`);
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
                    onPress={() => setSelectedEmployee(employee)}
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
          <View className="space-y-6">
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</Text>
              <View className="space-y-3">
                {Object.entries(
                  employeesWithData.reduce((acc, emp) => {
                    const dept = emp.department || 'Unspecified';
                    acc[dept] = (acc[dept] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([dept, count]) => (
                  <View key={dept} className="flex-row items-center justify-between">
                    <Text className="text-gray-700">{dept}</Text>
                    <Text className="font-semibold text-gray-900">{count}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</Text>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Average Points per Employee</Text>
                  <Text className="font-semibold text-gray-900">
                    {Math.round(employeesWithData.reduce((sum, emp) => sum + emp.totalPoints, 0) / employeesWithData.length) || 0}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Highest Streak</Text>
                  <Text className="font-semibold text-gray-900">
                    {Math.max(...employeesWithData.map(emp => emp.currentStreak), 0)} days
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Total Check-ins</Text>
                  <Text className="font-semibold text-gray-900">
                    {employeesWithData.reduce((sum, emp) => sum + emp.checkIns.length, 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>
      
      {/* Employee Detail Modal */}
      <Modal visible={!!selectedEmployee} animationType="slide" presentationStyle="pageSheet">
        {selectedEmployee && (
          <View className="flex-1 bg-white">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-900">Employee Details</Text>
                <Pressable onPress={() => setSelectedEmployee(null)} className="p-2">
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            <ScrollView className="flex-1 p-6">
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
              
              <View className="bg-gray-50 rounded-xl p-4 mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-700">Total Points</Text>
                  <Text className="font-bold text-2xl text-blue-600">{selectedEmployee.totalPoints}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-700">Current Streak</Text>
                  <Text className="font-semibold text-orange-600">{selectedEmployee.currentStreak} days</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700">Total Check-ins</Text>
                  <Text className="font-semibold text-green-600">{selectedEmployee.checkIns.length}</Text>
                </View>
              </View>
              
              <Pressable
                onPress={() => setShowRewardModal(true)}
                className="bg-blue-600 py-4 rounded-xl mb-4"
              >
                <Text className="text-white text-center font-semibold text-lg">Award Bonus Points</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
      
      {/* Reward Modal */}
      <Modal visible={showRewardModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-4">Award Bonus Points</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 font-medium mb-2">Points to Award</Text>
                <TextInput
                  value={rewardPoints}
                  onChangeText={setRewardPoints}
                  placeholder="Enter points"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                />
              </View>
              
              <View>
                <Text className="text-gray-700 font-medium mb-2">Reason</Text>
                <TextInput
                  value={rewardReason}
                  onChangeText={setRewardReason}
                  placeholder="e.g., Exceptional performance"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                />
              </View>
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
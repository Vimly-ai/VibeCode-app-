import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../state/authStore';
import { useEmployeeStore } from '../state/employeeStore';
import { cn } from '../utils/cn';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const RewardApprovalScreen: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const { currentUser } = useAuthStore();
  const { employees, approveRewardRedemption, rejectRewardRedemption } = useEmployeeStore();
  
  // Get all reward redemptions across all employees
  const allRedemptions = employees.flatMap(emp => 
    (emp.rewardsRedeemed || []).map(reward => ({
      ...reward,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeEmail: emp.email,
      employeeDepartment: emp.department || 'Unspecified'
    }))
  );
  
  // Filter redemptions by status
  const filteredRedemptions = statusFilter === 'all' 
    ? allRedemptions 
    : allRedemptions.filter(r => r.status === statusFilter);
  
  // Sort by date (most recent first)
  const sortedRedemptions = filteredRedemptions.sort((a, b) => 
    new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );
  
  const handleApproveReward = (redemptionId: string) => {
    Alert.alert(
      'Approve Reward',
      'Are you sure you want to approve this reward redemption?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            const success = approveRewardRedemption(redemptionId);
            if (success) {
              Alert.alert('Success', 'Reward approved successfully!');
              setSelectedReward(null);
            } else {
              Alert.alert('Error', 'Failed to approve reward');
            }
          }
        }
      ]
    );
  };
  
  const handleRejectReward = (redemptionId: string) => {
    Alert.alert(
      'Reject Reward',
      'Are you sure you want to reject this reward redemption? The points will be refunded to the employee.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            const success = rejectRewardRedemption(redemptionId);
            if (success) {
              Alert.alert('Success', 'Reward rejected and points refunded.');
              setSelectedReward(null);
            } else {
              Alert.alert('Error', 'Failed to reject reward');
            }
          }
        }
      ]
    );
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time';
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };
  
  const statusOptions = [
    { key: 'pending', label: 'Pending', count: allRedemptions.filter(r => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: allRedemptions.filter(r => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: allRedemptions.filter(r => r.status === 'rejected').length },
    { key: 'all', label: 'All', count: allRedemptions.length },
  ];
  
  if (currentUser?.role !== 'admin') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Ionicons name="shield-off" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-900 mt-4">Access Denied</Text>
        <Text className="text-gray-600 mt-2">Admin access required</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-2xl font-bold text-gray-900">Reward Approvals</Text>
        <Text className="text-gray-600 mt-1">Review and approve employee reward redemptions</Text>
      </View>
      
      {/* Status Filter */}
      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {statusOptions.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => setStatusFilter(option.key as StatusFilter)}
                className={cn(
                  "px-4 py-2 rounded-full flex-row items-center space-x-2",
                  statusFilter === option.key
                    ? "bg-blue-600"
                    : "bg-white border border-gray-200"
                )}
              >
                <Text
                  className={cn(
                    "font-medium",
                    statusFilter === option.key
                      ? "text-white"
                      : "text-gray-600"
                  )}
                >
                  {option.label}
                </Text>
                <View className={cn(
                  "px-2 py-1 rounded-full",
                  statusFilter === option.key ? "bg-white/20" : "bg-gray-100"
                )}>
                  <Text className={cn(
                    "text-xs font-semibold",
                    statusFilter === option.key ? "text-white" : "text-gray-600"
                  )}>
                    {option.count}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Quick Stats */}
      <View className="px-6 mb-6">
        <View className="flex-row space-x-4">
          <View className="flex-1 bg-white p-4 rounded-xl shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">Pending</Text>
                <Text className="text-2xl font-bold text-orange-600">
                  {allRedemptions.filter(r => r.status === 'pending').length}
                </Text>
              </View>
              <Ionicons name="time" size={24} color="#F59E0B" />
            </View>
          </View>
          
          <View className="flex-1 bg-white p-4 rounded-xl shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">Total Value</Text>
                <Text className="text-2xl font-bold text-blue-600">
                  {allRedemptions.reduce((sum, r) => sum + r.pointsCost, 0)}
                </Text>
              </View>
              <Ionicons name="diamond" size={24} color="#3B82F6" />
            </View>
          </View>
        </View>
      </View>
      
      {/* Redemptions List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="space-y-4">
          {sortedRedemptions.map((redemption, index) => (
            <Animated.View
              key={redemption.id}
              entering={FadeInRight.delay(index * 50)}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View 
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${getStatusColor(redemption.status)}20` }}
                    >
                      <Ionicons 
                        name={getStatusIcon(redemption.status) as any} 
                        size={16} 
                        color={getStatusColor(redemption.status)} 
                      />
                    </View>
                    <Text className="font-bold text-gray-900 text-lg">{redemption.rewardName}</Text>
                  </View>
                  
                  <View className="ml-11">
                    <Text className="text-gray-700 font-medium">{redemption.employeeName}</Text>
                    <Text className="text-gray-500 text-sm">{redemption.employeeEmail}</Text>
                    <Text className="text-gray-500 text-sm capitalize">{redemption.employeeDepartment}</Text>
                    
                    <View className="flex-row items-center mt-3 space-x-4">
                      <View className="flex-row items-center">
                        <Ionicons name="diamond" size={16} color="#3B82F6" />
                        <Text className="text-blue-600 font-semibold ml-1">{redemption.pointsCost} points</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text className="text-gray-600 text-sm ml-1">
                          {format(parseISO(redemption.redeemedAt), 'MMM d, yyyy')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              
              {redemption.status === 'pending' && (
                <View className="flex-row space-x-3 mt-4 pt-4 border-t border-gray-100">
                  <Pressable
                    onPress={() => handleRejectReward(redemption.id)}
                    className="flex-1 bg-red-100 py-3 rounded-full"
                  >
                    <Text className="text-red-600 font-semibold text-center">Reject</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleApproveReward(redemption.id)}
                    className="flex-1 bg-green-600 py-3 rounded-full"
                  >
                    <Text className="text-white font-semibold text-center">Approve</Text>
                  </Pressable>
                </View>
              )}
              
              {redemption.status !== 'pending' && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-500 text-sm">Status:</Text>
                    <View className="flex-row items-center">
                      <Ionicons 
                        name={getStatusIcon(redemption.status) as any} 
                        size={16} 
                        color={getStatusColor(redemption.status)} 
                      />
                      <Text 
                        className="ml-1 font-medium capitalize"
                        style={{ color: getStatusColor(redemption.status) }}
                      >
                        {redemption.status}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              <Pressable
                onPress={() => setSelectedReward(redemption)}
                className="mt-3"
              >
                <Text className="text-blue-600 text-center font-medium">View Details</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
        
        {/* Empty State */}
        {sortedRedemptions.length === 0 && (
          <View className="bg-white rounded-xl p-8 items-center">
            <Ionicons name="gift-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              No {statusFilter === 'all' ? '' : statusFilter} redemptions
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              {statusFilter === 'pending' 
                ? 'All reward redemptions have been processed'
                : 'No reward redemptions found for this filter'
              }
            </Text>
          </View>
        )}
        
        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>
      
      {/* Reward Detail Modal */}
      <Modal
        visible={!!selectedReward}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedReward && (
          <View className="flex-1 bg-white">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-900">Redemption Details</Text>
                <Pressable onPress={() => setSelectedReward(null)} className="p-2">
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            <ScrollView className="flex-1 p-6">
              <View className="items-center mb-6">
                <View 
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: `${getStatusColor(selectedReward.status)}20` }}
                >
                  <Ionicons 
                    name={getStatusIcon(selectedReward.status) as any} 
                    size={40} 
                    color={getStatusColor(selectedReward.status)} 
                  />
                </View>
                <Text className="text-2xl font-bold text-gray-900 text-center">
                  {selectedReward.rewardName}
                </Text>
                <Text 
                  className="text-lg font-semibold mt-2 capitalize"
                  style={{ color: getStatusColor(selectedReward.status) }}
                >
                  {selectedReward.status}
                </Text>
              </View>
              
              <View className="bg-gray-50 rounded-xl p-4 mb-6">
                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Employee</Text>
                    <Text className="font-semibold text-gray-900">{selectedReward.employeeName}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Department</Text>
                    <Text className="font-semibold text-gray-900">{selectedReward.employeeDepartment}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Points Cost</Text>
                    <Text className="font-semibold text-blue-600">{selectedReward.pointsCost}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Redeemed Date</Text>
                    <Text className="font-semibold text-gray-900">
                      {format(parseISO(selectedReward.redeemedAt), 'MMM d, yyyy h:mm a')}
                    </Text>
                  </View>
                </View>
              </View>
              
              {selectedReward.status === 'pending' && (
                <View className="space-y-3">
                  <Pressable
                    onPress={() => handleApproveReward(selectedReward.id)}
                    className="bg-green-600 py-4 rounded-xl"
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      Approve Redemption
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRejectReward(selectedReward.id)}
                    className="bg-red-600 py-4 rounded-xl"
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      Reject & Refund
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../state/authStore';
import { useEmployeeStore } from '../state/employeeStore';
import { cn } from '../utils/cn';

type StatusFilter = 'all' | 'pending' | 'approved';

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
      employeeDepartment: 'Unspecified'
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
      case 'completed': return '#10B981'; // Assuming 'completed' maps to 'approved' for UI
      default: return '#6B7280';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time';
      case 'approved': return 'checkmark-circle';
      case 'completed': return 'checkmark-circle'; // Assuming 'completed' maps to 'approved' for UI
      default: return 'help-circle';
    }
  };
  
  const statusOptions = [
    { key: 'pending', label: 'Pending', count: allRedemptions.filter(r => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: allRedemptions.filter(r => r.status === 'approved').length },
    { key: 'all', label: 'All', count: allRedemptions.length },
  ];
  
  if (currentUser?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.heading}>Access Denied</Text>
            <Text style={styles.subheading}>Admin access required</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.heading}>Reward Approval</Text>
            <Text style={styles.subheading}>Review and approve employee reward redemptions</Text>
          </View>
        </View>
        
        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {statusOptions.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => setStatusFilter(option.key as StatusFilter)}
                  style={[
                    styles.filterButton,
                    statusFilter === option.key && styles.activeFilterButton,
                    statusFilter === option.key && styles.activeFilterButtonBackground
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      statusFilter === option.key && styles.activeFilterButtonText
                    ]}
                  >
                    {option.label}
                  </Text>
                  <View style={[
                    styles.filterCountBadge,
                    statusFilter === option.key && styles.activeFilterCountBadgeBackground
                  ]}>
                    <Text style={styles.filterCountBadgeText}>
                      {option.count}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatsCard}>
            <View style={styles.quickStatsContent}>
              <View>
                <Text style={styles.quickStatsLabel}>Pending</Text>
                <Text style={styles.quickStatsValue}>
                  {allRedemptions.filter(r => r.status === 'pending').length}
                </Text>
              </View>
              <Ionicons name="time" size={24} color="#F59E0B" />
            </View>
          </View>
          
          <View style={styles.quickStatsCard}>
            <View style={styles.quickStatsContent}>
              <View>
                <Text style={styles.quickStatsLabel}>Total Value</Text>
                <Text style={styles.quickStatsValue}>
                  {allRedemptions.reduce((sum, r) => sum + r.pointsCost, 0)}
                </Text>
              </View>
              <Ionicons name="diamond" size={24} color="#3B82F6" />
            </View>
          </View>
        </View>
        
        {/* Redemptions List */}
        <View style={styles.redemptionsListContainer}>
          <View style={styles.redemptionsList}>
            {sortedRedemptions.map((redemption, index) => (
              <Animated.View
                key={redemption.id}
                entering={FadeInRight.delay(index * 50)}
                style={styles.redemptionCard}
              >
                <View style={styles.redemptionHeader}>
                  <View style={styles.redemptionInfo}>
                    <View 
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(redemption.status)}20` }
                      ]}
                    >
                      <Ionicons 
                        name={getStatusIcon(redemption.status) as any} 
                        size={16} 
                        color={getStatusColor(redemption.status)} 
                      />
                    </View>
                    <Text style={styles.redemptionTitle}>{redemption.rewardName}</Text>
                  </View>
                </View>
                
                <View style={styles.redemptionDetails}>
                  <Text style={styles.redemptionEmployeeName}>{redemption.employeeName}</Text>
                  <Text style={styles.redemptionEmployeeEmail}>{redemption.employeeEmail}</Text>
                  <Text style={styles.redemptionEmployeeDepartment}>{redemption.employeeDepartment}</Text>
                  
                  <View style={styles.redemptionInfoRow}>
                    <View style={styles.redemptionInfoItem}>
                      <Ionicons name="diamond" size={16} color="#3B82F6" />
                      <Text style={styles.redemptionInfoText}>{redemption.pointsCost} points</Text>
                    </View>
                    <View style={styles.redemptionInfoItem}>
                      <Ionicons name="calendar" size={16} color="#6B7280" />
                      <Text style={styles.redemptionInfoText}>
                        {format(parseISO(redemption.redeemedAt), 'MMM d, yyyy')}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {redemption.status === 'pending' && (
                  <View style={styles.redemptionActions}>
                    <Pressable
                      onPress={() => handleRejectReward(redemption.id)}
                      style={styles.rejectButton}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleApproveReward(redemption.id)}
                      style={styles.approveButton}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </Pressable>
                  </View>
                )}
                
                {redemption.status !== 'pending' && (
                  <View style={styles.redemptionStatusRow}>
                    <Text style={styles.redemptionStatusLabel}>Status:</Text>
                    <View style={styles.redemptionStatusBadge}>
                      <Ionicons 
                        name={getStatusIcon(redemption.status) as any} 
                        size={16} 
                        color={getStatusColor(redemption.status)} 
                      />
                      <Text 
                        style={[
                          styles.redemptionStatusText,
                          { color: getStatusColor(redemption.status) }
                        ]}
                      >
                        {redemption.status}
                      </Text>
                    </View>
                  </View>
                )}
                
                <Pressable
                  onPress={() => setSelectedReward(redemption)}
                  style={styles.viewDetailsButton}
                >
                  <Text style={styles.viewDetailsButtonText}>View Details</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
          
          {/* Empty State */}
          {sortedRedemptions.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="gift-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>
                No {statusFilter === 'all' ? '' : statusFilter} redemptions
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {statusFilter === 'pending' 
                  ? 'All reward redemptions have been processed'
                  : 'No reward redemptions found for this filter'
                }
              </Text>
            </View>
          )}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
      
      {/* Reward Detail Modal */}
      <Modal
        visible={!!selectedReward}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedReward && (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Redemption Details</Text>
                <Pressable onPress={() => setSelectedReward(null)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalRewardInfo}>
                <View 
                  style={[
                    styles.modalStatusBadge,
                    { backgroundColor: `${getStatusColor(selectedReward.status)}20` }
                  ]}
                >
                  <Ionicons 
                    name={getStatusIcon(selectedReward.status) as any} 
                    size={40} 
                    color={getStatusColor(selectedReward.status)} 
                  />
                </View>
                <Text style={styles.modalRewardName}>
                  {selectedReward.rewardName}
                </Text>
                <Text 
                  style={[
                    styles.modalRewardStatus,
                    { color: getStatusColor(selectedReward.status) }
                  ]}
                >
                  {selectedReward.status}
                </Text>
              </View>
              
              <View style={styles.modalRewardDetails}>
                <View style={styles.modalRewardDetailRow}>
                  <Text style={styles.modalRewardDetailLabel}>Employee</Text>
                  <Text style={styles.modalRewardDetailValue}>{selectedReward.employeeName}</Text>
                </View>
                <View style={styles.modalRewardDetailRow}>
                  <Text style={styles.modalRewardDetailLabel}>Department</Text>
                  <Text style={styles.modalRewardDetailValue}>{selectedReward.employeeDepartment}</Text>
                </View>
                <View style={styles.modalRewardDetailRow}>
                  <Text style={styles.modalRewardDetailLabel}>Points Cost</Text>
                  <Text style={styles.modalRewardDetailValue}>{selectedReward.pointsCost}</Text>
                </View>
                <View style={styles.modalRewardDetailRow}>
                  <Text style={styles.modalRewardDetailLabel}>Redeemed Date</Text>
                  <Text style={styles.modalRewardDetailValue}>
                    {format(parseISO(selectedReward.redeemedAt), 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
              </View>
              
              {selectedReward.status === 'pending' && (
                <View style={styles.modalRewardActions}>
                  <Pressable
                    onPress={() => handleApproveReward(selectedReward.id)}
                    style={styles.approveRewardButton}
                  >
                    <Text style={styles.approveRewardButtonText}>
                      Approve Redemption
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRejectReward(selectedReward.id)}
                    style={styles.rejectRewardButton}
                  >
                    <Text style={styles.rejectRewardButtonText}>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { width: '100%', maxWidth: 800, alignItems: 'center' },
  glassCard: { width: '100%', padding: 32, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: '#b87333', shadowColor: '#b87333', shadowOpacity: 0.25, shadowRadius: 8, marginBottom: 24 },
  heading: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#b87333', fontFamily: 'UnifrakturCook' },
  subheading: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  filterContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  activeFilterButtonBackground: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  filterCountBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeFilterCountBadgeBackground: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  quickStatsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickStatsCard: {
    backgroundColor: '#262626',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickStatsContent: {
    flex: 1,
    marginRight: 16,
  },
  quickStatsLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  quickStatsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  redemptionsListContainer: {
    width: '100%',
    paddingHorizontal: 24,
    flex: 1,
  },
  redemptionsList: {
    width: '100%',
  },
  redemptionCard: {
    backgroundColor: '#262626',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  redemptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  redemptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  redemptionDetails: {
    marginLeft: 44,
  },
  redemptionEmployeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  redemptionEmployeeEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  redemptionEmployeeDepartment: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  redemptionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  redemptionInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  redemptionInfoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  redemptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  redemptionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  redemptionStatusLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8,
  },
  redemptionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redemptionStatusText: {
    fontSize: 14,
    fontWeight: 'medium',
    marginLeft: 8,
  },
  viewDetailsButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    backgroundColor: '#262626',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalScrollView: {
    flex: 1,
    padding: 24,
  },
  modalRewardInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalStatusBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRewardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRewardStatus: {
    fontSize: 18,
    fontWeight: 'semibold',
    marginBottom: 16,
  },
  modalRewardDetails: {
    width: '100%',
  },
  modalRewardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalRewardDetailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalRewardDetailValue: {
    fontSize: 14,
    fontWeight: 'semibold',
    color: '#FFFFFF',
  },
  modalRewardActions: {
    width: '100%',
  },
  approveRewardButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  approveRewardButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rejectRewardButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectRewardButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});
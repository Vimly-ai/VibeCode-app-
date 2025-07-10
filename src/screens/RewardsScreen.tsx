import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useEmployeeStore } from '../state/employeeStore';

type RewardCategory = 'all' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export const RewardsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory>('all');
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const { currentEmployee, rewards, redeemReward } = useEmployeeStore();
  const { width: windowWidth } = useWindowDimensions();
  
  // Responsive columns and card width
  let numColumns = 1;
  if (windowWidth >= 900) numColumns = 3;
  else if (windowWidth >= 500) numColumns = 2;
  const cardGap = 18;
  const cardWidth = Math.min(340, (windowWidth - (cardGap * (numColumns + 1))) / numColumns);
  
  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards.filter(reward => reward.category === selectedCategory);
  
  const categories = [
    { key: 'all', label: 'All Rewards', icon: 'gift' },
    { key: 'weekly', label: 'Weekly', icon: 'calendar' },
    { key: 'monthly', label: 'Monthly', icon: 'calendar' },
    { key: 'quarterly', label: 'Quarterly', icon: 'calendar' },
    { key: 'annual', label: 'Annual', icon: 'star' },
  ];
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'weekly': return '#10B981';
      case 'monthly': return '#3B82F6';
      case 'quarterly': return '#8B5CF6';
      case 'annual': return '#F59E0B';
      default: return '#6B7280';
    }
  };
  
  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'weekly': return ['#10B981', '#059669'];
      case 'monthly': return ['#3B82F6', '#1D4ED8'];
      case 'quarterly': return ['#8B5CF6', '#7C3AED'];
      case 'annual': return ['#F59E0B', '#D97706'];
      default: return ['#6B7280', '#4B5563'];
    }
  };
  
  const getRewardIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'card': 'card',
      'time': 'time',
      'gift': 'gift',
      'shirt': 'shirt',
      'car': 'car',
      'calendar': 'calendar',
      'restaurant': 'restaurant',
      'airplane': 'airplane',
      'star': 'star',
      'cafe': 'cafe',
      'phone-portrait': 'phone-portrait',
      'school': 'school',
    };
    return iconMap[iconName] || 'gift';
  };
  
  const handleRedeemReward = (reward: any) => {
    if (!currentEmployee) return;
    
    if (currentEmployee.totalPoints < reward.pointsCost) {
      Alert.alert(
        'Insufficient Points', 
        `You need ${reward.pointsCost - currentEmployee.totalPoints} more points to redeem this reward.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.name}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          onPress: () => {
            const success = redeemReward(currentEmployee.id, reward.id);
            if (success) {
              Alert.alert(
                'Success!',
                `You have successfully redeemed "${reward.name}". Your reward will be processed shortly.`,
                [{ text: 'OK' }]
              );
              setSelectedReward(null);
            }
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.heading}>Rewards</Text>
            <Text style={styles.subheading}>Redeem your points for amazing rewards</Text>
            {currentEmployee && (
              <View style={styles.pointsRow}>
                <Ionicons name="diamond" size={20} color="#3B82F6" />
                <Text style={styles.pointsText}>{currentEmployee.totalPoints} points available</Text>
              </View>
            )}
          </View>
          
          {/* Category Filter */}
          <View style={styles.categoryFilter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryButtons}>
                {categories.map((category) => (
                  <Pressable
                    key={category.key}
                    onPress={() => setSelectedCategory(category.key as RewardCategory)}
                    style={({ pressed }) => [
                      styles.categoryButton,
                      selectedCategory === category.key && styles.selectedCategoryButton,
                      pressed && styles.pressedCategoryButton,
                    ]}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={16} 
                      color={selectedCategory === category.key ? 'white' : '#b87333'} 
                    />
                    <Text
                      style={[styles.categoryButtonText, selectedCategory === category.key && styles.selectedCategoryButtonText]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Rewards Grid */}
          <View style={styles.rewardsGrid}>
            <View style={styles.rewardItems}>
              {filteredRewards.map((reward, index) => {
                const canAfford = currentEmployee && currentEmployee.totalPoints >= reward.pointsCost;
                const gradientColors = getCategoryGradient(reward.category);
                
                return (
                  <Animated.View
                    key={reward.id}
                    entering={FadeInDown.delay(100 + index * 50)}
                  >
                    <Pressable
                      onPress={() => setSelectedReward(reward)}
                      style={[styles.rewardItem, !canAfford && styles.rewardItemDisabled, { width: cardWidth, minWidth: 220, maxWidth: 340 }]}
                    >
                      <LinearGradient
                        colors={gradientColors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rewardItemGradient}
                      >
                        <View style={styles.rewardItemContent}>
                          <View style={styles.rewardItemHeader}>
                            <View style={styles.rewardItemIconContainer}>
                              <Ionicons 
                                name={getRewardIcon(reward.icon)} 
                                size={24} 
                                color="white" 
                              />
                            </View>
                            <View style={styles.rewardItemTitle}>
                              <Text style={styles.rewardItemName}>
                                {reward.name}
                              </Text>
                              <Text style={styles.rewardItemCategory}>
                                {reward.category} Reward
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.rewardItemDescription}>
                            {reward.description}
                          </Text>
                          <View style={styles.rewardItemFooter}>
                            <View style={styles.rewardItemPoints}>
                              <Ionicons name="diamond" size={16} color="white" />
                              <Text style={styles.rewardItemPointsCost}>
                                {reward.pointsCost} points
                              </Text>
                            </View>
                            {canAfford ? (
                              <View style={styles.rewardItemAvailableStatus}>
                                <Text style={styles.rewardItemAvailableText}>
                                  Available
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.rewardItemInsufficientPoints}>
                                <Text style={styles.rewardItemInsufficientText}>
                                  Need {reward.pointsCost - (currentEmployee?.totalPoints || 0)} more
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
            
            {/* Empty State */}
            {filteredRewards.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="gift-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>
                  No rewards available
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Check back later for new rewards in this category
                </Text>
              </View>
            )}
            
            {/* Bottom padding */}
            <View style={styles.bottomPadding} />
          </View>
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
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Reward Details</Text>
                <Pressable
                  onPress={() => setSelectedReward(null)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalRewardDetails}>
                <View 
                  style={[
                    styles.modalRewardIconContainer,
                    { backgroundColor: getCategoryColor(selectedReward.category) }
                  ]}
                >
                  <Ionicons 
                    name={getRewardIcon(selectedReward.icon)} 
                    size={40} 
                    color="white" 
                  />
                </View>
                <Text style={styles.modalRewardName}>
                  {selectedReward.name}
                </Text>
                <Text style={styles.modalRewardCategory}>
                  {selectedReward.category} Reward
                </Text>
              </View>
              
              <View style={styles.modalRewardDescription}>
                <Text style={styles.modalRewardDescriptionText}>
                  {selectedReward.description}
                </Text>
              </View>
              
              <View style={styles.modalRewardDetailsRow}>
                <Text style={styles.modalRewardDetailLabel}>Cost</Text>
                <View style={styles.modalRewardDetailValue}>
                  <Ionicons name="diamond" size={16} color="#3B82F6" />
                  <Text style={styles.modalRewardDetailPointsCost}>
                    {selectedReward.pointsCost} points
                  </Text>
                </View>
              </View>
                
              <View style={styles.modalRewardDetailsRow}>
                <Text style={styles.modalRewardDetailLabel}>Your Points</Text>
                <Text style={styles.modalRewardDetailPoints}>
                  {currentEmployee?.totalPoints || 0} points
                </Text>
              </View>
                
              <View style={styles.modalRewardDetailsRow}>
                <Text style={styles.modalRewardDetailLabel}>Status</Text>
                <Text style={[styles.modalRewardDetailStatus, currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost ? styles.modalRewardDetailStatusAvailable : styles.modalRewardDetailStatusInsufficient]}>
                  {currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost
                    ? "Available"
                    : "Insufficient Points"
                  }
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => handleRedeemReward(selectedReward)}
                disabled={!currentEmployee || currentEmployee.totalPoints < selectedReward.pointsCost}
                style={[styles.redeemButton, currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost ? styles.redeemButtonAvailable : styles.redeemButtonInsufficient]}
              >
                <Text style={[styles.redeemButtonText, currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost ? styles.redeemButtonTextAvailable : styles.redeemButtonTextInsufficient]}>
                  {currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost
                    ? "Redeem Reward"
                    : "Not Enough Points"
                  }
                </Text>
              </Pressable>
            </View>
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
  glassCard: {
    width: '100%',
    padding: 36,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2.5,
    borderColor: '#b87333', // Copper
    shadowColor: '#b87333',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 28,
    alignItems: 'center',
  },
  heading: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#b87333',
    letterSpacing: 1.2,
    textShadowColor: '#fff2',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    fontFamily: 'UnifrakturCook',
  },
  subheading: {
    color: '#b87333',
    fontSize: 18,
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  categoryFilter: {
    width: '100%',
    marginBottom: 28,
    alignItems: 'center',
  },
  categoryButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1.5,
    borderColor: '#b87333',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 7,
    marginBottom: 4,
    shadowColor: '#b87333',
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  selectedCategoryButton: {
    backgroundColor: '#b87333',
    borderColor: '#3B82F6',
    shadowOpacity: 0.22,
  },
  pressedCategoryButton: {
    opacity: 0.7,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b87333',
    marginLeft: 7,
    letterSpacing: 0.2,
  },
  selectedCategoryButtonText: {
    color: 'white',
    textShadowColor: '#3B82F6',
    textShadowRadius: 6,
  },
  rewardsGrid: {
    width: '100%',
    paddingHorizontal: 10,
  },
  rewardItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 18,
  },
  rewardItem: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#b87333',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 7,
    borderWidth: 2,
    borderColor: '#b87333',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.13)',
    flexGrow: 1,
    minWidth: 220,
    maxWidth: 340,
  },
  rewardItemDisabled: {
    opacity: 0.6,
  },
  rewardItemGradient: {
    padding: 18,
    borderRadius: 20,
  },
  rewardItemContent: {
    flex: 1,
  },
  rewardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardItemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#b87333',
    shadowColor: '#b87333',
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  rewardItemTitle: {
    flex: 1,
    marginLeft: 14,
  },
  rewardItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.3,
  },
  rewardItemCategory: {
    fontSize: 13,
    color: 'white',
    opacity: 0.85,
  },
  rewardItemDescription: {
    fontSize: 15,
    color: 'white',
    opacity: 0.93,
    marginBottom: 14,
  },
  rewardItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardItemPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardItemPointsCost: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  rewardItemAvailableStatus: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff', // solid white
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
},
rewardItemAvailableText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#15803d',
  textShadowColor: '#fff',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
},
rewardItemInsufficientPoints: {
  paddingVertical: 7,
  paddingHorizontal: 16,
  borderRadius: 16,
  backgroundColor: '#fff', // solid white
  borderWidth: 2,
  borderColor: '#dc2626',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 90,
},
rewardItemInsufficientText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#b91c1c',
  textShadowColor: '#fff',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
},
  emptyStateContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: { height: 80 },
  modalContent: {
    flex: 1,
    backgroundColor: 'rgba(24,24,27,0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#b87333',
    shadowColor: '#b87333',
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: '#b87333',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b87333',
    letterSpacing: 0.8,
  },
  modalCloseButton: {
    padding: 10,
  },
  modalScrollView: {
    flex: 1,
    padding: 24,
  },
  modalRewardDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalRewardIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#b87333',
    backgroundColor: 'rgba(59,130,246,0.18)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  modalRewardName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#b87333',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalRewardCategory: {
    fontSize: 17,
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRewardDescription: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1.2,
    borderColor: '#b87333',
  },
  modalRewardDescriptionText: {
    fontSize: 17,
    lineHeight: 24,
    color: '#fff',
    fontWeight: '500',
  },
  modalRewardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalRewardDetailLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#b87333',
  },
  modalRewardDetailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalRewardDetailPointsCost: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginLeft: 8,
  },
  modalRewardDetailPoints: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalRewardDetailStatus: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalRewardDetailStatusAvailable: {
    color: '#10B981',
  },
  modalRewardDetailStatusInsufficient: {
    color: '#EF4444',
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1.5,
    borderTopColor: '#b87333',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  redeemButton: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b87333',
    shadowColor: '#b87333',
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  redeemButtonAvailable: {
    backgroundColor: '#3B82F6',
  },
  redeemButtonInsufficient: {
    backgroundColor: '#D1D5DB',
  },
  redeemButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  redeemButtonTextAvailable: {
    color: 'white',
  },
  redeemButtonTextInsufficient: {
    color: '#9CA3AF',
  },
});
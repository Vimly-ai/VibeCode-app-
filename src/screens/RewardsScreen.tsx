import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useEmployeeStore } from '../state/employeeStore';
import { cn } from '../utils/cn';

type RewardCategory = 'all' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export const RewardsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory>('all');
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const { currentEmployee, rewards, redeemReward } = useEmployeeStore();
  
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-2xl font-bold text-gray-900">Rewards</Text>
        <Text className="text-gray-600 mt-1">
          Redeem your points for amazing rewards
        </Text>
        {currentEmployee && (
          <View className="flex-row items-center mt-3">
            <Ionicons name="diamond" size={20} color="#3B82F6" />
            <Text className="text-lg font-semibold text-blue-600 ml-2">
              {currentEmployee.totalPoints} points available
            </Text>
          </View>
        )}
      </View>
      
      {/* Category Filter */}
      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {categories.map((category) => (
              <Pressable
                key={category.key}
                onPress={() => setSelectedCategory(category.key as RewardCategory)}
                className={cn(
                  "px-4 py-2 rounded-full flex-row items-center space-x-2",
                  selectedCategory === category.key
                    ? "bg-blue-600"
                    : "bg-white border border-gray-200"
                )}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.key ? 'white' : '#6B7280'} 
                />
                <Text
                  className={cn(
                    "font-medium",
                    selectedCategory === category.key
                      ? "text-white"
                      : "text-gray-600"
                  )}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Rewards Grid */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="space-y-4">
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
                  className={cn(
                    "rounded-xl overflow-hidden shadow-sm",
                    !canAfford && "opacity-60"
                  )}
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <View className="bg-white/20 p-2 rounded-full mr-3">
                            <Ionicons 
                              name={getRewardIcon(reward.icon)} 
                              size={24} 
                              color="white" 
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-bold text-lg">
                              {reward.name}
                            </Text>
                            <Text className="text-white/80 text-sm capitalize">
                              {reward.category} Reward
                            </Text>
                          </View>
                        </View>
                        <Text className="text-white/90 text-sm mb-3">
                          {reward.description}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Ionicons name="diamond" size={16} color="white" />
                            <Text className="text-white font-semibold ml-1">
                              {reward.pointsCost} points
                            </Text>
                          </View>
                          {canAfford ? (
                            <View className="bg-white/20 px-3 py-1 rounded-full">
                              <Text className="text-white text-sm font-medium">
                                Available
                              </Text>
                            </View>
                          ) : (
                            <View className="bg-black/20 px-3 py-1 rounded-full">
                              <Text className="text-white/60 text-sm">
                                Need {reward.pointsCost - (currentEmployee?.totalPoints || 0)} more
                              </Text>
                            </View>
                          )}
                        </View>
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
          <View className="bg-white rounded-xl p-8 items-center">
            <Ionicons name="gift-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              No rewards available
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Check back later for new rewards in this category
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
                <Text className="text-2xl font-bold text-gray-900">
                  Reward Details
                </Text>
                <Pressable
                  onPress={() => setSelectedReward(null)}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            <ScrollView className="flex-1 p-6">
              <View className="items-center mb-6">
                <View 
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: getCategoryColor(selectedReward.category) }}
                >
                  <Ionicons 
                    name={getRewardIcon(selectedReward.icon)} 
                    size={40} 
                    color="white" 
                  />
                </View>
                <Text className="text-2xl font-bold text-gray-900 text-center">
                  {selectedReward.name}
                </Text>
                <Text className="text-gray-600 text-center mt-1 capitalize">
                  {selectedReward.category} Reward
                </Text>
              </View>
              
              <View className="bg-gray-50 rounded-xl p-4 mb-6">
                <Text className="text-gray-900 text-base leading-relaxed">
                  {selectedReward.description}
                </Text>
              </View>
              
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">Cost</Text>
                  <View className="flex-row items-center">
                    <Ionicons name="diamond" size={16} color="#3B82F6" />
                    <Text className="text-gray-900 font-semibold ml-1">
                      {selectedReward.pointsCost} points
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">Your Points</Text>
                  <Text className="text-gray-900 font-semibold">
                    {currentEmployee?.totalPoints || 0} points
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">Status</Text>
                  <Text className={cn(
                    "font-semibold",
                    currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost
                      ? "text-green-600"
                      : "text-red-600"
                  )}>
                    {currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost
                      ? "Available"
                      : "Insufficient Points"
                    }
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View className="p-6 border-t border-gray-200">
              <Pressable
                onPress={() => handleRedeemReward(selectedReward)}
                disabled={!currentEmployee || currentEmployee.totalPoints < selectedReward.pointsCost}
                className={cn(
                  "py-4 rounded-xl items-center",
                  currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost
                    ? "bg-blue-600"
                    : "bg-gray-300"
                )}
              >
                <Text className={cn(
                  "font-semibold text-lg",
                  currentEmployee && currentEmployee.totalPoints >= selectedReward.pointsCost
                    ? "text-white"
                    : "text-gray-500"
                )}>
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
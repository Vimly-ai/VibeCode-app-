import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useEmployeeStore } from '../state/employeeStore';
import { cn } from '../utils/cn';

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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-2xl font-bold text-gray-900">Leaderboard</Text>
        <Text className="text-gray-600 mt-1">See how you stack up against your teammates</Text>
      </View>
      
      {/* Filter Tabs */}
      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {filterOptions.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => setFilter(option.key as LeaderboardFilter)}
                className={cn(
                  "px-4 py-2 rounded-full",
                  filter === option.key
                    ? "bg-blue-600"
                    : "bg-white border border-gray-200"
                )}
              >
                <Text
                  className={cn(
                    "font-medium",
                    filter === option.key
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
      
      {/* Top 3 Podium */}
      {sortedLeaderboard.length >= 3 && (
        <Animated.View entering={FadeInDown.delay(100)} className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Top Performers
            </Text>
            <View className="flex-row justify-center items-end space-x-4">
              {/* 2nd Place */}
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-2">
                  <Ionicons name="medal" size={28} color="#9CA3AF" />
                </View>
                <Text className="text-sm font-medium text-gray-900 text-center">
                  {sortedLeaderboard[1]?.name.split(' ')[0]}
                </Text>
                <Text className="text-xs text-gray-500">
                  {getPointsForFilter(sortedLeaderboard[1])} pts
                </Text>
              </View>
              
              {/* 1st Place */}
              <View className="items-center -mt-4">
                <View className="w-20 h-20 rounded-full bg-yellow-100 items-center justify-center mb-2">
                  <Ionicons name="trophy" size={36} color="#F59E0B" />
                </View>
                <Text className="text-base font-bold text-gray-900 text-center">
                  {sortedLeaderboard[0]?.name.split(' ')[0]}
                </Text>
                <Text className="text-sm text-yellow-600 font-semibold">
                  {getPointsForFilter(sortedLeaderboard[0])} pts
                </Text>
              </View>
              
              {/* 3rd Place */}
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center mb-2">
                  <Ionicons name="ribbon" size={28} color="#CD7F32" />
                </View>
                <Text className="text-sm font-medium text-gray-900 text-center">
                  {sortedLeaderboard[2]?.name.split(' ')[0]}
                </Text>
                <Text className="text-xs text-gray-500">
                  {getPointsForFilter(sortedLeaderboard[2])} pts
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
      
      {/* Full Leaderboard */}
      <View className="flex-1 px-6">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-3">
            {sortedLeaderboard.map((employee, index) => {
              const rank = index + 1;
              const isCurrentUser = employee.id === currentEmployee?.id;
              const rankIcon = getRankIcon(rank);
              const rankColors = getRankBackground(rank);
              
              return (
                <Animated.View
                  key={employee.id}
                  entering={FadeInRight.delay(200 + index * 50)}
                >
                  <LinearGradient
                    colors={isCurrentUser ? ['#3B82F6', '#1D4ED8'] : rankColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className={cn(
                      "rounded-xl p-4 shadow-sm",
                      isCurrentUser && "border-2 border-blue-400"
                    )}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        {/* Rank */}
                        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3">
                          <Text className={cn(
                            "font-bold text-sm",
                            isCurrentUser ? "text-white" : "text-gray-700"
                          )}>
                            {rank}
                          </Text>
                        </View>
                        
                        {/* Rank Icon */}
                        <View className="mr-3">
                          <Ionicons 
                            name={rankIcon.name as any} 
                            size={24} 
                            color={isCurrentUser ? 'white' : rankIcon.color} 
                          />
                        </View>
                        
                        {/* Employee Info */}
                        <View className="flex-1">
                          <Text className={cn(
                            "font-semibold text-base",
                            isCurrentUser ? "text-white" : "text-gray-900"
                          )}>
                            {employee.name}
                            {isCurrentUser && (
                              <Text className="text-sm font-normal"> (You)</Text>
                            )}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons 
                              name="flame" 
                              size={14} 
                              color={isCurrentUser ? 'white' : '#F59E0B'} 
                            />
                            <Text className={cn(
                              "text-sm ml-1",
                              isCurrentUser ? "text-white/80" : "text-gray-600"
                            )}>
                              {employee.currentStreak} day streak
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Points */}
                      <View className="items-end">
                        <Text className={cn(
                          "text-xl font-bold",
                          isCurrentUser ? "text-white" : "text-gray-900"
                        )}>
                          {getPointsForFilter(employee)}
                        </Text>
                        <Text className={cn(
                          "text-sm",
                          isCurrentUser ? "text-white/80" : "text-gray-500"
                        )}>
                          points
                        </Text>
                      </View>
                    </View>
                    
                    {/* Badges Preview */}
                    {employee.badges.length > 0 && (
                      <View className="flex-row items-center mt-3 pt-3 border-t border-white/20">
                        <View className="flex-row space-x-1">
                          {employee.badges.slice(-3).map((badge, badgeIndex) => (
                            <View
                              key={badge.id}
                              className="w-6 h-6 rounded-full items-center justify-center"
                              style={{ backgroundColor: badge.color }}
                            >
                              <Ionicons name={badge.icon as any} size={12} color="white" />
                            </View>
                          ))}
                        </View>
                        <Text className={cn(
                          "text-sm ml-2",
                          isCurrentUser ? "text-white/80" : "text-gray-600"
                        )}>
                          {employee.badges.length} badge{employee.badges.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </View>
          
          {/* Empty State */}
          {sortedLeaderboard.length === 0 && (
            <View className="bg-white rounded-xl p-8 items-center">
              <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
              <Text className="text-xl font-semibold text-gray-900 mt-4">
                No rankings yet
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                Start checking in to see your name on the leaderboard!
              </Text>
            </View>
          )}
          
          {/* Bottom padding */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
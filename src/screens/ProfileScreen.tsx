import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { useEmployeeStore } from '../state/employeeStore';
import { useAuthStore } from '../state/authStore';
import { cn } from '../utils/cn';

export const ProfileScreen: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { currentEmployee, initializeEmployee } = useEmployeeStore();
  const { currentUser, signOut } = useAuthStore();
  
  const handleCreateProfile = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    initializeEmployee(name.trim(), email.trim());
    setIsEditing(false);
    Alert.alert('Success', 'Profile created successfully!');
  };
  
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut }
      ]
    );
  };

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'Notification settings will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'For assistance, please contact:\n\n📧 support@company.com\n📞 1-800-HELP\n\nOr visit our help center online.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsPrivacy = () => {
    Alert.alert(
      'Terms & Privacy',
      'Our terms of service and privacy policy protect your data and outline your rights.\n\nLast updated: January 2024\n\nFor full details, visit our website.',
      [{ text: 'OK' }]
    );
  };
  
  // If no employee exists but user is authenticated, show onboarding
  if (!currentEmployee && currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 px-6">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="pt-12 pb-8">
              <View className="items-center mb-8">
                <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="person-add" size={40} color="#3B82F6" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 text-center">
                  Welcome to RewardSpace
                </Text>
                <Text className="text-gray-600 text-center mt-2 text-lg">
                  Turn your attendance into achievements
                </Text>
              </View>
              
              <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <Text className="text-xl font-semibold text-gray-900 mb-4">
                  Create Your Profile
                </Text>
                
                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                
                <Pressable
                  onPress={handleCreateProfile}
                  className="bg-blue-600 rounded-xl p-4 mt-6"
                >
                  <Text className="text-white font-semibold text-center text-lg">
                    Get Started
                  </Text>
                </Pressable>
              </View>
              
              <View className="bg-white rounded-2xl p-6 shadow-sm">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  How It Works
                </Text>
                
                <View className="space-y-4">
                  <View className="flex-row items-start">
                    <View className="bg-blue-100 p-2 rounded-full mr-4">
                      <Ionicons name="qr-code" size={20} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">1. Scan QR Code</Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        Use your phone to scan the daily check-in QR code
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-start">
                    <View className="bg-green-100 p-2 rounded-full mr-4">
                      <Ionicons name="diamond" size={20} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">2. Earn Points</Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        Get points for being on time, early, or maintaining streaks
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-start">
                    <View className="bg-purple-100 p-2 rounded-full mr-4">
                      <Ionicons name="gift" size={20} color="#8B5CF6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">3. Redeem Rewards</Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        Trade points for gift cards, time off, and exclusive perks
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show profile for existing employee
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        <Text className="text-gray-600 mt-1">Manage your account and view your progress</Text>
      </View>
      
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <LinearGradient
            colors={currentUser?.role === 'admin' ? ['#8B5CF6', '#7C3AED'] : ['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-6 mb-6"
          >
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mr-4">
                {currentUser?.role === 'admin' ? (
                  <Ionicons name="shield-checkmark" size={28} color="white" />
                ) : (
                  <Text className="text-white font-bold text-xl">
                    {(currentEmployee?.name || currentUser?.name || '').split(' ').map(n => n[0]).join('')}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-xl">
                  {currentEmployee?.name || currentUser?.name}
                </Text>
                <Text className="text-blue-100 mt-1">
                  {currentEmployee?.email || currentUser?.email}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="bg-white/20 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold capitalize">
                      {currentUser?.role || 'Employee'}
                    </Text>
                  </View>
                  {currentUser?.department && (
                    <Text className="text-blue-100 text-sm ml-2">
                      {currentUser.department}
                    </Text>
                  )}
                </View>
                <Text className="text-blue-100 text-sm mt-1">
                  Member since {format(parseISO(currentEmployee?.checkIns[0]?.timestamp || currentUser?.createdAt || new Date().toISOString()), 'MMM yyyy')}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Stats Overview - Only show for employees with data */}
        {currentEmployee && currentUser?.role === 'employee' && (
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Statistics</Text>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="diamond" size={20} color="#3B82F6" />
                    <Text className="text-gray-700 ml-2">Total Points</Text>
                  </View>
                  <Text className="font-semibold text-gray-900">
                    {currentEmployee.totalPoints}
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="flame" size={20} color="#F59E0B" />
                    <Text className="text-gray-700 ml-2">Current Streak</Text>
                  </View>
                  <Text className="font-semibold text-gray-900">
                    {currentEmployee.currentStreak} days
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="trophy" size={20} color="#10B981" />
                    <Text className="text-gray-700 ml-2">Longest Streak</Text>
                  </View>
                  <Text className="font-semibold text-gray-900">
                    {currentEmployee.longestStreak} days
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={20} color="#8B5CF6" />
                    <Text className="text-gray-700 ml-2">Total Check-ins</Text>
                  </View>
                  <Text className="font-semibold text-gray-900">
                    {currentEmployee.checkIns.length}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Badges - Only show for employees */}
        {currentEmployee && currentEmployee.badges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Badges ({currentEmployee.badges.length})
              </Text>
              <View className="flex-row flex-wrap gap-4">
                {currentEmployee.badges.map((badge, index) => (
                  <View key={badge.id} className="items-center">
                    <View 
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: badge.color }}
                    >
                      <Ionicons name={badge.icon as any} size={24} color="white" />
                    </View>
                    <Text className="text-xs text-gray-700 text-center max-w-16">
                      {badge.name}
                    </Text>
                    {badge.unlockedAt && (
                      <Text className="text-xs text-gray-500 text-center max-w-16">
                        {format(parseISO(badge.unlockedAt), 'MMM d')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Recent Rewards - Only show for employees */}
        {currentEmployee && currentEmployee.rewardsRedeemed.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} className="mb-6">
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Recent Rewards
              </Text>
              <View className="space-y-3">
                {currentEmployee.rewardsRedeemed.slice(-3).map((reward, index) => (
                  <View key={reward.id} className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{reward.rewardName}</Text>
                      <Text className="text-sm text-gray-500">
                        {format(parseISO(reward.redeemedAt), 'MMM d, yyyy')}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-semibold text-gray-900">
                        -{reward.pointsCost} pts
                      </Text>
                      <Text className={cn(
                        "text-xs capitalize",
                        reward.status === 'completed' ? "text-green-600" :
                        reward.status === 'approved' ? "text-blue-600" : "text-yellow-600"
                      )}>
                        {reward.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(500)} className="mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
            <View className="space-y-4">
              <Pressable 
                onPress={handleNotifications}
                className="flex-row items-center justify-between py-2"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center">
                  <Ionicons name="notifications" size={20} color="#6B7280" />
                  <Text className="text-gray-700 ml-3">Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
              
              <Pressable 
                onPress={handleHelpSupport}
                className="flex-row items-center justify-between py-2"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center">
                  <Ionicons name="help-circle" size={20} color="#6B7280" />
                  <Text className="text-gray-700 ml-3">Help & Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
              
              <Pressable 
                onPress={handleTermsPrivacy}
                className="flex-row items-center justify-between py-2"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center">
                  <Ionicons name="document-text" size={20} color="#6B7280" />
                  <Text className="text-gray-700 ml-3">Terms & Privacy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInDown.delay(600)} className="mb-6">
          <Pressable
            onPress={handleSignOut}
            className="bg-red-50 border border-red-200 rounded-2xl p-6"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out" size={24} color="#EF4444" />
              <Text className="text-red-600 font-semibold text-lg ml-3">Sign Out</Text>
            </View>
            <Text className="text-red-500 text-sm text-center mt-2">
              You will need to sign in again to access the app
            </Text>
          </Pressable>
        </Animated.View>
        
        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};
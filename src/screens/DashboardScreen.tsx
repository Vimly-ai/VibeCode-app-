import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { useEmployeeStore } from '../state/employeeStore';
import { QRCodeScanner } from '../components/QRCodeScanner';
import { DemoQRCode } from '../components/DemoQRCode';
import { cn } from '../utils/cn';

const { width: screenWidth } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showDemoQR, setShowDemoQR] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; pointsEarned: number } | null>(null);
  const { currentEmployee, getEmployeeStats } = useEmployeeStore();
  const insets = useSafeAreaInsets();
  
  if (!currentEmployee) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="person-circle-outline" size={120} color="#9CA3AF" />
          <Text className="text-2xl font-bold text-gray-800 mt-4">Welcome!</Text>
          <Text className="text-gray-600 text-center mt-2">
            Please set up your profile to start earning rewards
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const stats = getEmployeeStats(currentEmployee.id);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  
  const hasCheckedInToday = stats.todayPoints > 0;
  
  const handleScanSuccess = (result: { success: boolean; message: string; pointsEarned: number }) => {
    setScanResult(result);
    setShowScanner(false);
  };
  
  const getNextRewardTier = () => {
    const points = currentEmployee.totalPoints;
    if (points < 25) return { name: 'Monthly Rewards', needed: 25 - points };
    if (points < 75) return { name: 'Quarterly Rewards', needed: 75 - points };
    if (points < 300) return { name: 'Annual Rewards', needed: 300 - points };
    return { name: 'Legend Status', needed: 0 };
  };
  
  const nextTier = getNextRewardTier();
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-600 text-base">{greeting}</Text>
              <Text className="text-2xl font-bold text-gray-900">{currentEmployee.name}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-gray-500">Total Points</Text>
              <Text className="text-3xl font-bold text-blue-600">{currentEmployee.totalPoints}</Text>
            </View>
          </View>
        </View>
        
        {/* Check-in Button */}
        <Animated.View entering={FadeInDown.delay(100)} className="px-6 mb-6">
          <Pressable
            onPress={() => setShowScanner(true)}
            disabled={hasCheckedInToday}
            className={cn(
              "overflow-hidden rounded-2xl",
              hasCheckedInToday ? "opacity-60" : ""
            )}
          >
            <LinearGradient
              colors={hasCheckedInToday ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">
                    {hasCheckedInToday ? 'Checked In Today!' : 'Check In Now'}
                  </Text>
                  <Text className="text-blue-100 mt-1">
                    {hasCheckedInToday 
                      ? `You earned ${stats.todayPoints} points today` 
                      : 'Scan QR code to earn points'
                    }
                  </Text>
                </View>
                <View className="bg-white/20 p-3 rounded-full">
                  <Ionicons 
                    name={hasCheckedInToday ? "checkmark" : "qr-code"} 
                    size={28} 
                    color="white" 
                  />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
        
        {/* Stats Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row space-x-4">
            <Animated.View entering={FadeInRight.delay(200)} className="flex-1">
              <View className="bg-white p-4 rounded-xl shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-500 text-sm">Current Streak</Text>
                    <Text className="text-2xl font-bold text-orange-600">{currentEmployee.currentStreak}</Text>
                  </View>
                  <Ionicons name="flame" size={24} color="#EA580C" />
                </View>
              </View>
            </Animated.View>
            
            <Animated.View entering={FadeInRight.delay(300)} className="flex-1">
              <View className="bg-white p-4 rounded-xl shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-500 text-sm">This Week</Text>
                    <Text className="text-2xl font-bold text-green-600">{stats.weeklyPoints}</Text>
                  </View>
                  <Ionicons name="calendar" size={24} color="#16A34A" />
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
        
        {/* Progress to Next Tier */}
        {nextTier.needed > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} className="px-6 mb-6">
            <View className="bg-white p-5 rounded-xl shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-semibold text-gray-900">Next Tier</Text>
                <Text className="text-sm text-gray-500">{nextTier.needed} points needed</Text>
              </View>
              <Text className="text-gray-600 mb-3">{nextTier.name}</Text>
              <View className="bg-gray-200 h-3 rounded-full overflow-hidden">
                <View 
                  className="bg-blue-500 h-full rounded-full"
                  style={{ 
                    width: `${Math.max(10, (currentEmployee.totalPoints / (currentEmployee.totalPoints + nextTier.needed)) * 100)}%` 
                  }}
                />
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Badges */}
        {currentEmployee.badges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500)} className="px-6 mb-6">
            <View className="bg-white p-5 rounded-xl shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Badges</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-3">
                  {currentEmployee.badges.slice(-3).map((badge, index) => (
                    <View key={badge.id} className="items-center">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: badge.color }}
                      >
                        <Ionicons name={badge.icon as any} size={24} color="white" />
                      </View>
                      <Text className="text-xs text-gray-600 mt-2 text-center max-w-16">
                        {badge.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        )}
        
        {/* Demo QR Code Button */}
        <Animated.View entering={FadeInDown.delay(550)} className="px-6 mb-6">
          <Pressable
            onPress={() => setShowDemoQR(true)}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="construct" size={20} color="#F59E0B" />
              <Text className="text-yellow-800 font-semibold ml-2">
                Demo QR Code (Testing)
              </Text>
            </View>
            <Text className="text-yellow-600 text-sm text-center mt-1">
              Tap to simulate scanning a QR code
            </Text>
          </Pressable>
        </Animated.View>

        {/* Recent Check-ins */}
        <Animated.View entering={FadeInDown.delay(600)} className="px-6 mb-6">
          <View className="bg-white p-5 rounded-xl shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Check-ins</Text>
            {stats.recentCheckIns.length > 0 ? (
              <View className="space-y-3">
                {stats.recentCheckIns.slice(0, 5).map((checkIn, index) => (
                  <View key={checkIn.id} className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className={cn(
                        "w-8 h-8 rounded-full items-center justify-center mr-3",
                        checkIn.type === 'early' ? "bg-yellow-100" :
                        checkIn.type === 'ontime' ? "bg-green-100" : "bg-gray-100"
                      )}>
                        <Ionicons 
                          name={checkIn.type === 'early' ? "sunrise" : checkIn.type === 'ontime' ? "checkmark" : "time"} 
                          size={16} 
                          color={checkIn.type === 'early' ? "#F59E0B" : checkIn.type === 'ontime' ? "#10B981" : "#6B7280"} 
                        />
                      </View>
                      <View>
                        <Text className="text-gray-900 font-medium">
                          {format(parseISO(checkIn.timestamp), 'MMM d, h:mm a')}
                        </Text>
                        {checkIn.bonusReason && (
                          <Text className="text-sm text-blue-600">{checkIn.bonusReason}</Text>
                        )}
                      </View>
                    </View>
                    <Text className="text-lg font-semibold text-gray-900">
                      +{checkIn.pointsEarned}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-gray-500 text-center py-4">No check-ins yet</Text>
            )}
          </View>
        </Animated.View>
        
        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
      
      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen">
        <QRCodeScanner 
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      </Modal>
      
      {/* Demo QR Code Modal */}
      <DemoQRCode 
        visible={showDemoQR} 
        onClose={() => setShowDemoQR(false)}
        onCheckInSuccess={handleScanSuccess}
      />

      {/* Scan Result Modal */}
      <Modal visible={!!scanResult} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center">
              <Ionicons 
                name={scanResult?.success ? "checkmark-circle" : "close-circle"} 
                size={64} 
                color={scanResult?.success ? "#10B981" : "#EF4444"} 
              />
              <Text className="text-xl font-bold mt-4">
                {scanResult?.success ? 'Check-in Successful!' : 'Check-in Failed'}
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                {scanResult?.message}
              </Text>
              {scanResult?.success && scanResult.pointsEarned > 0 && (
                <View className="bg-blue-50 px-4 py-2 rounded-full mt-4">
                  <Text className="text-blue-600 font-semibold">
                    +{scanResult.pointsEarned} points earned!
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => setScanResult(null)}
              className="bg-blue-600 py-3 rounded-full mt-6"
            >
              <Text className="text-white text-center font-semibold">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
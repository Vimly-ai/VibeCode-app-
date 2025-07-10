import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Modal, StyleSheet, DimensionValue } from 'react-native';
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
  try {
    const [showScanner, setShowScanner] = useState(false);
    const [showDemoQR, setShowDemoQR] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; pointsEarned: number; quote?: any } | null>(null);
    const { currentEmployee, getEmployeeStats } = useEmployeeStore();
    const insets = useSafeAreaInsets();
    
    if (!currentEmployee) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
          <Ionicons name="person-circle-outline" size={120} color="#9CA3AF" />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a202c', marginTop: 16 }}>Welcome!</Text>
          <Text style={{ color: '#4b5563', marginTop: 8, textAlign: 'center' }}>
            Please set up your profile to start earning rewards
          </Text>
        </SafeAreaView>
      );
    }
    const stats = getEmployeeStats(currentEmployee.id);
    if (!stats) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
          <Text style={{ fontSize: 18, color: '#EF4444' }}>Unable to load your stats. Please try again later.</Text>
        </SafeAreaView>
      );
    }
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
    
    const hasCheckedInToday = stats.todayPoints > 0;
    
    const handleScanSuccess = (result: { success: boolean; message: string; pointsEarned: number; quote?: any }) => {
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
    
    // Define glassmorphic card style for reuse
    const glassCard = {
      width: '100%' as DimensionValue,
      maxWidth: 600,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 2,
      borderColor: '#b87333',
      shadowColor: '#b87333',
      shadowOpacity: 0.15,
      shadowRadius: 16,
      padding: 32,
      marginBottom: 24,
    };
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#18181b' }}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <View style={{ ...glassCard, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 36 }}>
            <View>
              <Text style={{ color: '#b87333', fontSize: 32, fontWeight: 'bold', fontFamily: 'UnifrakturCook' }}>{greeting},</Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{currentEmployee.name}!</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#e5e7eb', fontSize: 16 }}>Total Points</Text>
              <View style={{ backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 20, marginTop: 4 }}>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{currentEmployee.totalPoints}</Text>
              </View>
            </View>
          </View>
          {/* Check-In Card */}
          <View style={{ ...glassCard, alignItems: 'flex-start', padding: 28 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Check In</Text>
            <Pressable
              onPress={() => setShowScanner(true)}
              disabled={hasCheckedInToday}
              style={{
                width: '100%',
                borderRadius: 16,
                backgroundColor: hasCheckedInToday ? '#6B7280' : undefined,
                overflow: 'hidden',
                marginBottom: 12,
              }}
            >
              <LinearGradient
                colors={hasCheckedInToday ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20, borderRadius: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                      {hasCheckedInToday ? 'Checked In Today!' : 'Check In Now'}
                    </Text>
                    <Text style={{ color: '#dbeafe', fontSize: 16, marginTop: 2 }}>
                      {hasCheckedInToday
                        ? `You earned ${stats.todayPoints} points today`
                        : 'Scan QR code to earn points'}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 32 }}>
                    <Ionicons
                      name={hasCheckedInToday ? 'checkmark' : 'qr-code'}
                      size={32}
                      color="#fff"
                    />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
            {/* Progress to Next Tier */}
            {nextTier.needed > 0 && (
              <View style={{ marginTop: 12, width: '100%' }}>
                <Text style={{ color: '#e5e7eb', fontSize: 16, marginBottom: 4 }}>Next Tier: <Text style={{ color: '#b87333', fontWeight: 'bold' }}>{nextTier.name}</Text></Text>
                <View style={{ height: 8, backgroundColor: '#23232b', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: '#3B82F6',
                      width: `${Math.max(10, (currentEmployee.totalPoints / (currentEmployee.totalPoints + nextTier.needed)) * 100)}%`,
                      borderRadius: 8,
                    }}
                  />
                </View>
                <Text style={{ color: '#e5e7eb', fontSize: 14 }}>{nextTier.needed} points needed</Text>
              </View>
            )}
          </View>
          {/* Stats Row */}
          <View style={{ flexDirection: 'row', width: '100%', maxWidth: 600, marginBottom: 24 }}>
            <View style={{ ...glassCard, flex: 1, marginRight: 8, alignItems: 'center', padding: 24 }}>
              <Ionicons name="flame" size={32} color="#EA580C" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#EA580C', fontSize: 28, fontWeight: 'bold' }}>{currentEmployee.currentStreak}</Text>
              <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Current Streak</Text>
            </View>
            <View style={{ ...glassCard, flex: 1, marginHorizontal: 4, alignItems: 'center', padding: 24 }}>
              <Ionicons name="calendar" size={32} color="#16A34A" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#16A34A', fontSize: 28, fontWeight: 'bold' }}>{stats.weeklyPoints}</Text>
              <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>This Week</Text>
            </View>
            <View style={{ ...glassCard, flex: 1, marginLeft: 8, alignItems: 'center', padding: 24 }}>
              <Ionicons name="star" size={32} color="#8B5CF6" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#8B5CF6', fontSize: 28, fontWeight: 'bold' }}>{nextTier.needed > 0 ? nextTier.needed : 'Max'}</Text>
              <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>To Next Tier</Text>
            </View>
          </View>
          {/* Badges */}
          {currentEmployee.badges.length > 0 && (
            <View style={{ ...glassCard, padding: 24 }}>
              <Text style={{ color: '#b87333', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Recent Badges</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row' }}>
                  {currentEmployee.badges.slice(-5).map((badge, index) => (
                    <View key={badge.id} style={{ alignItems: 'center', marginRight: 20 }}>
                      <View style={{ backgroundColor: badge.color, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: '#b87333' }}>
                        <Ionicons name={badge.icon as any} size={28} color="#fff" />
                      </View>
                      <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', maxWidth: 60 }}>{badge.name}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          {/* Recent Check-ins */}
          <View style={{ ...glassCard, padding: 24 }}>
            <Text style={{ color: '#b87333', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Recent Check-ins</Text>
            {stats.recentCheckIns.length > 0 ? (
              <View>
                {stats.recentCheckIns.slice(0, 5).map((checkIn, index) => (
                  <View key={checkIn.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons
                      name={checkIn.type === 'early' ? 'sunny' : checkIn.type === 'ontime' ? 'checkmark' : 'time'}
                      size={20}
                      color={checkIn.type === 'early' ? '#F59E0B' : checkIn.type === 'ontime' ? '#10B981' : '#6B7280'}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ color: '#fff', fontSize: 16, flex: 1 }}>
                      {format(parseISO(checkIn.timestamp), 'MMM d, h:mm a')}
                    </Text>
                    <Text style={{ color: '#3B82F6', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>+{checkIn.pointsEarned}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: '#e5e7eb', fontSize: 16, textAlign: 'center', paddingVertical: 16 }}>No check-ins yet</Text>
            )}
          </View>
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
            <View className="bg-white rounded-2xl p-6 w-full max-w-md">
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
                
                {/* Motivational Quote */}
                {scanResult?.quote && (
                  <Animated.View 
                    entering={FadeInDown.delay(300)}
                    className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100"
                  >
                    <View className="items-center mb-4">
                      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                        <Ionicons name="bulb" size={24} color="#3B82F6" />
                      </View>
                      <Text className="text-sm font-semibold text-blue-700">
                        Daily Inspiration
                      </Text>
                    </View>
                    <Text className="text-gray-800 text-center text-base leading-relaxed font-medium italic">
                      "{scanResult.quote.text}"
                    </Text>
                    <Text className="text-gray-600 text-center text-sm mt-3 font-medium">
                      — {scanResult.quote.author}
                    </Text>
                  </Animated.View>
                )}
              </View>
              <Pressable
                onPress={() => setScanResult(null)}
                className="bg-blue-600 py-3 rounded-full mt-6"
              >
                <Text className="text-white text-center font-semibold">Continue</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  } catch (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ fontSize: 18, color: '#EF4444' }}>An unexpected error occurred: {String(error)}</Text>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { width: '100%', maxWidth: 800, alignItems: 'center' },
  glassCard: { width: '100%', padding: 32, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: '#b87333', shadowColor: '#b87333', shadowOpacity: 0.25, shadowRadius: 8, marginBottom: 24 },
  heading: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#b87333', fontFamily: 'UnifrakturCook' },
  headerSection: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subheading: { color: '#b87333', fontSize: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  pointsBox: { alignItems: 'flex-end' },
  pointsLabel: { color: '#b87333', fontSize: 14 },
  pointsValue: { fontSize: 28, fontWeight: 'bold', color: '#3B82F6' },
  // ...add more styles for other sections as needed...
});
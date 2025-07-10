import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal, Switch, StyleSheet, TouchableOpacity, Linking, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { useEmployeeStore } from '../state/employeeStore';
import { useAuthStore } from '../state/authStore';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [notifications, setNotifications] = useState({
    checkInReminders: true,
    rewardUpdates: true,
    bonusPointAlerts: true,
    weeklyReports: false,
    systemUpdates: true,
  });
  const { currentEmployee, initializeEmployee } = useEmployeeStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const signOut = useAuthStore(state => state.signOut);
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 600;
  const isTablet = windowWidth >= 600 && windowWidth < 1000;
  const isDesktop = windowWidth >= 1000;
  let statsNumColumns = 1;
  if (windowWidth >= 700) statsNumColumns = 2;
  const statsCardGap = 28;
  const statsCardWidth = Math.min(340, (windowWidth - (statsCardGap * (statsNumColumns + 1))) / statsNumColumns);

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
    console.log('SIGN OUT BUTTON CLICKED - calling signOut()');
    signOut();
  };

  const handleNotifications = () => {
    setShowNotifications(true);
  };

  const updateNotificationSetting = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'For assistance, please contact:\n\n📧 Andy@Vimly.ai\n\nOr visit our help center online.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsPrivacy = () => {
    Alert.alert(
      'Terms & Privacy',
      'Our terms of service and privacy policy protect your data and outline your rights.\n\nLast updated: January 2025\n\nFor full details, visit our website.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    if (Platform.OS === 'web') {
      window.location.href = 'mailto:andy@vimly.ai';
    } else {
      setShowHelp(true);
    }
  };

  const openNotifications = () => setShowNotifications(true);
  const openHelp = () => setShowHelp(true);
  const openTerms = () => setShowTerms(true);

  // If no employee exists but user is authenticated, show onboarding
  if (!currentEmployee && currentUser && currentUser.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.scrollContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.centered}>
              <View style={styles.glassCard}>
                <Text style={styles.heading}>Welcome to RewardSpace</Text>
                <Text style={styles.subHeading}>Turn your attendance into achievements</Text>
              </View>
              <View style={styles.whiteCard}>
                <Text style={styles.sectionTitle}>Create Your Profile</Text>
                <View style={styles.inputGroup}>
                  <View>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                <Pressable
                  onPress={handleCreateProfile}
                  style={styles.getStartedButton}
                >
                  <Text style={styles.getStartedButtonText}>Get Started</Text>
                </Pressable>
              </View>
              <View style={styles.whiteCard}>
                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.howItWorksList}>
                  <View style={styles.howItWorksItem}>
                    <View style={styles.howItWorksIcon}>
                      <Ionicons name="qr-code" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.howItWorksText}>
                      <Text style={styles.howItWorksTitle}>1. Scan QR Code</Text>
                      <Text style={styles.howItWorksDescription}>
                        Use your phone to scan the daily check-in QR code
                      </Text>
                    </View>
                  </View>
                  <View style={styles.howItWorksItem}>
                    <View style={styles.howItWorksIcon}>
                      <Ionicons name="diamond" size={20} color="#10B981" />
                    </View>
                    <View style={styles.howItWorksText}>
                      <Text style={styles.howItWorksTitle}>2. Earn Points</Text>
                      <Text style={styles.howItWorksDescription}>
                        Get points for being on time, early, or maintaining streaks
                      </Text>
                    </View>
                  </View>
                  <View style={styles.howItWorksItem}>
                    <View style={styles.howItWorksIcon}>
                      <Ionicons name="gift" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.howItWorksText}>
                      <Text style={styles.howItWorksTitle}>3. Redeem Rewards</Text>
                      <Text style={styles.howItWorksDescription}>
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
  if (currentUser?.role === 'admin') {
    const { employees } = useEmployeeStore();
    const { pendingUsers } = useAuthStore();
    const totalEmployees = employees.length;
    const pendingApprovals = pendingUsers.length;
    const totalPointsDistributed = employees.reduce((sum, e) => sum + (e.totalPoints || 0), 0);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#18181b' }}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Quick Stats Section */}
          <View style={{ flexDirection: 'row', width: '100%', maxWidth: 600, marginBottom: 32, justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={{ flex: 1, marginRight: 8, backgroundColor: '#3B82F6', borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => (navigation.navigate as any)('Employees')}
            >
              <Ionicons name="people" size={28} color="#fff" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Employees</Text>
              <Text style={{ color: '#dbeafe', fontSize: 24, fontWeight: 'bold' }}>{totalEmployees}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, marginHorizontal: 4, backgroundColor: '#F59E0B', borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => (navigation.navigate as any)('Employees', { tab: 'pending' } as any)}
            >
              <Ionicons name="time" size={28} color="#fff" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Pending</Text>
              <Text style={{ color: '#fef3c7', fontSize: 24, fontWeight: 'bold' }}>{pendingApprovals}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, marginLeft: 8, backgroundColor: '#8B5CF6', borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => (navigation.navigate as any)('Employees', { tab: 'analytics' } as any)}
            >
              <Ionicons name="analytics" size={28} color="#fff" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Analytics</Text>
              <Ionicons name="bar-chart" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* 1. HERO GLASS CARD */}
          <Animated.View entering={FadeInDown.delay(100)} style={[
            styles.heroGlassCard,
            isMobile ? {
              minWidth: '100%',
              maxWidth: '100%',
              padding: 18,
              minHeight: 140,
            } : isTablet ? {
              minWidth: '90%',
              maxWidth: '90%',
              padding: 32,
              minHeight: 180,
            } : {
              minWidth: 480,
              maxWidth: 600,
              padding: 48,
              minHeight: 240,
            }
          ]}>
            <LinearGradient
              colors={['#18181b', '#23232b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.heroContentRow}>
                <View style={styles.heroAvatarOuter}>
                  <View style={styles.heroAvatarInner}>
                    <Text style={styles.heroAvatarText}>
                      {(currentUser?.name || '').split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroDetails}>
                  <Text style={styles.heroName}>Admin User</Text>
                  <Text style={styles.heroEmail}>admin@demo.com</Text>
                  <View style={styles.heroRoleRow}>
                    <View style={styles.heroRoleBadge}>
                      <Text style={styles.heroRoleBadgeText}>Admin</Text>
                    </View>
                    {currentUser?.department ? (
                      <Text style={styles.heroDepartment}>{currentUser.department}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.heroMemberSince}>Member since Jul 2025</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
          {/* 2. QUICK ACTIONS */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.quickActionsGlassCard}>
            <LinearGradient
              colors={['#23232b', '#31313d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickActionsGradient}
            >
              <View style={styles.quickActionsContent}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation.navigate as any)('Employees')}>
                    <Ionicons name="people" size={32} color="#3B82F6" />
                    <Text style={styles.quickActionTitle}>Manage Employees</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation.navigate as any)('Employees', { tab: 'pending' } as any)}>
                    <Ionicons name="time" size={32} color="#F59E0B" />
                    <Text style={styles.quickActionTitle}>Pending Approvals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation.navigate as any)('Employees', { tab: 'analytics' } as any)}>
                    <Ionicons name="analytics" size={32} color="#8B5CF6" />
                    <Text style={styles.quickActionTitle}>Analytics</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionItem} onPress={() => (navigation.navigate as any)('Settings')}>
                    <Ionicons name="settings" size={32} color="#EF4444" />
                    <Text style={styles.quickActionTitle}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
          {/* 3. RECENT ADMIN ACTIVITY */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.recentActivityGlassCard}>
            <LinearGradient
              colors={['#23232b', '#31313d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recentActivityGradient}
            >
              <View style={styles.recentActivityContent}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.recentActivityList}>
                  {/* Placeholder for recent activity items */}
                  <View style={styles.recentActivityItem}>
                    <Ionicons name="document-text" size={24} color="#F59E0B" />
                    <View style={styles.recentActivityText}>
                      <Text style={styles.recentActivityTitle}>Updated Terms & Privacy</Text>
                      <Text style={styles.recentActivityDate}>2 days ago</Text>
                    </View>
                  </View>
                  <View style={styles.recentActivityItem}>
                    <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                    <View style={styles.recentActivityText}>
                      <Text style={styles.recentActivityTitle}>Approved new employee</Text>
                      <Text style={styles.recentActivityDate}>1 week ago</Text>
                    </View>
                  </View>
                  <View style={styles.recentActivityItem}>
                    <Ionicons name="gift" size={24} color="#8B5CF6" />
                    <View style={styles.recentActivityText}>
                      <Text style={styles.recentActivityTitle}>New reward added</Text>
                      <Text style={styles.recentActivityDate}>2 weeks ago</Text>
                    </View>
                  </View>
                  {/* Add more recent activity items here */}
                </View>
                {employees.length === 0 && pendingUsers.length === 0 && (
                  <View style={styles.recentActivityEmpty}>
                    <Ionicons name="settings" size={48} color="#F59E0B" />
                    <Text style={styles.recentActivityEmptyText}>No recent activity yet. Keep up the good work!</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
          {/* 4. SETTINGS & SUPPORT */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.settingsGlassCard}>
            <LinearGradient
              colors={['#23232b', '#31313d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.settingsGradient}
            >
              <View style={styles.settingsContent}>
                <Text style={styles.sectionTitle}>Settings & Support</Text>
                <View style={styles.settingsList}>
                  <TouchableOpacity onPress={handleNotifications} style={styles.settingsItem}>
                    <Ionicons name="notifications" size={28} color="#6B7280" />
                    <View style={styles.settingsText}>
                      <Text style={styles.settingsLabel}>Notifications</Text>
                    </View>
                    <Switch
                      value={notifications.checkInReminders}
                      onValueChange={val => setNotifications(n => ({ ...n, checkInReminders: val }))}
                      trackColor={{ false: '#767577', true: '#3B82F6' }}
                      thumbColor={notifications.checkInReminders ? '#fff' : '#f4f3f4'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleHelpSupport} style={styles.settingsItem}>
                    <Ionicons name="help-circle" size={28} color="#6B7280" />
                    <View style={styles.settingsText}>
                      <Text style={styles.settingsLabel}>Help & Support</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleTermsPrivacy} style={styles.settingsItem}>
                    <Ionicons name="document-text" size={28} color="#6B7280" />
                    <View style={styles.settingsText}>
                      <Text style={styles.settingsLabel}>Terms & Privacy</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleHelpSupport} style={styles.contactSupportButton}>
                  <Ionicons name="headset" size={24} color="#EF4444" />
                  <Text style={styles.contactSupportButtonText}>Contact Support</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
          {/* 5. SIGN OUT BUTTON */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.signOutSection}>
            <Pressable onPress={handleSignOut} style={styles.signOutButton}>
              <View style={styles.signOutButtonContent}>
                <Ionicons name="log-out" size={24} color="#EF4444" />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </View>
              <Text style={styles.signOutSubtext}>You will need to sign in again to access the app</Text>
            </Pressable>
          </Animated.View>
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        {/* Notifications Modal */}
        <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 32, width: 340, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#fff' }}>Permissions</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#23232b', borderRadius: 12, padding: 20, width: '100%', marginBottom: 32 }}>
                <Ionicons name="notifications" size={36} color="#fff" style={{ marginRight: 20 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Notifications</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 16 }}>Stay in the loop</Text>
                </View>
                <Switch
                  value={notifications.checkInReminders}
                  onValueChange={val => setNotifications(n => ({ ...n, checkInReminders: val }))}
                  trackColor={{ false: '#767577', true: '#3B82F6' }}
                  thumbColor={notifications.checkInReminders ? '#fff' : '#f4f3f4'}
                />
              </View>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={{ backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Help & Support Modal */}
        <Modal visible={showHelp} transparent animationType="slide" onRequestClose={() => setShowHelp(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: 320, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#4f46e5' }}>Help & Support</Text>
              <Text style={{ fontSize: 16, color: '#333', marginBottom: 24 }}>For support, email <Text style={{ color: '#4f46e5' }} onPress={() => Linking.openURL('mailto:andy@vimly.ai')}>andy@vimly.ai</Text></Text>
              <TouchableOpacity onPress={() => setShowHelp(false)} style={{ backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Terms & Privacy Modal */}
        <Modal visible={showTerms} transparent animationType="slide" onRequestClose={() => setShowTerms(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: 320, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#4f46e5' }}>Terms & Privacy</Text>
              <Text style={{ fontSize: 16, color: '#333', marginBottom: 24 }}>Terms and privacy policy coming soon.</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)} style={{ backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Show profile for existing employee
  if (currentUser?.role === 'employee' && currentEmployee) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.centered}>
            <Animated.View style={styles.heroGlassCard}>
              {/* Hero card content */}
              <LinearGradient
                colors={['#23232b', '#3B82F6', '#b87333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGlassCard}
              >
                <View style={[
                  styles.heroContentRow,
                  isMobile ? { flexDirection: 'column', alignItems: 'center' } : {}
                ]}>
                  <View style={[
                    styles.heroAvatarOuter,
                    isMobile ? { width: 64, height: 64, borderRadius: 32, marginRight: 0, marginBottom: 12, padding: 3 } : isTablet ? { width: 80, height: 80, borderRadius: 40, marginRight: 24, padding: 4 } : {}
                  ]}>
                    <View style={[
                      styles.heroAvatarInner,
                      isMobile ? { width: 54, height: 54, borderRadius: 27 } : isTablet ? { width: 70, height: 70, borderRadius: 35 } : {}
                    ]}>
                      <Text style={[
                        styles.heroAvatarText,
                        isMobile ? { fontSize: 24 } : isTablet ? { fontSize: 32 } : {}
                      ]}>
                        {(currentEmployee?.name || currentUser?.name || '').split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.heroDetails}>
                    <Text style={[styles.heroName, isMobile ? { fontSize: 20 } : isTablet ? { fontSize: 26 } : {}]}>{currentEmployee?.name || currentUser?.name}</Text>
                    <Text style={[styles.heroEmail, isMobile ? { fontSize: 13 } : isTablet ? { fontSize: 16 } : {}]}>{currentEmployee?.email || currentUser?.email}</Text>
                    <View style={styles.heroRoleRow}>
                      <View style={[styles.heroRoleBadge, isMobile ? { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 } : isTablet ? { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 3 } : {}]}>
                        <Text style={[styles.heroRoleBadgeText, isMobile ? { fontSize: 11 } : isTablet ? { fontSize: 13 } : {}]}>{currentUser?.role || 'Employee'}</Text>
                      </View>
                      {currentUser?.department ? (
                        <Text style={[styles.heroDepartment, isMobile ? { fontSize: 12 } : isTablet ? { fontSize: 15 } : {}]}>{currentUser.department}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.heroMemberSince, isMobile ? { fontSize: 11 } : isTablet ? { fontSize: 13 } : {}]}>
                      Member since {format(parseISO(currentEmployee?.checkIns[0]?.timestamp || currentUser?.createdAt || new Date().toISOString()), 'MMM yyyy')}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
            <View style={styles.statsGlassContainer}>
              {/* Stats Overview - Only show for employees with data */}
              <Text style={styles.sectionTitle}>Statistics</Text>
              <View style={[
                styles.statsGridResponsive,
                isMobile ? { flexDirection: 'column', gap: 18 } : isTablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: 24 } : { flexDirection: 'row', flexWrap: 'wrap', gap: 32 }
              ]}>
                <View style={styles.statsCard}>
                  <View style={styles.statsIconCircle}>
                    <Ionicons name="diamond" size={48} color="#3B82F6" />
                  </View>
                  <Text style={styles.statsValueLarge}>{currentEmployee.totalPoints}</Text>
                  <Text style={styles.statsLabel}>Total Points</Text>
                </View>
                <View style={styles.statsCard}>
                  <View style={styles.statsIconCircle}>
                    <Ionicons name="flame" size={48} color="#F59E0B" />
                  </View>
                  <Text style={styles.statsValueLarge}>{currentEmployee.currentStreak} days</Text>
                  <Text style={styles.statsLabel}>Current Streak</Text>
                </View>
                <View style={styles.statsCard}>
                  <View style={styles.statsIconCircle}>
                    <Ionicons name="trophy" size={48} color="#10B981" />
                  </View>
                  <Text style={styles.statsValueLarge}>{currentEmployee.longestStreak} days</Text>
                  <Text style={styles.statsLabel}>Longest Streak</Text>
                </View>
                <View style={styles.statsCard}>
                  <View style={styles.statsIconCircle}>
                    <Ionicons name="calendar" size={48} color="#8B5CF6" />
                  </View>
                  <Text style={styles.statsValueLarge}>{currentEmployee.checkIns.length}</Text>
                  <Text style={styles.statsLabel}>Total Check-ins</Text>
                </View>
              </View>
            </View>
            {/* BADGES SECTION */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.badgesSection}>
              <View style={[
                styles.badgesGlassContainer,
                isMobile ? { maxWidth: '100%', padding: 12 } : isTablet ? { maxWidth: '98%', padding: 24 } : { maxWidth: 1100, padding: 40 }
              ]}>
                <Text style={styles.sectionTitle}>Badges ({currentEmployee.badges.length})</Text>
                <View style={[
                  styles.badgesGridResponsive,
                  isMobile ? { flexDirection: 'column', gap: 16 } : {}
                ]}>
                  {currentEmployee.badges.map((badge) => (
                    <View key={badge.id} style={[
                      styles.cardBase,
                      styles.badgeItemUpgraded,
                      isMobile ? { width: '100%' } : {}
                    ]}>
                      <View style={[styles.badgeIconContainerUpgraded, { backgroundColor: badge.color }]}> 
                        <Ionicons name={badge.icon as any} size={32} color="white" style={styles.badgeIconGlow} />
                      </View>
                      <Text style={styles.badgeNameUpgraded}>{badge.name}</Text>
                      {badge.unlockedAt ? (
                        <Text style={styles.badgeUnlockDateUpgraded}>{format(parseISO(badge.unlockedAt), 'MMM d')}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
            {/* RECENT REWARDS SECTION */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.recentRewardsSection}>
              <View style={[
                styles.rewardsGlassContainer,
                isMobile ? { maxWidth: '100%', padding: 12 } : isTablet ? { maxWidth: '98%', padding: 24 } : { maxWidth: 1100, padding: 40 }
              ]}>
                <Text style={styles.sectionTitle}>Recent Rewards</Text>
                <View style={[styles.rewardsListUpgraded, isMobile ? { flexDirection: 'column', gap: 16 } : { flexDirection: 'row', gap: 32 }]}>
                  {currentEmployee.rewardsRedeemed.slice(-4).map((reward) => (
                    <View key={reward.id} style={[styles.cardBase, styles.rewardItemUpgraded, isMobile ? { width: '100%' } : {}]}>
                      <View style={styles.rewardDetailsUpgraded}>
                        <Text style={styles.rewardNameUpgraded}>{reward.rewardName}</Text>
                        <Text style={styles.rewardDateUpgraded}>{format(parseISO(reward.redeemedAt), 'MMM d, yyyy')}</Text>
                      </View>
                      <View style={styles.rewardActionsUpgraded}>
                        <Text style={styles.rewardPointsUpgraded}>-{reward.pointsCost} pts</Text>
                        <Text style={styles.rewardStatusUpgraded}>{reward.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
            {/* SETTINGS SECTION */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.settingsSection}>
              <View style={[
                styles.settingsGlassContainer,
                isMobile ? { maxWidth: '100%', padding: 12 } : isTablet ? { maxWidth: '98%', padding: 24 } : { maxWidth: 1100, padding: 40 }
              ]}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={[styles.settingsListUpgraded, { flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 32 }]}>
                  <TouchableOpacity onPress={openNotifications} style={[styles.cardBase, styles.settingsItemUpgraded, isMobile ? { width: '100%' } : {}]}>
                    <Ionicons name="notifications" size={32} color="#b87333" style={{ marginBottom: 12 }} />
                    <Text style={styles.settingsLabel}>Notifications</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openHelp} style={[styles.cardBase, styles.settingsItemUpgraded, isMobile ? { width: '100%' } : {}]}>
                    <Ionicons name="help-circle" size={32} color="#f59e42" style={{ marginBottom: 12 }} />
                    <Text style={styles.settingsLabel}>Help & Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openTerms} style={[styles.cardBase, styles.settingsItemUpgraded, isMobile ? { width: '100%' } : {}]}>
                    <Ionicons name="document-text" size={32} color="#3B82F6" style={{ marginBottom: 12 }} />
                    <Text style={styles.settingsLabel}>Terms & Privacy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleContactSupport} style={[styles.cardBase, styles.settingsItemUpgraded, isMobile ? { width: '100%' } : {}]}>
                    <Ionicons name="headset" size={32} color="#b87333" style={{ marginBottom: 12 }} />
                    <Text style={styles.settingsLabel}>Contact Support</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
            {/* Sign Out Button */}
            <Animated.View entering={FadeInDown.delay(600)} style={styles.signOutSection}>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                <View style={styles.signOutButtonContent}>
                  <Ionicons name="log-out" size={24} color="#EF4444" />
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </View>
                <Text style={styles.signOutSubtext}>You will need to sign in again to access the app</Text>
              </TouchableOpacity>
            </Animated.View>
            {/* Bottom padding */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
        {/* Modals for Notifications, Help, and Terms (EMPLOYEE) */}
        <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 32, width: 340, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#fff' }}>Permissions</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#23232b', borderRadius: 12, padding: 20, width: '100%', marginBottom: 32 }}>
                <Ionicons name="notifications" size={36} color="#fff" style={{ marginRight: 20 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Notifications</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 16 }}>Stay in the loop</Text>
                </View>
                <Switch
                  value={notifications.checkInReminders}
                  onValueChange={val => setNotifications(n => ({ ...n, checkInReminders: val }))}
                  trackColor={{ false: '#767577', true: '#3B82F6' }}
                  thumbColor={notifications.checkInReminders ? '#fff' : '#f4f3f4'}
                />
              </View>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={{ backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={showHelp} transparent animationType="slide" onRequestClose={() => setShowHelp(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: 320, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#4f46e5' }}>Help & Support</Text>
              <Text style={{ fontSize: 16, color: '#333', marginBottom: 24 }}>For support, email <Text style={{ color: '#4f46e5' }} onPress={() => Linking.openURL('mailto:andy@vimly.ai')}>andy@vimly.ai</Text></Text>
              <TouchableOpacity onPress={() => setShowHelp(false)} style={{ backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={showTerms} transparent animationType="slide" onRequestClose={() => setShowTerms(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: 320, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#4f46e5' }}>Terms & Privacy</Text>
              <Text style={{ fontSize: 16, color: '#333', marginBottom: 24 }}>Terms and privacy policy coming soon.</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)} style={{ backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return null;
};

const GlowOverlay = () => (
  <View
    pointerEvents="none"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      borderRadius: 0,
      // For web, add a strong boxShadow for extra glow
      ...(Platform.OS === 'web' ? {
        boxShadow: '0 0 80px 16px #fff8, 0 0 160px 32px #f59e42cc',
      } : {}),
    }}
  >
    <LinearGradient
      colors={["#fff8", "#f59e42cc", "#18181b00"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        flex: 1,
        borderRadius: 0,
        opacity: 0.7,
      }}
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 80,
  },
  centered: {
    alignItems: 'center',
    width: '100%',
  },
  glassCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: '#333',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subHeading: {
    fontSize: 18,
    color: '#dbeafe',
    marginBottom: 24,
    textShadowColor: '#333',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  whiteCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 0,
    boxShadow: '0 2px 12px rgba(79,70,229,0.08)',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e42',
    marginBottom: 18,
    marginTop: 8,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#23232b',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  getStartedButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  getStartedButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  howItWorksList: {
    marginTop: 24,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  howItWorksIcon: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  howItWorksText: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  howItWorksDescription: {
    fontSize: 16,
    color: '#dbeafe',
  },
  statsOverview: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    marginTop: 12,
  },
  statsItem: {
    flexGrow: 1,
    minWidth: 180,
    maxWidth: 340,
    minHeight: 110,
    backgroundColor: 'rgba(59,130,246,0.22)',
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#b87333',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 18,
    shadowColor: '#b87333',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  statsIcon: {
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  statsText: {
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 18,
    color: '#dbeafe',
    marginBottom: 6,
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff', // ensure white text for visibility
    textShadowColor: '#0008',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgesSection: {
    marginTop: 48,
    marginBottom: 32,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%', // Two items per row
    marginBottom: 20,
  },
  badgeIconContainer: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  badgeUnlockDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  recentRewardsSection: {
    marginBottom: 32,
  },
  rewardsList: {
    marginTop: 24,
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rewardDetails: {
    flex: 1,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  rewardDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  rewardActions: {
    alignItems: 'flex-end',
  },
  rewardPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  rewardStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 90,
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsList: {
    marginTop: 24,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  settingsIcon: {
    marginRight: 16,
  },
  settingsText: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  signOutSection: {
    marginTop: 32,
  },
  signOutButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    borderColor: '#f59e42',
    borderWidth: 2,
    shadowColor: '#f59e42',
    shadowOpacity: 0.7,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    boxShadow: '0 0 32px 8px #f59e42, 0 0 64px 16px #f59e42aa', // for web
  },
  signOutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  signOutSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  headerGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  headerAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDetails: {
    flex: 1,
  },
  headerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 16,
    color: '#dbeafe',
    marginBottom: 8,
  },
  headerRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRoleBadge: {
    backgroundColor: '#f59e42',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 8,
  },
  headerRoleBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerDepartment: {
    fontSize: 16,
    color: '#dbeafe',
  },
  headerMemberSince: {
    fontSize: 14,
    color: '#f59e42',
    marginTop: 2,
  },
  bottomPadding: {
    height: 80,
  },
  // New styles for admin profile
  heroGlassCard: {
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#b87333',
    marginBottom: 48,
    padding: 56,
    shadowColor: '#b87333',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    alignItems: 'center',
    backgroundColor: 'rgba(36,40,60,0.98)',
    minWidth: 480,
    maxWidth: 1100,
    width: '100%',
    minHeight: 320,
    alignSelf: 'center',
    zIndex: 3,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  heroAvatarOuter: {
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#3B82F6',
    padding: 8,
    marginRight: 48,
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.2,
  },
  heroDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  heroEmail: {
    fontSize: 24,
    color: '#dbeafe',
    marginBottom: 16,
  },
  heroRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroRoleBadge: {
    backgroundColor: '#b87333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 10,
  },
  heroRoleBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  heroDepartment: {
    fontSize: 22,
    color: '#fff', // or '#e0e7ff' for very light blue
    fontWeight: 'bold',
    textShadowColor: '#000a',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
},
  heroMemberSince: {
    fontSize: 16,
    color: '#f59e42',
    marginTop: 6,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroStatLabel: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  quickActionsGlassCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  quickActionsGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  quickActionsContent: {
    alignItems: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  quickActionItem: {
    width: '48%', // Two items per row
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textShadowColor: '#333',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recentActivityGlassCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  recentActivityGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  recentActivityContent: {
    alignItems: 'center',
  },
  recentActivityList: {
    width: '100%',
    marginTop: 24,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  recentActivityText: {
    marginLeft: 16,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  recentActivityDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  recentActivityEmpty: {
    alignItems: 'center',
    marginTop: 30,
  },
  recentActivityEmptyText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  settingsGlassCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  settingsGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0,
    boxShadow: '0 4px 24px rgba(79,70,229,0.15)',
  },
  settingsContent: {
    alignItems: 'center',
  },
  contactSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
    borderWidth: 0,
    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15)',
  },
  contactSupportButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  // New styles for stats section
  statsGlassContainer: {
    backgroundColor: 'rgba(24,24,27,0.92)',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#b87333',
    padding: 32, // was 40
    marginTop: 0, // ensure no negative marginTop
    shadowColor: '#b87333',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    alignItems: 'center',
    width: '96%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  statsGridResponsive: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    gap: 32,
  },
  statsItemResponsive: {
    backgroundColor: 'rgba(59,130,246,0.22)',
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#b87333',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 18,
    shadowColor: '#b87333',
    shadowOpacity: Platform.OS === 'web' ? 0.12 : 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cardBase: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#f59e42',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 18,
    shadowColor: '#b87333',
    shadowOpacity: Platform.OS === 'web' ? 0.10 : 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  badgeItemUpgraded: {
    width: 240,
    margin: 16,
  },
  rewardItemUpgraded: {
    minWidth: 260,
    maxWidth: 320,
    width: '30%',
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  settingsItemUpgraded: {
    minWidth: 160,
    maxWidth: 220,
    minHeight: 110,
    flex: 1,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    backgroundColor: '#232b3b',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f59e42',
    width: 240,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginHorizontal: 0,
    shadowColor: '#b87333',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  statsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59,130,246,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgeIconContainerUpgraded: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59,130,246,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgeIconGlow: {
    textShadowColor: '#3B82F6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  badgeNameUpgraded: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  badgeUnlockDateUpgraded: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  rewardsGlassContainer: {
    backgroundColor: 'rgba(24,24,27,0.92)',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#b87333',
    padding: 32, // was 40
    marginTop: 0, // ensure no negative marginTop
    shadowColor: '#b87333',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    alignItems: 'center',
    width: '96%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  rewardsListUpgraded: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    gap: 32,
  },
  rewardDetailsUpgraded: {
    flex: 1,
  },
  rewardNameUpgraded: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  rewardDateUpgraded: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  rewardActionsUpgraded: {
    alignItems: 'flex-end',
  },
  rewardPointsUpgraded: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  rewardStatusUpgraded: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 90,
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rewardStatusInsufficientUpgraded: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b91c1c',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 90,
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  settingsGlassContainer: {
    backgroundColor: 'rgba(24,24,27,0.92)',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#b87333',
    padding: 32, // was 40
    marginTop: 0, // ensure no negative marginTop
    shadowColor: '#b87333',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    alignItems: 'center',
    width: '96%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  settingsListUpgraded: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    gap: 32,
  },
  badgesGlassContainer: {
    backgroundColor: 'rgba(24,24,27,0.92)',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#f59e42',
    padding: 32,
    marginTop: 0,
    marginBottom: 48,
    shadowColor: '#b87333',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    alignItems: 'center',
    width: '96%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  badgesGridResponsive: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    gap: 32,
  },
  statsValueLarge: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff', // ensure white text for visibility
    textShadowColor: '#0008',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: 4,
  },
});
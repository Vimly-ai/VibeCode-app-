import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../state/authStore';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signIn, forgotPassword, resetPassword, autoSignIn, savedCredentials } = useAuthStore();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < 600;
  const isTablet = windowWidth >= 600 && windowWidth < 1000;
  const isDesktop = windowWidth >= 1000;

  // Responsive style helpers
  const cardMaxWidth = isMobile ? '100%' : isTablet ? 420 : 480;
  const cardPadding = isMobile ? 8 : isTablet ? 16 : 20;
  const headingFontSize = isMobile ? 20 : isTablet ? 24 : 28;
  const subtitleFontSize = isMobile ? 12 : isTablet ? 14 : 16;
  const sectionGap = isMobile ? 8 : isTablet ? 12 : 16;
  const infoSectionFontSize = isMobile ? 11 : isTablet ? 12 : 13;
  const infoSectionTitleSize = isMobile ? 13 : isTablet ? 14 : 16;
  const demoButtonFontSize = isMobile ? 12 : isTablet ? 13 : 14;
  const iconSize = isMobile ? 32 : isTablet ? 36 : 40;
  const iconContainerSize = isMobile ? 40 : isTablet ? 48 : 56;

  // Auto-fill saved credentials
  React.useEffect(() => {
    if (savedCredentials && savedCredentials.rememberMe) {
      setEmail(savedCredentials.email);
      setRememberMe(true);
      // Try auto sign-in
      autoSignIn();
    }
  }, [savedCredentials, autoSignIn]);



  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email.trim(), name.trim(), password);
      } else {
        result = await signIn(email.trim(), password, rememberMe);
      }

      if (result.success) {
        Alert.alert('Success', result.message);
        if (isSignUp) {
          setIsSignUp(false);
          setEmail('');
          setName('');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email.trim());
      if (result.success) {
        Alert.alert('Reset Code Sent', result.message, [
          { text: 'OK', onPress: () => setShowResetPassword(true) }
        ]);
        setShowForgotPassword(false);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email.trim(), resetToken.trim(), newPassword);
      if (result.success) {
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => {
            setShowResetPassword(false);
            setResetToken('');
            setNewPassword('');
          }}
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn('admin@demo.com', 'admin123');
      if (!result.success) {
        Alert.alert('Login Failed', `Error: ${result.message}`);
      } else {
        Alert.alert('Success', 'Admin login successful!');
      }
    } catch (error) {
      Alert.alert('Error', `Login error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleEmployeeLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn('sarah.johnson@gmail.com', 'demo123');
      if (!result.success) {
        Alert.alert('Login Failed', `Error: ${result.message}`);
      } else {
        Alert.alert('Success', 'Employee login successful!');
      }
    } catch (error) {
      Alert.alert('Error', `Login error: ${error.message}`);
    }
    setLoading(false);
  };



  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#18181b', flex: 1 }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: isMobile ? 4 : 12, backgroundColor: '#18181b', maxHeight: windowHeight, minHeight: 0 }}>
        <View style={{
          width: '100%',
          maxWidth: cardMaxWidth,
          padding: cardPadding,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.13)',
          borderWidth: 2,
          borderColor: '#b87333',
          boxShadow: isDesktop ? '0 4px 32px 0 #b8733311, 0 1px 0 #fff2' : '0 2px 12px #b8733308',
          marginBottom: 0,
          marginTop: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexShrink: 1,
          minHeight: 0,
        }}>
          <View style={{ alignItems: 'center', marginBottom: sectionGap }}>
            <View style={{ width: iconContainerSize, height: iconContainerSize, backgroundColor: '#2563eb', borderRadius: iconContainerSize / 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Ionicons name="business" size={iconSize} color="white" />
            </View>
            <Text style={{ fontSize: headingFontSize, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 2 }}>
              {isSignUp ? 'Join RewardSpace' : 'Welcome Back'}
            </Text>
            <Text style={{ color: '#dbeafe', textAlign: 'center', fontSize: subtitleFontSize, marginBottom: 2 }}>
              {isSignUp
                ? 'Create your account to start earning rewards'
                : 'Sign in to track your progress and earn rewards'
              }
            </Text>
          </View>
          {/* Form */}
          <View style={{ backgroundColor: isMobile ? '#fff' : 'rgba(255,255,255,0.92)', borderRadius: 12, padding: cardPadding, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, marginBottom: sectionGap, flexShrink: 1, minHeight: 0 }}>
            <View style={{ gap: 10 }}>
              {/* Email Input */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 6 }}>Email Address</Text>
                <View style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="mail" size={20} color="#9CA3AF" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ flex: 1, marginLeft: 12, color: '#111827' }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              {/* Name Input (Sign Up Only) */}
              {isSignUp && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 6 }}>Full Name</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="person" size={20} color="#9CA3AF" />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      style={{ flex: 1, marginLeft: 12, color: '#111827' }}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              )}
              {/* Password Input */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 6 }}>Password</Text>
                <View style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, marginLeft: 12, color: '#111827' }}
                    placeholderTextColor="#9CA3AF"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
              </View>
              {/* Confirm Password Input (Sign Up Only) */}
              {isSignUp && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 6 }}>Confirm Password</Text>
                  <View style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      secureTextEntry={!showPassword}
                      style={{ flex: 1, marginLeft: 12, color: '#111827' }}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              )}
              {/* Remember Me (Sign In Only) */}
              {!isSignUp && (
                <Pressable
                  onPress={() => setRememberMe(!rememberMe)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: rememberMe ? '#2563eb' : '#d1d5db',
                    backgroundColor: rememberMe ? '#2563eb' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={{ color: '#374151', fontSize: 14 }}>Remember me</Text>
                </Pressable>
              )}
              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  padding: 14,
                  alignItems: 'center',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                  {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              </Pressable>
              {/* Forgot Password Link (Sign In Only) */}
              {!isSignUp && (
                <Pressable
                  onPress={() => setShowForgotPassword(true)}
                  style={{ marginTop: 10 }}
                >
                  <Text style={{ color: '#2563eb', textAlign: 'center' }}>Forgot Password?</Text>
                </Pressable>
              )}
              {/* Toggle Sign Up/Sign In */}
              <Pressable
                onPress={() => setIsSignUp(!isSignUp)}
                style={{ marginTop: 10 }}
              >
                <Text style={{ color: '#2563eb', textAlign: 'center' }}>
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"
                  }
                </Text>
              </Pressable>
            </View>
          </View>
          {/* Demo Login */}
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: cardPadding, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, marginBottom: sectionGap, flexShrink: 1, minHeight: 0 }}>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="construct" size={isMobile ? 20 : 24} color="#F59E0B" />
              <Text style={{ color: '#111827', fontSize: infoSectionTitleSize, fontWeight: 'bold', marginTop: 6, marginBottom: 2 }}>Demo Access</Text>
              <Text style={{ color: '#6b7280', fontSize: infoSectionFontSize, textAlign: 'center' }}>
                Try the app with demo data
              </Text>
            </View>
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
              <Pressable
                onPress={handleDemoLogin}
                disabled={loading}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  marginBottom: isMobile ? 6 : 0,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: demoButtonFontSize }}>
                  {loading ? 'Loading...' : 'Admin Login'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleEmployeeLogin}
                disabled={loading}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: demoButtonFontSize }}>
                  {loading ? 'Loading...' : 'Employee Login'}
                </Text>
              </Pressable>
            </View>
          </View>
          {/* Info Section */}
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: cardPadding, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, marginBottom: 0, flexShrink: 1, minHeight: 0 }}>
            <Text style={{ color: '#111827', fontSize: infoSectionTitleSize, fontWeight: 'bold', marginBottom: 10 }}>
              🔐 Secure Access
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={isMobile ? 16 : 20} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#111827', fontSize: infoSectionFontSize, fontWeight: 'bold' }}>Valid Email Required</Text>
                  <Text style={{ color: '#6b7280', fontSize: isMobile ? 11 : 12 }}>
                    Use any valid email address to create your account
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="person-add" size={isMobile ? 16 : 20} color="#3B82F6" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#111827', fontSize: infoSectionFontSize, fontWeight: 'bold' }}>Admin Approval</Text>
                  <Text style={{ color: '#6b7280', fontSize: isMobile ? 11 : 12 }}>
                    New accounts require administrator approval before access
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="analytics" size={isMobile ? 16 : 20} color="#8B5CF6" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#111827', fontSize: infoSectionFontSize, fontWeight: 'bold' }}>Track Progress</Text>
                  <Text style={{ color: '#6b7280', fontSize: isMobile ? 11 : 12 }}>
                    Earn points, compete with colleagues, and redeem rewards
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotPassword} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your email address and we'll send you a reset code.
            </Text>

            <View style={styles.modalInputGroup}>
              <Ionicons name="mail" size={20} color="#9CA3AF" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.modalInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalButtonGroup}>
              <Pressable
                onPress={() => setShowForgotPassword(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleForgotPassword}
                disabled={loading}
                style={[styles.modalSendCodeButton, loading ? styles.modalSendCodeButtonDisabled : styles.modalSendCodeButtonEnabled]}
              >
                <Text style={styles.modalSendCodeButtonText}>
                  {loading ? 'Sending...' : 'Send Code'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={showResetPassword} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter the reset code and your new password.
            </Text>

            <View style={styles.modalInputGroup}>
              <Ionicons name="key" size={20} color="#9CA3AF" />
              <TextInput
                value={resetToken}
                onChangeText={setResetToken}
                placeholder="Enter reset code"
                style={styles.modalInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password (min 6 characters)"
                secureTextEntry={true}
                style={styles.modalInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalButtonGroup}>
              <Pressable
                onPress={() => setShowResetPassword(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                style={[styles.modalResetPasswordButton, loading ? styles.modalResetPasswordButtonDisabled : styles.modalResetPasswordButtonEnabled]}
              >
                <Text style={styles.modalResetPasswordButtonText}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  glassCard: { width: '100%', maxWidth: 480, padding: 32, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: '#b87333', shadowColor: '#b87333', shadowOpacity: 0.25, shadowRadius: 8, marginBottom: 16 },
  heading: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#b87333', fontFamily: 'copperplate', },
  scrollView: { flex: 1 },
  headerSection: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 },
  headerAnimated: { alignItems: 'center', marginBottom: 48 },
  headerIconContainer: { width: 96, height: 96, backgroundColor: '#2563eb', borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  headerSubtitle: { color: '#6b7280', textAlign: 'center', marginTop: 8, fontSize: 18 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 24 },
  formSection: { gap: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#374151', fontWeight: '500', marginBottom: 8 },
  inputContainer: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, marginLeft: 12, color: '#111827' },
  eyeButton: { padding: 4 },
  submitButton: { marginTop: 24, borderRadius: 16, padding: 16, alignItems: 'center' },
  submitButtonEnabled: { backgroundColor: '#2563eb' },
  submitButtonDisabled: { backgroundColor: '#9ca3af' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  linkButton: { marginTop: 16 },
  linkText: { color: '#2563eb', textAlign: 'center' },
  rememberMeCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rememberMeChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  rememberMeUnchecked: {
    borderColor: '#d1d5db',
  },
  rememberMeText: {
    color: '#374151',
    fontSize: 14,
  },
  demoLoginCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 24 },
  demoLoginHeader: { alignItems: 'center', marginBottom: 16 },
  demoLoginTitle: { color: '#111827', fontSize: 18, fontWeight: 'semibold', marginTop: 8, marginBottom: 4 },
  demoLoginSubtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  demoLoginButtons: { flexDirection: 'row', gap: 12 },
  demoLoginButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoLoginButtonEnabled: { backgroundColor: '#2563eb' },
  demoLoginButtonDisabled: { backgroundColor: '#9ca3af' },
  demoLoginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoSection: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 24 },
  infoSectionTitle: { color: '#111827', fontSize: 18, fontWeight: 'semibold', marginBottom: 16 },
  infoSectionContent: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoItemTextContainer: { flex: 1, marginLeft: 12 },
  infoItemTitle: { color: '#111827', fontSize: 14, fontWeight: 'medium' },
  infoItemSubtitle: { color: '#6b7280', fontSize: 12 },
  demoCredentialsCard: { backgroundColor: '#f0f9eb', borderRadius: 16, padding: 24, marginBottom: 24 },
  demoCredentialsTitle: { color: '#22c55e', fontSize: 16, fontWeight: 'semibold', marginBottom: 8 },
  demoCredentialsText: { color: '#16a34a', fontSize: 14 },
  bottomPadding: { height: 80 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  modalSubtitle: { color: '#6b7280', marginBottom: 24 },
  modalInputGroup: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalInput: {
    flex: 1,
    marginLeft: 12,
    color: '#111827',
    fontSize: 14,
  },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: { color: '#374151', fontWeight: 'semibold', fontSize: 16 },
  modalSendCodeButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSendCodeButtonEnabled: { backgroundColor: '#2563eb' },
  modalSendCodeButtonDisabled: { backgroundColor: '#9ca3af' },
  modalSendCodeButtonText: { color: '#fff', fontWeight: 'semibold', fontSize: 16 },
  modalResetPasswordButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalResetPasswordButtonEnabled: { backgroundColor: '#2563eb' },
  modalResetPasswordButtonDisabled: { backgroundColor: '#9ca3af' },
  modalResetPasswordButtonText: { color: '#fff', fontWeight: 'semibold', fontSize: 16 },
});
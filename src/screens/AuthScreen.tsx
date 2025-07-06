import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../state/authStore';
import { cn } from '../utils/cn';

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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12">
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-12">
            <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-6">
              <Ionicons name="business" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">
              {isSignUp ? 'Join RewardSpace' : 'Welcome Back'}
            </Text>
            <Text className="text-gray-600 text-center mt-2 text-lg">
              {isSignUp 
                ? 'Create your account to start earning rewards'
                : 'Sign in to track your progress and earn rewards'
              }
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200)} className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="space-y-4">
              {/* Email Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                  <Ionicons name="mail" size={20} color="#9CA3AF" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Name Input (Sign Up Only) */}
              {isSignUp && (
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
                  <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                    <Ionicons name="person" size={20} color="#9CA3AF" />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      className="flex-1 ml-3 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              )}

              {/* Password Input */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Password</Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                  <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                    secureTextEntry={!showPassword}
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
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
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Confirm Password</Text>
                  <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                    <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      secureTextEntry={!showPassword}
                      className="flex-1 ml-3 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              )}

              {/* Remember Me (Sign In Only) */}
              {!isSignUp && (
                <Pressable
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center"
                >
                  <View className={cn(
                    "w-5 h-5 rounded border-2 items-center justify-center mr-3",
                    rememberMe ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  )}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text className="text-gray-700">Remember me</Text>
                </Pressable>
              )}
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={cn(
                "mt-6 rounded-xl p-4",
                loading ? "bg-gray-400" : "bg-blue-600"
              )}
            >
              <Text className="text-white font-semibold text-center text-lg">
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            </Pressable>

            {/* Forgot Password Link (Sign In Only) */}
            {!isSignUp && (
              <Pressable
                onPress={() => setShowForgotPassword(true)}
                className="mt-4"
              >
                <Text className="text-blue-600 text-center">Forgot Password?</Text>
              </Pressable>
            )}

            {/* Toggle Sign Up/Sign In */}
            <Pressable
              onPress={() => setIsSignUp(!isSignUp)}
              className="mt-4"
            >
              <Text className="text-blue-600 text-center">
                {isSignUp 
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </Pressable>
          </Animated.View>

          {/* Demo Login */}
          <Animated.View entering={FadeInDown.delay(300)} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <View className="items-center">
              <Ionicons name="construct" size={24} color="#F59E0B" />
              <Text className="text-yellow-800 font-semibold mt-2 mb-1">Demo Access</Text>
              <Text className="text-yellow-700 text-sm text-center mb-4">
                Try the app with demo data
              </Text>
              <View className="flex-row space-x-3">
                <Pressable
                  onPress={handleDemoLogin}
                  disabled={loading}
                  className="bg-yellow-600 px-4 py-3 rounded-full flex-1"
                >
                  <Text className="text-white font-semibold text-center">
                    {loading ? 'Loading...' : 'Admin Login'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleEmployeeLogin}
                  disabled={loading}
                  className="bg-blue-600 px-4 py-3 rounded-full flex-1"
                >
                  <Text className="text-white font-semibold text-center">
                    {loading ? 'Loading...' : 'Employee Login'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Info Section */}
          <Animated.View entering={FadeInDown.delay(400)} className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              🔐 Secure Access
            </Text>
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <View className="flex-1 ml-3">
                  <Text className="font-medium text-gray-900">Valid Email Required</Text>
                  <Text className="text-gray-600 text-sm">
                    Use any valid email address to create your account
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Ionicons name="person-add" size={20} color="#3B82F6" />
                <View className="flex-1 ml-3">
                  <Text className="font-medium text-gray-900">Admin Approval</Text>
                  <Text className="text-gray-600 text-sm">
                    New accounts require administrator approval before access
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Ionicons name="analytics" size={20} color="#8B5CF6" />
                <View className="flex-1 ml-3">
                  <Text className="font-medium text-gray-900">Track Progress</Text>
                  <Text className="text-gray-600 text-sm">
                    Earn points, compete with colleagues, and redeem rewards
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Demo Credentials Info */}
          <Animated.View entering={FadeInDown.delay(500)} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <Text className="text-blue-800 font-semibold mb-2">Demo Credentials:</Text>
            <Text className="text-blue-700 text-sm">
              • Admin: admin@demo.com / admin123{'\n'}
              • Employee: sarah.johnson@gmail.com / demo123{'\n'}
              • Employee: mike.chen@yahoo.com / demo123{'\n'}
              • Employee: jane.smith@company.com / demo123
            </Text>
          </Animated.View>

          {/* Bottom padding */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotPassword} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-4">Forgot Password</Text>
            <Text className="text-gray-600 mb-4">
              Enter your email address and we'll send you a reset code.
            </Text>
            
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center mb-6">
              <Ionicons name="mail" size={20} color="#9CA3AF" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 ml-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View className="flex-row space-x-3">
              <Pressable
                onPress={() => setShowForgotPassword(false)}
                className="flex-1 bg-gray-200 py-3 rounded-full"
              >
                <Text className="text-gray-800 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleForgotPassword}
                disabled={loading}
                className={cn(
                  "flex-1 py-3 rounded-full",
                  loading ? "bg-gray-400" : "bg-blue-600"
                )}
              >
                <Text className="text-white text-center font-semibold">
                  {loading ? 'Sending...' : 'Send Code'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={showResetPassword} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-4">Reset Password</Text>
            <Text className="text-gray-600 mb-4">
              Enter the reset code and your new password.
            </Text>
            
            <View className="space-y-4 mb-6">
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                <Ionicons name="key" size={20} color="#9CA3AF" />
                <TextInput
                  value={resetToken}
                  onChangeText={setResetToken}
                  placeholder="Enter reset code"
                  className="flex-1 ml-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (min 6 characters)"
                  secureTextEntry={true}
                  className="flex-1 ml-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            
            <View className="flex-row space-x-3">
              <Pressable
                onPress={() => setShowResetPassword(false)}
                className="flex-1 bg-gray-200 py-3 rounded-full"
              >
                <Text className="text-gray-800 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                className={cn(
                  "flex-1 py-3 rounded-full",
                  loading ? "bg-gray-400" : "bg-blue-600"
                )}
              >
                <Text className="text-white text-center font-semibold">
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
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../state/authStore';
import { cn } from '../utils/cn';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuthStore();

  const departments = [
    'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 
    'Operations', 'Customer Success', 'Design', 'Product', 'Management'
  ];

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email.trim(), name.trim(), department || undefined);
      } else {
        result = await signIn(email.trim());
      }

      if (result.success) {
        Alert.alert('Success', result.message);
        if (isSignUp) {
          setIsSignUp(false);
          setEmail('');
          setName('');
          setDepartment('');
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

  const handleDemoLogin = async () => {
    setLoading(true);
    const result = await signIn('admin@company.com');
    if (!result.success) {
      Alert.alert('Error', result.message);
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
                <Text className="text-gray-700 font-medium mb-2">Company Email</Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                  <Ionicons name="mail" size={20} color="#9CA3AF" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@company.com"
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

              {/* Department Input (Sign Up Only) */}
              {isSignUp && (
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Department (Optional)</Text>
                  <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                    <Ionicons name="briefcase" size={20} color="#9CA3AF" />
                    <TextInput
                      value={department}
                      onChangeText={setDepartment}
                      placeholder="e.g., Engineering, Marketing"
                      className="flex-1 ml-3 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
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
                Try the admin dashboard with demo data
              </Text>
              <Pressable
                onPress={handleDemoLogin}
                disabled={loading}
                className="bg-yellow-600 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">
                  {loading ? 'Loading...' : 'Demo Admin Login'}
                </Text>
              </Pressable>
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
                  <Text className="font-medium text-gray-900">Company Email Required</Text>
                  <Text className="text-gray-600 text-sm">
                    Only employees with company email addresses can join
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

          {/* Bottom padding */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
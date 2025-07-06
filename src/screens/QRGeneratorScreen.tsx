import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../state/authStore';
import { getQRCodeData, isWithinValidTimeWindow, QR_CONFIG, ROTATION_STRATEGIES } from '../utils/qrCodeConfig';

export const QRGeneratorScreen: React.FC = () => {
  const [qrGenerated, setQrGenerated] = useState(false);
  const { currentUser } = useAuthStore();
  
  if (currentUser?.role !== 'admin') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Ionicons name="shield-off" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-900 mt-4">Access Denied</Text>
        <Text className="text-gray-600 mt-2">Admin access required</Text>
      </SafeAreaView>
    );
  }
  
  const qrData = getQRCodeData();
  const timeStatus = isWithinValidTimeWindow();
  
  const handleShareQRCode = async () => {
    try {
      await Share.share({
        message: `Daily Check-in QR Code\n\nURL: ${qrData.qrData}\n\nValid: ${qrData.displayInfo.validDate}\nTime: ${qrData.displayInfo.validTimeWindow} MST\n\nGenerate QR code from this URL for employee check-ins.`,
        title: 'Employee Check-in QR Code'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };
  
  const handleCopyURL = () => {
    // In a real app, you'd copy to clipboard
    Alert.alert(
      'QR Code URL',
      qrData.qrData,
      [
        { text: 'Close' },
        { 
          text: 'Share', 
          onPress: handleShareQRCode 
        }
      ]
    );
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold text-gray-900">QR Code Generator</Text>
          <Text className="text-gray-600 mt-1">Generate daily check-in QR codes for employees</Text>
        </View>
        
        {/* Current Status */}
        <Animated.View entering={FadeInDown.delay(100)} className="px-6 mb-6">
          <View className={`rounded-2xl p-6 ${timeStatus.isValid ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <View className="flex-row items-center mb-3">
              <Ionicons 
                name={timeStatus.isValid ? "checkmark-circle" : "time"} 
                size={24} 
                color={timeStatus.isValid ? "#10B981" : "#F59E0B"} 
              />
              <Text className={`font-semibold text-lg ml-2 ${timeStatus.isValid ? 'text-green-800' : 'text-orange-800'}`}>
                {timeStatus.isValid ? 'Check-in Window OPEN' : 'Check-in Window CLOSED'}
              </Text>
            </View>
            <Text className={`text-sm ${timeStatus.isValid ? 'text-green-700' : 'text-orange-700'}`}>
              Current Time: {timeStatus.currentTime} MST
            </Text>
            <Text className={`text-sm ${timeStatus.isValid ? 'text-green-700' : 'text-orange-700'}`}>
              Valid Window: {timeStatus.windowStart} AM - {timeStatus.windowEnd} AM MST
            </Text>
            {!timeStatus.isValid && timeStatus.reason && (
              <Text className="text-orange-700 text-sm mt-2 font-medium">
                {timeStatus.reason}
              </Text>
            )}
          </View>
        </Animated.View>
        
        {/* QR Code Information */}
        <Animated.View entering={FadeInDown.delay(200)} className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Today's QR Code</Text>
            
            <View className="space-y-3 mb-6">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Valid Period:</Text>
                <Text className="font-semibold text-gray-900">{qrData.displayInfo.validPeriod}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Rotation:</Text>
                <Text className="font-semibold text-blue-600 capitalize">{qrData.displayInfo.rotationStrategy}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Expires:</Text>
                <Text className="font-semibold text-orange-600">{qrData.displayInfo.expirationInfo}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Time Window:</Text>
                <Text className="font-semibold text-gray-900">{qrData.displayInfo.validTimeWindow}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Timezone:</Text>
                <Text className="font-semibold text-gray-900">{qrData.displayInfo.timezone}</Text>
              </View>
            </View>
            
            {/* QR Code URL Display */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-gray-700 font-medium mb-2">QR Code URL:</Text>
              <Text className="text-gray-900 text-sm font-mono bg-white p-3 rounded-lg border">
                {qrData.qrData}
              </Text>
            </View>
            
            {/* Action Buttons */}
            <View className="space-y-3">
              <Pressable
                onPress={handleCopyURL}
                className="bg-blue-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Copy QR Code URL
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleShareQRCode}
                className="bg-green-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Share QR Code Info
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
        
        {/* Instructions */}
        <Animated.View entering={FadeInDown.delay(300)} className="px-6 mb-6">
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <Text className="text-lg font-semibold text-blue-900 ml-2">How to Use</Text>
            </View>
            <View className="space-y-3">
              {qrData.displayInfo.instructions.map((instruction, index) => (
                <View key={index} className="flex-row items-start">
                  <View className="w-6 h-6 bg-blue-200 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Text className="text-blue-800 font-bold text-xs">{index + 1}</Text>
                  </View>
                  <Text className="text-blue-800 flex-1">{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Security Features */}
        <Animated.View entering={FadeInDown.delay(400)} className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Security Features</Text>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-3">Daily rotating security tokens</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-3">Time-window validation (6:00-9:00 AM MST)</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-3">Date validation (today only)</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="person" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-3">One check-in per employee per day</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="link" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-3">URL format validation</Text>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Rotation Strategy Info */}
        <Animated.View entering={FadeInDown.delay(500)} className="px-6 mb-6">
          <View className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="refresh" size={24} color="#8B5CF6" />
              <Text className="text-lg font-semibold text-purple-800 ml-2">
                Current Strategy: {ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].name}
              </Text>
            </View>
            <Text className="text-purple-800 mb-3">
              {ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].description}
            </Text>
            <View className="space-y-2">
              <Text className="text-purple-700 font-medium">✅ Pros:</Text>
              {ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].pros.map((pro, index) => (
                <Text key={index} className="text-purple-700 text-sm ml-4">• {pro}</Text>
              ))}
              <Text className="text-purple-700 font-medium mt-2">⚠️ Considerations:</Text>
              {ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].cons.map((con, index) => (
                <Text key={index} className="text-purple-700 text-sm ml-4">• {con}</Text>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Generate Instructions */}
        <Animated.View entering={FadeInDown.delay(600)} className="px-6 mb-6">
          <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="construct" size={24} color="#F59E0B" />
              <Text className="text-lg font-semibold text-yellow-800 ml-2">QR Code Generation</Text>
            </View>
            <Text className="text-yellow-800 mb-3">
              To create the actual QR code image, use any QR code generator with the URL above:
            </Text>
            <View className="space-y-2">
              <Text className="text-yellow-700 text-sm">• QR-Code-Generator.com</Text>
              <Text className="text-yellow-700 text-sm">• QR.io</Text>
              <Text className="text-yellow-700 text-sm">• Google Charts QR API</Text>
              <Text className="text-yellow-700 text-sm">• Any standard QR generator tool</Text>
            </View>
            
            {/* Point Structure */}
            <View className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <Text className="text-yellow-800 font-medium mb-2">Point Structure:</Text>
              <Text className="text-yellow-700 text-sm">🌅 Before 7:45 AM: +2 points (Early Bird)</Text>
              <Text className="text-yellow-700 text-sm">⏰ 7:45-8:00 AM: +1 point (On Time)</Text>
              <Text className="text-yellow-700 text-sm">🟨 8:00-9:00 AM: +0 points (Within Window)</Text>
              <Text className="text-yellow-700 text-sm">🚫 Outside 6:00-9:00 AM: Blocked</Text>
            </View>
            <Text className="text-yellow-800 mt-3 font-medium">
              💡 {QR_CONFIG.rotationStrategy === 'daily' ? 'Generate a new QR code daily' : 
                   QR_CONFIG.rotationStrategy === 'weekly' ? 'Generate a new QR code every Monday' :
                   QR_CONFIG.rotationStrategy === 'monthly' ? 'Generate a new QR code monthly' :
                   'Generate QR codes as needed'} using the current URL!
            </Text>
          </View>
        </Animated.View>
        
        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};
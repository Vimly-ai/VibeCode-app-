import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../state/authStore';
import { getQRCodeData, isWithinValidTimeWindow, QR_CONFIG, ROTATION_STRATEGIES, MANUAL_QR_VERSION } from '../utils/qrCodeConfig';

export const QRGeneratorScreen: React.FC = () => {
  const [qrGenerated, setQrGenerated] = useState(false);
  const { currentUser } = useAuthStore();
  
  if (currentUser?.role !== 'admin') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="shield" size={64} color="#EF4444" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a202c', marginTop: 16 }}>Access Denied</Text>
        <Text style={{ color: '#4b5563', marginTop: 8 }}>Admin access required</Text>
      </SafeAreaView>
    );
  }
  
  const qrData = getQRCodeData();
  const timeStatus = isWithinValidTimeWindow();
  
  const handleShareQRCode = async () => {
    try {
      await Share.share({
        message: `Daily Check-in QR Code\n\nURL: ${qrData.qrData}\n\nValid: ${qrData.displayInfo.validPeriod}\nTime: ${qrData.displayInfo.validTimeWindow} MST\n\nGenerate QR code from this URL for employee check-ins.`,
        title: 'Employee Check-in QR Code'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };
  
  const handleCopyURL = async () => {
    try {
      await Clipboard.setStringAsync(qrData.qrData);
      Alert.alert(
        'Copied!',
        'QR code URL has been copied to your clipboard.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Copy Failed',
        'Unable to copy to clipboard. Here\'s the URL:\n\n' + qrData.qrData,
        [
          { text: 'Close' },
          { 
            text: 'Share', 
            onPress: handleShareQRCode 
          }
        ]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.heading}>QR Generator</Text>
            {/* Header */}
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>QR Code Generator</Text>
              <Text style={{ color: '#4B5563', marginTop: 4 }}>Generate daily check-in QR codes for employees</Text>
            </View>
            {/* Current Status */}
            <Animated.View entering={FadeInDown.delay(100)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ borderRadius: 16, padding: 24, backgroundColor: timeStatus.isValid ? '#D1FAE5' : '#FFEDD5', borderWidth: 1, borderColor: timeStatus.isValid ? '#BBF7D0' : '#FED7AA' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name={timeStatus.isValid ? 'checkmark-circle' : 'time'} size={24} color={timeStatus.isValid ? '#10B981' : '#F59E0B'} />
                  <Text style={{ fontWeight: '600', fontSize: 18, marginLeft: 8, color: timeStatus.isValid ? '#065F46' : '#B45309' }}>
                    {timeStatus.isValid ? 'Check-in Window OPEN' : 'Check-in Window CLOSED'}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: timeStatus.isValid ? '#047857' : '#B45309' }}>
                  Current Time: {timeStatus.currentTime} MST
                </Text>
                <Text style={{ fontSize: 14, color: timeStatus.isValid ? '#047857' : '#B45309' }}>
                  Valid Window: {timeStatus.windowStart} AM - {timeStatus.windowEnd} AM MST
                </Text>
                {!timeStatus.isValid && timeStatus.reason && (
                  <Text style={{ color: '#B45309', fontSize: 14, marginTop: 8, fontWeight: '500' }}>{timeStatus.reason}</Text>
                )}
              </View>
            </Animated.View>
            {/* QR Code Information */}
            <Animated.View entering={FadeInDown.delay(200)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Today's QR Code</Text>
                <View style={{ marginBottom: 24 }}>
                  <View style={styles.rowBetween}><Text style={styles.label}>QR Code Version:</Text><Text style={styles.valueBlue}>v{MANUAL_QR_VERSION}</Text></View>
                  <View style={styles.rowBetween}><Text style={styles.label}>Valid Period:</Text><Text style={styles.value}>{qrData.displayInfo.validPeriod}</Text></View>
                  <View style={styles.rowBetween}><Text style={styles.label}>Rotation:</Text><Text style={styles.valueGreen}>{qrData.displayInfo.rotationStrategy}</Text></View>
                  <View style={styles.rowBetween}><Text style={styles.label}>Expires:</Text><Text style={styles.valueGreen}>{qrData.displayInfo.expirationInfo}</Text></View>
                  <View style={styles.rowBetween}><Text style={styles.label}>Time Window:</Text><Text style={styles.value}>{qrData.displayInfo.validTimeWindow}</Text></View>
                  <View style={styles.rowBetween}><Text style={styles.label}>Timezone:</Text><Text style={styles.value}>{qrData.displayInfo.timezone}</Text></View>
                </View>
                {/* QR Code URL Display */}
                <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>QR Code URL:</Text>
                  <Text style={{ color: '#111827', fontSize: 13, fontFamily: 'monospace', backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>{qrData.qrData}</Text>
                </View>
                {/* Action Buttons */}
                <View style={{ gap: 12 }}>
                  <Pressable onPress={handleCopyURL} style={{ backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="copy" size={20} color="white" />
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Copy to Clipboard</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={handleShareQRCode} style={{ backgroundColor: '#10B981', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Share QR Code Info</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
            {/* Instructions */}
            <Animated.View entering={FadeInDown.delay(300)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ backgroundColor: '#DBEAFE', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 16, padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="information-circle" size={24} color="#3B82F6" />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E40AF', marginLeft: 8 }}>How to Use</Text>
                </View>
                <View style={{ gap: 8 }}>
                  {qrData.displayInfo.instructions.map((instruction, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                      <View style={{ width: 24, height: 24, backgroundColor: '#BFDBFE', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 }}>
                        <Text style={{ color: '#1E40AF', fontWeight: 'bold', fontSize: 12 }}>{index + 1}</Text>
                      </View>
                      <Text style={{ color: '#1E40AF', fontSize: 15, flex: 1 }}>{instruction}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
            {/* Security Features */}
            <Animated.View entering={FadeInDown.delay(400)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Security Features</Text>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    <Text style={{ color: '#374151', marginLeft: 12 }}>Daily rotating security tokens</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="time" size={20} color="#10B981" />
                    <Text style={{ color: '#374151', marginLeft: 12 }}>Time-window validation (6:00-9:00 AM MST)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="calendar" size={20} color="#10B981" />
                    <Text style={{ color: '#374151', marginLeft: 12 }}>Date validation (today only)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="person" size={20} color="#10B981" />
                    <Text style={{ color: '#374151', marginLeft: 12 }}>One check-in per employee per day</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="link" size={20} color="#10B981" />
                    <Text style={{ color: '#374151', marginLeft: 12 }}>URL format validation</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
            {/* Rotation Strategy Info */}
            <Animated.View entering={FadeInDown.delay(500)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ backgroundColor: '#F3F0FF', borderColor: '#DDD6FE', borderWidth: 1, borderRadius: 16, padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="refresh" size={24} color="#8B5CF6" />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#6D28D9', marginLeft: 8 }}>
                    Current Strategy: {ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].name}
                  </Text>
                </View>
                <Text style={{ color: '#6D28D9', marginBottom: 12 }}>{ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].description}</Text>
                <View style={{ gap: 8 }}>
                  <Text style={{ color: '#7C3AED', fontWeight: 'bold' }}>✅ Pros:</Text>
                  {ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].pros.map((pro, index) => (
                    <Text key={index} style={{ color: '#7C3AED', fontSize: 14, marginLeft: 16 }}>• {pro}</Text>
                  ))}
                  <Text style={{ color: '#7C3AED', fontWeight: 'bold', marginTop: 8 }}>⚠️ Considerations:</Text>
                  {ROTATION_STRATEGIES[QR_CONFIG.rotationStrategy as keyof typeof ROTATION_STRATEGIES].cons.map((con, index) => (
                    <Text key={index} style={{ color: '#7C3AED', fontSize: 14, marginLeft: 16 }}>• {con}</Text>
                  ))}
                </View>
              </View>
            </Animated.View>
            {/* Manual QR Code Control */}
            <Animated.View entering={FadeInDown.delay(600)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ backgroundColor: '#D1FAE5', borderColor: '#BBF7D0', borderWidth: 1, borderRadius: 16, padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="settings" size={24} color="#10B981" />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#047857', marginLeft: 8 }}>Manual QR Control</Text>
                </View>
                <Text style={{ color: '#047857', marginBottom: 16 }}>
                  You have full control! This QR code will work until you decide to change it.
                </Text>
                <View style={{ backgroundColor: '#BBF7D0', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <Text style={{ color: '#047857', fontWeight: 'bold', marginBottom: 8 }}>Current QR Code: Version {MANUAL_QR_VERSION}</Text>
                  <Text style={{ color: '#047857', fontSize: 14 }}>• Valid indefinitely until you change it</Text>
                  <Text style={{ color: '#047857', fontSize: 14 }}>• Time window still enforced daily (6:00-9:00 AM)</Text>
                  <Text style={{ color: '#047857', fontSize: 14 }}>• One scan per employee per day</Text>
                </View>
                <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                  <Text style={{ color: '#047857', fontWeight: 'bold', marginBottom: 8 }}>🔄 To Create a New QR Code:</Text>
                  <Text style={{ color: '#047857', fontSize: 14, marginBottom: 4 }}>1. Go to: <Text style={{ fontFamily: 'monospace' }}>/src/utils/qrCodeConfig.ts</Text></Text>
                  <Text style={{ color: '#047857', fontSize: 14, marginBottom: 4 }}>2. Find: <Text style={{ fontFamily: 'monospace' }}>MANUAL_QR_VERSION = {MANUAL_QR_VERSION}</Text></Text>
                  <Text style={{ color: '#047857', fontSize: 14, marginBottom: 4 }}>3. Change to: <Text style={{ fontFamily: 'monospace' }}>MANUAL_QR_VERSION = {MANUAL_QR_VERSION + 1}</Text></Text>
                  <Text style={{ color: '#047857', fontSize: 14 }}>4. Generate new QR code with updated URL</Text>
                </View>
                <Text style={{ color: '#047857', marginTop: 12, fontWeight: '500' }}>
                  💡 Only change the version when you want to invalidate old QR codes (security concerns, lost access, etc.)
                </Text>
              </View>
            </Animated.View>
            {/* Generate Instructions */}
            <Animated.View entering={FadeInDown.delay(700)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ backgroundColor: '#FEF9C3', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 16, padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="construct" size={24} color="#F59E0B" />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#B45309', marginLeft: 8 }}>QR Code Generation</Text>
                </View>
                <Text style={{ color: '#B45309', marginBottom: 12 }}>
                  To create the actual QR code image, use any QR code generator with the URL above:
                </Text>
                <View style={{ gap: 8 }}>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>• QR-Code-Generator.com</Text>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>• QR.io</Text>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>• Google Charts QR API</Text>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>• Any standard QR generator tool</Text>
                </View>
                {/* Point Structure */}
                <View style={{ marginTop: 16, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12 }}>
                  <Text style={{ color: '#B45309', fontWeight: 'bold', marginBottom: 8 }}>Point Structure:</Text>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>🌅 Before 7:45 AM: +2 points (Early Bird)</Text>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>⏰ 7:45-8:00 AM: +1 point (On Time)</Text>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>🟨 8:00-9:00 AM: +0 points (Within Window)</Text>
                  <Text style={{ color: '#B45309', fontSize: 14 }}>🚫 Outside 6:00-9:00 AM: Blocked</Text>
                </View>
              </View>
            </Animated.View>
            {/* Bottom padding */}
            <View style={{ height: 80 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181b' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { width: '100%', maxWidth: 800, alignItems: 'center' },
  glassCard: { width: '100%', padding: 32, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: '#b87333', shadowColor: '#b87333', shadowOpacity: 0.25, shadowRadius: 8, marginBottom: 24 },
  heading: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#b87333', fontFamily: 'UnifrakturCook' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#6B7280', fontSize: 15 },
  value: { color: '#111827', fontWeight: '500', fontSize: 15 },
  valueBlue: { color: '#2563EB', fontWeight: 'bold', fontSize: 15 },
  valueGreen: { color: '#047857', fontWeight: 'bold', fontSize: 15, textTransform: 'capitalize' },
});
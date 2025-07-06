import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEmployeeStore } from '../state/employeeStore';
import { generateDailyQRCode, getQRCodeData } from '../utils/qrCodeConfig';

interface DemoQRCodeProps {
  visible: boolean;
  onClose: () => void;
  onCheckInSuccess?: (result: { success: boolean; message: string; pointsEarned: number; quote?: any }) => void;
}

export const DemoQRCode: React.FC<DemoQRCodeProps> = ({ visible, onClose, onCheckInSuccess }) => {
  const { currentEmployee, checkIn } = useEmployeeStore();
  
  const handleDemoCheckIn = () => {
    if (!currentEmployee) return;
    
    // Use the real QR code format for demo
    const demoQRCode = generateDailyQRCode();
    const result = checkIn(currentEmployee.id, demoQRCode);
    
    if (onCheckInSuccess) {
      onCheckInSuccess(result);
    }
    
    onClose();
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="qr-code" size={36} color="#3B82F6" />
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Demo QR Code
            </Text>
            
            <Text className="text-gray-600 text-center mb-6">
              This simulates scanning the official check-in QR code with today's validation.
            </Text>
            
            {/* QR Code Info */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <Text className="text-blue-800 font-semibold mb-2">QR Code Details:</Text>
              <View className="space-y-2">
                <Text className="text-blue-700 text-sm">
                  • Valid: {new Date().toLocaleDateString()}
                </Text>
                <Text className="text-blue-700 text-sm">
                  • Time Window: 6:00 AM - 9:00 AM MST
                </Text>
                <Text className="text-blue-700 text-sm">
                  • One scan per day limit
                </Text>
                <Text className="text-blue-700 text-sm">
                  • Secure daily token validation
                </Text>
              </View>
            </View>
            
            {/* Mock QR Code Visual */}
            <View className="w-32 h-32 bg-gray-100 rounded-xl items-center justify-center mb-6">
              <View className="grid grid-cols-6 gap-1">
                {Array.from({ length: 36 }).map((_, i) => (
                  <View
                    key={i}
                    className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                  />
                ))}
              </View>
            </View>
            
            <View className="flex-row space-x-3 w-full">
              <Pressable
                onPress={onClose}
                className="flex-1 bg-gray-200 py-3 rounded-full"
              >
                <Text className="text-gray-800 text-center font-semibold">
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleDemoCheckIn}
                className="flex-1 bg-blue-600 py-3 rounded-full"
              >
                <Text className="text-white text-center font-semibold">
                  Demo Check-In
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Alert, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, CameraViewRef } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { useEmployeeStore } from '../state/employeeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QRCodeScannerProps {
  onClose: () => void;
  onScanSuccess: (result: { success: boolean; message: string; pointsEarned: number; quote?: any }) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onClose, onScanSuccess }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraViewRef>(null);
  const insets = useSafeAreaInsets();
  const { currentEmployee, checkIn } = useEmployeeStore();
  
  // Animation values
  const scanLinePosition = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    // Animate scan line
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    // Animate pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  
  const scanLineStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scanLinePosition.value,
            [0, 1],
            [0, 200] // Scan area height
          ),
        },
      ],
    };
  });
  
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  if (!permission) {
    return <View className="flex-1 justify-center items-center bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-black px-6">
        <Ionicons name="camera-outline" size={64} color="white" />
        <Text className="text-white text-lg text-center mt-4 mb-6">
          We need camera permissions to scan QR codes
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-blue-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </Pressable>
        <Pressable onPress={onClose} className="mt-4">
          <Text className="text-gray-400">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || !currentEmployee) return;
    
    setScanned(true);
    
    // Simulate QR code validation - in a real app, this would validate against a server
    if (data.includes('employee-checkin')) {
      const result = checkIn(currentEmployee.id, data);
      onScanSuccess(result);
    } else {
      Alert.alert('Invalid QR Code', 'This is not a valid check-in QR code.', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => current === 'back' ? 'front' : 'back');
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'],
        }}
      />
      
      {/* Overlay UI */}
      <View className="absolute top-0 left-0 right-0 bottom-0 z-10">
        {/* Top bar */}
        <View 
          className="flex-row justify-between items-center px-6 py-4 bg-black/50"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Pressable onPress={onClose} className="p-2">
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Scan QR Code</Text>
          <Pressable onPress={toggleCameraFacing} className="p-2">
            <Ionicons name="camera-reverse" size={28} color="white" />
          </Pressable>
        </View>
        
        {/* Center scanning area */}
        <View className="flex-1 justify-center items-center">
          <View className="relative">
            {/* Scan frame */}
            <Animated.View style={[pulseStyle]} className="w-64 h-64 relative">
              <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
              <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
              
              {/* Animated scan line */}
              <Animated.View
                style={[
                  scanLineStyle,
                  {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: '#3B82F6',
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }
                ]}
              />
            </Animated.View>
            
            <Text className="text-white text-center mt-6 text-lg">
              Position QR code within the frame
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Check-in code will be scanned automatically
            </Text>
          </View>
        </View>
        
        {/* Bottom section */}
        <View className="p-6 bg-black/50" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row justify-center items-center space-x-2">
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text className="text-gray-400 text-sm">
              Scan your daily check-in QR code to earn points
            </Text>
          </View>
        </View>
      </View>
      
      {/* Scanning success overlay */}
      {scanned && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/80 justify-center items-center z-20">
          <View className="bg-white rounded-2xl p-6 mx-6">
            <View className="items-center">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              <Text className="text-xl font-bold mt-4">Scanning...</Text>
              <Text className="text-gray-600 mt-2">Processing your check-in</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
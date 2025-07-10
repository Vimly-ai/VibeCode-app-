import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { Pressable, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

export default function App() {
  const [resetting, setResetting] = useState(false);

  const handleHardReset = async () => {
    setResetting(true);
    try {
      await AsyncStorage.clear();
      if (typeof window !== 'undefined' && window.location && window.location.reload) {
        window.location.reload();
      } else if (typeof global !== 'undefined' && global.Expo && global.Expo.Updates && global.Expo.Updates.reloadAsync) {
        await global.Expo.Updates.reloadAsync();
      }
    } catch (e) {
      setResetting(false);
      alert('Failed to reset storage.');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Global debug Pressable overlay */}
        {/* <Pressable onPress={() => Alert.alert('DEBUG', 'Global overlay works!')} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,255,0.2)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>GLOBAL DEBUG BAR - TEST</Text>
        </Pressable> */}
        {/* Hard Reset Button */}
        {/* <Pressable
          onPress={handleHardReset}
          disabled={resetting}
          style={{ position: 'absolute', bottom: 40, right: 20, backgroundColor: '#EF4444', padding: 16, borderRadius: 32, zIndex: 9999, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{resetting ? 'Resetting...' : 'Hard Reset'}</Text>
        </Pressable> */}
        <AppNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

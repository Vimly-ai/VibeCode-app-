import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { EmployeeManagementScreen } from '../screens/EmployeeManagementScreen';
import { RewardApprovalScreen } from '../screens/RewardApprovalScreen';
import { QRGeneratorScreen } from '../screens/QRGeneratorScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { useEmployeeStore } from '../state/employeeStore';
import { useAuthStore } from '../state/authStore';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  console.log('AppNavigator rendered (top of file)');
  const { currentEmployee, employees, initializeEmployee, setCurrentEmployee } = useEmployeeStore();
  const { currentUser, isAuthenticated, autoSignIn, getPendingUsers } = useAuthStore();
  
  // Try auto sign-in on app load
  useEffect(() => {
    if (!isAuthenticated) {
      autoSignIn();
    }
  }, [autoSignIn, isAuthenticated]);
  
  // Ensure current user has employee record and set current employee
  useEffect(() => {
    if (currentUser && currentUser.role === 'employee') {
      const existingEmployee = employees.find(emp => emp.email === currentUser.email);
      if (!existingEmployee) {
        initializeEmployee(currentUser.name, currentUser.email);
      } else {
        setCurrentEmployee(currentUser.email);
      }
    }
  }, [currentUser, employees, initializeEmployee, setCurrentEmployee]);
  
  // Show auth screen if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <NavigationContainer>
        <AuthScreen />
      </NavigationContainer>
    );
  }
  
  // Admin navigation
  if (currentUser.role === 'admin') {
    return (
      <NavigationContainer>
        <Tab.Navigator
          id={undefined}
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: any;
              
              if (route.name === 'Admin Dashboard') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              } else if (route.name === 'Employees') {
                iconName = focused ? 'people' : 'people-outline';
              } else if (route.name === 'QR Codes') {
                iconName = focused ? 'qr-code' : 'qr-code-outline';
              } else if (route.name === 'Rewards') {
                iconName = focused ? 'gift' : 'gift-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }
              
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopColor: '#E5E7EB',
              borderTopWidth: 1,
              paddingTop: 8,
              paddingBottom: 8,
              height: 90,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen 
            name="Admin Dashboard" 
            component={AdminDashboardScreen}
          />
          <Tab.Screen 
            name="Employees" 
            component={EmployeeManagementScreen}
            options={{
              tabBarBadge: getPendingUsers().length > 0 ? getPendingUsers().length : undefined,
              tabBarBadgeStyle: {
                backgroundColor: '#F59E0B',
                color: 'white',
              },
            }}
          />
          <Tab.Screen 
            name="QR Codes" 
            component={QRGeneratorScreen}
          />
          <Tab.Screen 
            name="Rewards" 
            component={RewardApprovalScreen}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
          />
        </Tab.Navigator>
      </NavigationContainer>
    );
  }
  
  // Employee navigation
  return (
    <NavigationContainer>
      <Tab.Navigator
        id={undefined}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;
            
            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Leaderboard') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else if (route.name === 'Rewards') {
              iconName = focused ? 'gift' : 'gift-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: '#E5E7EB',
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 90,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            tabBarBadge: !currentEmployee ? '!' : undefined,
            tabBarBadgeStyle: {
              backgroundColor: '#EF4444',
              color: 'white',
            },
          }}
        />
        <Tab.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen}
        />
        <Tab.Screen 
          name="Rewards" 
          component={RewardsScreen}
          options={{
            tabBarBadge: currentEmployee && currentEmployee.totalPoints >= 5 ? '🎁' : undefined,
            tabBarBadgeStyle: {
              backgroundColor: 'transparent',
              color: '#F59E0B',
            },
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
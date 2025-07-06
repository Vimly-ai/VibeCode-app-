import React from 'react';
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
import { AuthScreen } from '../screens/AuthScreen';
import { useEmployeeStore } from '../state/employeeStore';
import { useAuthStore } from '../state/authStore';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  const { currentEmployee } = useEmployeeStore();
  const { currentUser, isAuthenticated } = useAuthStore();
  
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
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: any;
              
              if (route.name === 'Admin Dashboard') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              } else if (route.name === 'Employees') {
                iconName = focused ? 'people' : 'people-outline';
              } else if (route.name === 'Rewards') {
                iconName = focused ? 'gift' : 'gift-outline';
              } else if (route.name === 'Leaderboard') {
                iconName = focused ? 'trophy' : 'trophy-outline';
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
          />
          <Tab.Screen 
            name="Rewards" 
            component={RewardApprovalScreen}
          />
          <Tab.Screen 
            name="Leaderboard" 
            component={LeaderboardScreen}
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
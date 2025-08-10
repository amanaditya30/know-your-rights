import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// --- 1. IMPORT THE AUTH PROVIDER ---
import { AuthProvider, useAuth } from './context/AuthContext';

// Screens
import HomeScreen from './screens/HomeScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import ForumScreen from './screens/ForumScreen';
import FIRScreen from './screens/FIRScreen';
import ExpertsScreen from './screens/ExpertsScreen';
import AuthScreen from './screens/LoginSignupScreen';
import ProfileScreen from './screens/ProfileScreen';
import RightsPoliciesScreen from './screens/RightsPolicies';
import CreatePostScreen from './screens/CreatePostScreen';
import CommentScreen from './screens/CommentScreen';

// ✅ New import
import LawyerRegistration from './screens/LawyerRegistration';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// A dedicated stack for the Forum flow
function ForumStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ForumHome" component={ForumScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="CommentScreen" component={CommentScreen} />
    </Stack.Navigator>
  );
}

// The BottomTabs component
function BottomTabs() {
  const { user } = useAuth(); // Get user from context

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-sharp';
          else if (route.name === 'Chatbot') iconName = 'chatbubble-ellipses-sharp';
          else if (route.name === 'Forum') iconName = 'people-sharp';
          else if (route.name === 'FIR') iconName = 'document-text-sharp';
          else if (route.name === 'Experts') iconName = 'ribbon-sharp';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0A2240',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ user: user }} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen
        name="Forum"
        component={ForumStack}
        initialParams={{ userId: user?.id }}
      />
      <Tab.Screen name="FIR" component={FIRScreen} />
      <Tab.Screen name="Experts" component={ExpertsScreen} />
    </Tab.Navigator>
  );
}

// This component contains the main navigation logic
function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="MainApp" component={BottomTabs} />
        <Stack.Screen name="RightsPolicies" component={RightsPoliciesScreen} />
        {/* ✅ New Screen */}
        <Stack.Screen name="LawyerRegistration" component={LawyerRegistration} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- 2. WRAP THE ENTIRE APP WITH THE PROVIDER ---
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

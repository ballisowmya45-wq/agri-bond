import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from "react-native";

import WelcomeScreen from './screens/WelcomeScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';
import MainNavigator from "./navigation/MainNavigator";

import { UserProvider, useUser } from "./context/UserContext";

const Stack = createNativeStackNavigator();

function AppContent() {
  const { userProfile, loading } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userProfile ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainNavigator} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <StatusBar style="dark" />
      <AppContent />
    </UserProvider>
  );
}
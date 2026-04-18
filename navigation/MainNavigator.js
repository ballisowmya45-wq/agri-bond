import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import AddPost from '../screens/AddPost';
import MessagesStack from './MessagesStack';
import NetworkScreen from "../screens/NetworkScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatRoomScreen from "../screens/ChatRoomScreen";
import MediaPreviewScreen from "../screens/MediaPreviewScreen";
import SettingsScreen from "../screens/SettingsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import LanguageScreen from "../screens/LanguageScreen";
import CompleteProfileScreen from '../screens/CompleteProfileScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* -------- Bottom Tabs -------- */

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } 
          else if (route.name === "Post") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } 
          else if (route.name === "Network") {
            iconName = focused ? "people" : "people-outline";
          } 
          else if (route.name === "Messages") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#0A66C2",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Post" component={AddPost} />

      {/* 🔥 NEW */}
      <Tab.Screen name="Network" component={NetworkScreen} />
      

      {/* 🔥 CHAT STACK */}
      <Tab.Screen name="Messages" component={MessagesStack} />
    </Tab.Navigator>
  );
}

/* -------- Main Stack -------- */

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Your original Welcome screen */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="MediaPreview" component={MediaPreviewScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      {/* Added MainTabs after Welcome */}
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}
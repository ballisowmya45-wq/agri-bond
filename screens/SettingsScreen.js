import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase/firebaseConfig';
import { useUser } from '../context/UserContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { userProfile, setUserProfile } = useUser();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. Are you sure?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
  `${API_URL}/api/user/delete-account/${userProfile._id}`
);
              setUserProfile(null);
                  // 🔥 TRY FIREBASE DELETE (optional)
    try {
      await auth.currentUser.delete();
    } catch (firebaseError) {
      console.log("Firebase delete failed:", firebaseError.message);
    }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      {/* Header */}
<View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Feather name="arrow-left" size={24} color="#2e7d32" />
  </TouchableOpacity>

  <Text style={styles.title}>Settings</Text>

  <View style={{ width: 24 }} />
</View>

      {/* Edit Profile */}
      <TouchableOpacity 
        style={styles.option}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Ionicons name="person-outline" size={24} color="#2e7d32" />
        <Text style={styles.optionText}>Edit Profile</Text>
        <Feather name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>

      {/* Language */}
     <TouchableOpacity 
  style={styles.option}
  onPress={() => navigation.navigate("Language")}
>
  <Ionicons name="language-outline" size={24} color="#2e7d32" />
  
  <Text style={styles.optionText}>Language</Text>

  {/* Show selected language */}
  <Text style={{ color: "#777", marginRight: 10 }}>
    {userProfile?.languageCode?.toUpperCase()}
  </Text>

  {/* Arrow icon */}
  <Feather name="chevron-right" size={20} color="#ccc" />
</TouchableOpacity>

      {/* Delete Account (Bottom - Dangerous) */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
 /* backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 10,
  },*/
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  languageRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 8,
  },
  langActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  langText: {
    fontSize: 12,
    color: '#666',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#d32f2f',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 15,
  marginTop: 20,
},
});

export default SettingsScreen;
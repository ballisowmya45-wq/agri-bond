import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import statesData from "../assets/states-districts.json";
import { languages } from "../data/languages";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { useUser } from "../context/UserContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function CompleteProfileScreen({ navigation }) {
  const { userProfile, setUserProfile } = useUser();

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState("");

  const selectedState = statesData.states.find(s => s.state === state);

  const handleSave = async () => {
    try {
    if (!name || !state || !district || !language)
      return Alert.alert("Fill all fields");

    const auth = getAuth();
    const user = auth.currentUser;
    const idToken = await user.getIdToken();

    const selectedLanguage = languages.find(l => l.name === language);
  console.log("STEP 1");
    await axios.post(`${API_URL}/api/user/complete-profile`, {
      idToken,
      name,
      state,
      district,
      language,
      languageCode: selectedLanguage.code
    });
    console.log("STEP 2");
setUserProfile({
  ...userProfile,
  name,
  state,
  district,
  language,
  languageCode: selectedLanguage.code
});
  console.log("STEP 4 - User Profile Updated in Context");
    navigation.navigate("MainTabs");
    console.log("STEP 5 - Navigation to MainTabs")
  } catch (error) {
    console.error("Error saving profile:", error);
    Alert.alert("Error", "Failed to save profile");
  } 
}

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Text style={styles.title}>Complete Your Profile</Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={state}
          onValueChange={(val) => {
            setState(val);
            setDistrict("");
          }}
        >
          <Picker.Item label="Select State" value="" />
          {statesData.states.map((s, index) => (
            <Picker.Item key={index} label={s.state} value={s.state} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={district}
          onValueChange={(val) => setDistrict(val)}
          enabled={!!state}
        >
          <Picker.Item label="Select District" value="" />
          {selectedState?.districts.map((d, index) => (
            <Picker.Item key={index} label={d} value={d} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={language}
          onValueChange={(val) => setLanguage(val)}
        >
          <Picker.Item label="Select Language" value="" />
          {languages.map((l, index) => (
            <Picker.Item key={index} label={l.name} value={l.name} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: "#f5efe6",
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },

  pickerContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },

  button: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { auth } from "../firebase/firebaseConfig";
import { languages as LANGUAGES } from "../data/languages";

const API_URL = process.env.EXPO_PUBLIC_API_URL;


export default function LanguageScreen({ navigation }) {
  const { userProfile, setUserProfile } = useUser();

  const changeLanguage = async (lang) => {
    try {
      const idToken = await auth.currentUser.getIdToken();

      await axios.put(`${API_URL}/api/user/update-language/${userProfile._id}`, {
        language: lang.name,
        languageCode: lang.code,
      });

      // 🔥 UPDATE FULL USER OBJECT
      setUserProfile({
        ...userProfile,
        languageCode: lang.code,
        language: lang.name,
      });

      navigation.goBack();

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Language</Text>

      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => {
          const selected = userProfile?.languageCode === item.code;

          return (
            <TouchableOpacity
              style={[styles.option, selected && styles.selected]}
              onPress={() => changeLanguage(item)}
            >
              <Text style={styles.text}>{item.name}</Text>
              {selected && <Text>✓</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
    marginTop: 30,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2e7d32",
  },

  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  selected: {
    backgroundColor: "#e8f5e9",
  },

  text: {
    fontSize: 16,
  },
});

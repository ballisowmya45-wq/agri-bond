import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import axios from "axios";

import statesData from "../assets/states-districts.json";
import { languages } from "../data/languages";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function EditProfileScreen({ navigation }) {
  const { userProfile, setUserProfile } = useUser();

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState("");
  const [languageCode, setLanguageCode] = useState("");

  const [districts, setDistricts] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");

  /* LOAD USER DATA */
  useEffect(() => {
    if (!userProfile) return;

    setName(userProfile.name || "");
    setState(userProfile.state || "");
    setDistrict(userProfile.district || "");
    setLanguage(userProfile.language || "");
    setLanguageCode(userProfile.languageCode || "");
  }, [userProfile]);

  /* UPDATE DISTRICTS */
  useEffect(() => {
    const found = statesData.states.find((s) => s.state === state);
    setDistricts(found ? found.districts : []);
  }, [state]);

  /* OPEN MODAL */
  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  /* SELECT VALUE */
  const selectValue = (value) => {
    if (modalType === "state") {
      setState(value);
      setDistrict("");
    } else if (modalType === "district") {
      setDistrict(value);
    } else if (modalType === "language") {
      setLanguage(value);
      const lang = languages.find((l) => l.name === value);
      setLanguageCode(lang?.code || "");
    }
    setModalVisible(false);
  };

  /* GET DATA FOR MODAL */
  const getData = () => {
    if (modalType === "state") return statesData.states.map((s) => s.state);
    if (modalType === "district") return districts;
    if (modalType === "language") return languages.map((l) => l.name);
    return [];
  };

  /* SAVE */
  const handleSave = async () => {
    try {
      const res = await axios.put(
        `${API_URL}/api/user/update/${userProfile._id}`,
        {
          name,
          state,
          district,
          language,
          languageCode,
        }
      );

      setUserProfile(res.data);
      navigation.goBack();

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>Edit Profile</Text>

      {/* NAME */}
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      </View>

      {/* STATE */}
      <TouchableOpacity style={styles.cardRow} onPress={() => openModal("state")}>
        <View>
          <Text style={styles.label}>State</Text>
          <Text style={styles.value}>{state || "Select State"}</Text>
        </View>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* DISTRICT */}
      <TouchableOpacity style={styles.cardRow} onPress={() => openModal("district")}>
        <View>
          <Text style={styles.label}>District</Text>
          <Text style={styles.value}>{district || "Select District"}</Text>
        </View>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* LANGUAGE */}
      <TouchableOpacity style={styles.cardRow} onPress={() => openModal("language")}>
        <View>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>{language || "Select Language"}</Text>
        </View>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* SAVE BUTTON */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>Select {modalType}</Text>

            <FlatList
              data={getData()}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => selectValue(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    paddingHorizontal: 15,
    paddingTop: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2e7d32",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },

  cardRow: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },

  label: {
    fontSize: 12,
    color: "gray",
  },

  value: {
    fontSize: 16,
    marginTop: 5,
  },

  input: {
    marginTop: 5,
    fontSize: 16,
  },

  arrow: {
    fontSize: 16,
    color: "#888",
  },

  saveBtn: {
    marginTop: 20,
    backgroundColor: "#2e7d32",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  optionText: {
    fontSize: 16,
  },

  cancel: {
    textAlign: "center",
    color: "red",
    marginTop: 10,
  },
});

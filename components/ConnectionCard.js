import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useUser } from "../context/UserContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ConnectionCard({ user }) {
  const { userProfile } = useUser();
  const MY_ID = userProfile?._id;
  const navigation = useNavigation();

  const goToChat = async () => {
  try {
    const res = await axios.post(`${API_URL}/api/chat/createChat`, {
      user1: MY_ID,
      user2: user._id,
    });

    const chat = res.data;

    navigation.navigate("ChatRoom", {
      chatId: chat._id,
      user,
    });

  } catch (err) {
    console.log("CHAT ERROR:", err);
  }
};

  return (
    <View style={styles.card}>

      {/* 🔥 LEFT SIDE (PROFILE CLICKABLE) */}
      <TouchableOpacity
        style={styles.left}
        onPress={() => navigation.navigate("Profile", { user })}
      >
        <Image
          source={{
            uri: user.profileImage || "https://i.pravatar.cc/100"
          }}
          style={styles.avatar}
        />

        <View style={{ marginLeft: 10 }}>
          <Text style={styles.name}>
            {user.name || "User"}
          </Text>

          <Text style={styles.location}>
            {user.state
              ? `${user.state}, ${user.district}`
              : "Farmer • AgriBond"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 🔥 MESSAGE BUTTON */}
      <TouchableOpacity
        style={styles.msgBtn}
        onPress={goToChat}
      >
        <Text style={styles.msgText}>Message</Text>
      </TouchableOpacity>

    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "#eee",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#ddd",
  },

  name: {
    fontWeight: "bold",
    fontSize: 15,
  },

  location: {
    color: "gray",
    fontSize: 12,
    marginTop: 2,
  },

  msgBtn: {
    backgroundColor: "#2e7d32", // 🌱 Agri green
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  msgText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
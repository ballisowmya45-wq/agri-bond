import axios from "axios";
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useUser } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function UserCard({ user, reload }) {
  const { userProfile } = useUser();
  const MY_ID = userProfile?._id;
  const navigation = useNavigation();

  const sendRequest = async () => {
    try {
      await axios.post(`${API_URL}/api/network/send-request`, {
        fromId: MY_ID,
        toId: user._id,
      });
      reload && reload();
    } catch (err) {
      console.log("REQUEST ERROR:", err);
    }
  };

  // 🔥 BUTTON STATE LOGIC
  let buttonText = "Connect";
  let buttonStyle = styles.connectBtn;
  let textStyle = styles.connectText;

  if (user.isConnected) {
    buttonText = "Connected";
    buttonStyle = styles.connectedBtn;
    textStyle = styles.connectedText;
  } else if (user.isRequested) {
    buttonText = "Pending";
    buttonStyle = styles.pendingBtn;
    textStyle = styles.pendingText;
  }

  return (
    <View style={styles.card}>

      {/* LEFT SIDE */}
      <TouchableOpacity
        style={styles.left}
        onPress={() => navigation.navigate("Profile", { user })}
      >
      <View style={styles.left}>
        <Image
          source={{ uri: user.profileImage }}
          style={styles.avatar}
        />
        <View style={{ marginLeft: 10 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.location}>
              {user.state ? `${user.state}, ${user.district}` : "Unknown Location"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>


      {/* RIGHT SIDE BUTTON */}
      <TouchableOpacity
        onPress={sendRequest}
        disabled={user.isRequested || user.isConnected}
        style={buttonStyle}
      >
        <Text style={textStyle}>{buttonText}</Text>
      </TouchableOpacity>

    </View>
  );
}

/* 🔥 STYLES (INSIDE SAME FILE) */

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
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

  // 🔥 CONNECT BUTTON
  connectBtn: {
    borderWidth: 1,
    borderColor: "#0A66C2",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  connectText: {
    color: "#0A66C2",
    fontWeight: "bold",
  },

  // 🔥 PENDING
  pendingBtn: {
    backgroundColor: "#eee",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  pendingText: {
    color: "gray",
    fontWeight: "bold",
  },

  // 🔥 CONNECTED
  connectedBtn: {
    backgroundColor: "#0A66C2",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  connectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
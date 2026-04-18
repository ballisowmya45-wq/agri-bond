import axios from "axios";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet
} from "react-native";
import { useUser } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RequestCard({ user, reload }) {
  const { userProfile } = useUser();
  const MY_ID = userProfile?._id;
  const navigation = useNavigation();

  /* -------- ACCEPT -------- */
  const accept = async () => {
    try {
      await axios.post(`${API_URL}/api/network/accept-request`, {
        userId: MY_ID,
        requesterId: user._id,
      });
      reload && reload();
    } catch (err) {
      console.log("ACCEPT ERROR:", err);
    }
  };

  /* -------- IGNORE -------- */
  const ignore = async () => {
    try {
      await axios.post(`${API_URL}/api/network/remove-request`, {
        userId: MY_ID,
        requesterId: user._id,
      });
      reload && reload();
    } catch (err) {
      console.log("IGNORE ERROR:", err);
    }
  };

  return (
    <View style={styles.card}>

      {/* LEFT SIDE */}
      <TouchableOpacity
        style={styles.left}
        onPress={() => navigation.navigate("Profile", { user })}
      >
              <View style={styles.left}>
        <Image
          source={{
            uri:
              user.profileImage ||
              "https://i.pravatar.cc/100"
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
              : "Unknown location"}
          </Text>
        </View>
      </View>
      </TouchableOpacity>


      {/* RIGHT SIDE BUTTONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={accept}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ignoreBtn} onPress={ignore}>
          <Text style={styles.ignoreText}>Ignore</Text>
        </TouchableOpacity>
      </View>

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

  actions: {
    flexDirection: "row",
  },

  acceptBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },

  acceptText: {
    color: "#fff",
    fontWeight: "bold",
  },

  ignoreBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  ignoreText: {
    color: "gray",
    fontWeight: "bold",
  },
});
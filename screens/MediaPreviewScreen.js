import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import axios from "axios";
import socket from "../services/socket";
import { useUser } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get("window");

export default function MediaPreviewScreen({ route, navigation }) {
  const { media, chatId, user, mode } = route.params;
  const { userProfile } = useUser();
  const MY_ID = userProfile?._id;

  const [selectedMedia, setSelectedMedia] = useState(media);
  const [sending, setSending] = useState(false);

  /* 🔥 REMOVE MEDIA */
  const removeMedia = (index) => {
    const updated = [...selectedMedia];
    updated.splice(index, 1);
    setSelectedMedia(updated);
  };

  /* 🔥 SEND MEDIA */
const sendMedia = async () => {
  try {
    if (selectedMedia.length === 0) return;

    setSending(true);

    const formData = new FormData();

    formData.append("chatId", chatId);
    formData.append("sender", MY_ID);

    selectedMedia.forEach((item, index) => {
      const file = {
        uri: item.uri,
        type: item.type === "video" ? "video/mp4" : "image/jpeg",
        name:
          item.type === "video"
            ? `video-${index}.mp4`
            : `image-${index}.jpg`,
      };

      if (item.type === "image") {
        formData.append("images", file);
      } else {
        formData.append("video", file);
      }
    });

    // 🔥 SEND TO BACKEND (NOT CLOUDINARY)
    await axios.post(`${API_URL}/api/chat/sendMedia`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    navigation.goBack();

  } catch (err) {
    console.log("MEDIA ERROR:", err.response?.data || err.message);
    Alert.alert("Error", "Failed to send media");
  }

  setSending(false);
};

  return (
    <View style={styles.container}>

      {/* 🔥 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Preview</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* 🔥 MEDIA LIST */}
      <FlatList
        data={selectedMedia}
        horizontal
        pagingEnabled
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item, index }) => (
        <View style={styles.mediaWrapper}>

            {/* 🔥 IMAGE */}
            {item.type === "image" && (
            <Image source={{ uri: item.uri }} style={styles.image} />
            )}

            {/* 🔥 VIDEO */}
            {item.type === "video" && (
            <Video
                source={{ uri: item.uri }}
                style={styles.image}
                useNativeControls
                resizeMode="contain"
                shouldPlay
                isLooping
            />
            )} 

            {item.type === "video" && (
            <View style={styles.playIcon}>
                <Ionicons name="play-circle" size={50} color="#fff" />
            </View>
            )}

            {/* ❌ REMOVE BUTTON */}
            <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeMedia(index)}
            >
            <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>

        </View>
        )}
      />

      {/* 🔥 SEND BUTTON */}
      {mode === "send" && (
        <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={sendMedia}
          disabled={sending}
        >
          <Ionicons name="send" size={22} color="#fff" />
          <Text style={styles.sendText}>
            {sending ? "Sending..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
      )}
      

    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  mediaWrapper: {
    width,
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: width - 20,
    height: "100%",
    resizeMode: "contain",
    borderRadius: 10,
  },

  removeBtn: {
    position: "absolute",
    top: 10,
    right: 20,
  },

  bottom: {
    position: "absolute",
    bottom: 90,
    width: "100%",
    alignItems: "center",
  },

  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },

  sendText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  },
  playIcon: {
  position: "absolute",
  alignSelf: "center",
  top: "40%",
},
});
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import axios from "axios";
import { auth } from "../firebase/firebaseConfig";
import { useUser } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";


const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AddPost() {
  const navigation = useNavigation();
  const { userProfile } = useUser();

  const [isPosting, setIsPosting] = useState(false);

  const [postText, setPostText] = useState("");
  const [mediaList, setMediaList] = useState([]);
  const [successModal, setSuccessModal] = useState(false);

  const [inputMode, setInputMode] = useState("local");

  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  /* ---------------- MEDIA ---------------- */

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
    });

  if (!result.canceled) {
    const newFiles = result.assets;

    // 🔥 CHECK VIDEO EXIST
    const hasVideo = mediaList.some(m => m.type?.includes("video"));

    if (hasVideo) {
      return alert("Only one video allowed");
    }

    // 🔥 CHECK LIMIT
    if (mediaList.length + newFiles.length > 5) {
      return alert("Maximum 5 images allowed");
    }

    setMediaList([...mediaList, ...newFiles]);
  }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });

    if (!result.canceled) {
      const file = result.assets[0];

      if (file.type?.includes("video") && mediaList.length > 0) {
        return alert("Cannot mix video with images");
      }

      if (mediaList.length >= 5) {
        return alert("Max 5 images allowed");
      }

      setMediaList([...mediaList, file]);
    }
  };

  const removeMedia = (index) => {
    const updated = [...mediaList];
    updated.splice(index, 1);
    setMediaList(updated);
  };

  /* ---------------- POLL ---------------- */

  const cancelPoll = () => {
    setIsPoll(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const removeOption = (index) => {
    const updated = [...pollOptions];
    updated.splice(index, 1);
    setPollOptions(updated);
  };

  /* ---------------- POST ---------------- */

const handlePost = async () => {
  try {
    if (isPosting) return; // 🔥 prevent double click

    if (!postText && mediaList.length === 0) {
      return alert("Post cannot be empty");
    }

    setIsPosting(true); // 🔥 START LOADING

    const idToken = await auth.currentUser.getIdToken();
    const formData = new FormData();

    formData.append("idToken", idToken);
    formData.append("textOriginal", postText);
    formData.append(
      "originalLanguage",
      inputMode === "en" ? "en" : userProfile?.languageCode
    );

    mediaList.forEach((item, index) => {
      const uri =
        Platform.OS === "ios"
          ? item.uri.replace("file://", "")
          : item.uri;

      const file = {
        uri,
        type: item.type?.includes("video") ? "video/mp4" : "image/jpeg",
        name: item.type?.includes("video")
          ? `video-${index}.mp4`
          : `image-${index}.jpg`,
      };

      if (item.type?.includes("image")) formData.append("images", file);
      else formData.append("video", file);
    });

    if (isPoll) {
      formData.append(
        "poll",
        JSON.stringify({
          question: pollQuestion,
          options: pollOptions.filter((o) => o.trim() !== ""),
        })
      );
    }

    await axios.post(`${API_URL}/api/posts/create`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setSuccessModal(true);

    setPostText("");
    setMediaList([]);
    cancelPoll();

    setTimeout(() => {
      setSuccessModal(false);
      navigation.goBack();
    }, 1500);

  } catch (err) {
    console.log(err);
    alert("Post failed");
  } finally {
    setIsPosting(false); // 🔥 STOP LOADING
  }
};

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.heading}>🌱 Create Post</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={{ padding: 15, paddingBottom: 120 }}
          enableOnAndroid
        >

          {/* LANGUAGE */}
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                inputMode === "local" && styles.activeLang
              ]}
              onPress={() => setInputMode("local")}
            >
              <Text
                style={[
                  styles.langText,
                  inputMode === "local" && styles.activeLangText
                ]}
              >
                My Language
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                inputMode === "en" && styles.activeLang
              ]}
              onPress={() => setInputMode("en")}
            >
              <Text
                style={[
                  styles.langText,
                  inputMode === "en" && styles.activeLangText
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
          </View>

          {/* INPUT BOX */}
          <View style={styles.postBox}>
            <TextInput
              style={styles.input}
              placeholder={
                inputMode === "en"
                  ? "Write in English..."
                  : "Write in your language..."
              }
              value={postText}
              onChangeText={setPostText}
              multiline
            />

            {/* MEDIA */}
            {mediaList.map((item, index) => (
              <View key={index} style={styles.mediaWrapper}>
                {item.type === "image" ? (
                  <Image source={{ uri: item.uri }} style={styles.preview} />
                ) : (
                  <Video source={{ uri: item.uri }} style={styles.preview} useNativeControls />
                )}

                <TouchableOpacity onPress={() => removeMedia(index)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            {/* ICONS */}
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={pickImage}>
                <MaterialIcons name="photo" size={26} color="#2e7d32" />
              </TouchableOpacity>

              <TouchableOpacity onPress={openCamera}>
                <Ionicons name="camera" size={26} color="#1976d2" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsPoll(true)}>
                <FontAwesome5 name="poll" size={22} color="#8e24aa" />
              </TouchableOpacity>
            </View>
          </View>

          {/* POLL */}
          {isPoll && (
            <View style={styles.pollContainer}>

              <View style={styles.pollHeader}>
                <Text style={styles.pollTitle}>Create Poll</Text>

                <TouchableOpacity onPress={cancelPoll}>
                  <Ionicons name="close" size={24} color="red" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Poll question..."
                value={pollQuestion}
                onChangeText={setPollQuestion}
                style={styles.input}
              />

              {pollOptions.map((opt, index) => (
                <View key={index} style={styles.optionRow}>
                  <TextInput
                    placeholder={`Option ${index + 1}`}
                    value={opt}
                    onChangeText={(text) => {
                      const updated = [...pollOptions];
                      updated[index] = text;
                      setPollOptions(updated);
                    }}
                    style={{ flex: 1 }}
                  />

                  {pollOptions.length > 2 && (
                    <TouchableOpacity onPress={() => removeOption(index)}>
                      <Ionicons name="close-circle" size={22} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity onPress={() => setPollOptions([...pollOptions, ""])}>
                <Text style={styles.addOption}>+ Add Option</Text>
              </TouchableOpacity>

            </View>
          )}

        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      {/* POST BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.postBtn,
            isPosting && { backgroundColor: "#9e9e9e" }
          ]}
          onPress={handlePost}
          disabled={isPosting}
        >
          <Text style={styles.postText}>
            {isPosting ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SUCCESS */}
      <Modal visible={successModal} transparent>
        <View style={styles.modal}>
          <Text style={{ color: "white" }}>Post Successful ✅</Text>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    paddingTop: 40,
    paddingBottom: 15,
    alignItems: "center",
    backgroundColor: "#fff"
  },

  heading: { fontSize: 20, fontWeight: "bold" },

langToggle: {
  flexDirection: "row",
  backgroundColor: "#e8f5e9", // light green background
  borderRadius: 30,
  padding: 4,
  marginBottom: 15,
},
langBtn: {
  flex: 1,
  paddingVertical: 8,
  alignItems: "center",
  borderRadius: 25,
},
activeLang: {
  backgroundColor: "#2e7d32", // main green
},
langText: {
  color: "#2e7d32",
  fontWeight: "500",
},
activeLangText: {
  color: "#fff",
  fontWeight: "bold",
},

  postBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd"
  },

  input: { minHeight: 50, marginBottom: 10 },

  iconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10
  },

  preview: { width: 120, height: 120, borderRadius: 10 },

  mediaWrapper: { position: "relative", marginVertical: 5 },

  removeBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#fff",
    borderRadius: 20
  },

  pollContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15
  },

  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  pollTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },

  addOption: {
    color: "#2e7d32",
    marginTop: 10,
    fontWeight: "bold",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 15,
    backgroundColor: "#fff"
  },

  postBtn: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },

  postText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)"
  }
});
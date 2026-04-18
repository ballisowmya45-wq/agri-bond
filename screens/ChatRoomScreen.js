import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  SafeAreaView,
  Keyboard,
} from "react-native";
import axios from "axios";
import socket from "../services/socket";
import { useUser } from "../context/UserContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { Video } from "expo-av";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, user } = route.params;
  const { userProfile } = useUser();
  const MY_ID = userProfile?._id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardOpenedOnce, setKeyboardOpenedOnce] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const flatListRef = useRef();

  /* ---------------- LOAD MESSAGES ---------------- */
/*       useEffect(() => {
        socket.on("getOnlineUsers", (users) => {
          setOnlineUsers(users);
        });

        return () => {
          socket.off("getOnlineUsers");
        };
    }, []); */
const translateIfNeeded = async (msg) => {
  try {
    // 🔥 don't translate my own messages
    if (msg.sender === MY_ID || msg.sender?._id === MY_ID) {
      return msg;
    }

    // 🔥 if no text → skip
    if (!msg.text) return msg;

    const res = await axios.post(`${API_URL}/api/translate`, {
      text: msg.text,
      targetLang: userProfile.languageCode,
    });

    return {
      ...msg,
      text: res.data.text,
    };
  } catch {
    return msg;
  }
};

  useEffect(() => {
    if (!chatId || !MY_ID) return;

    const loadMessages = async () => {
      const { data } = await axios.get(
        `${API_URL}/api/chat/messages/${chatId}?viewerId=${MY_ID}`
      );
        const translated = await Promise.all(
          data.map((msg) => translateIfNeeded(msg))
        );
      setMessages(translated);
    };

    loadMessages();

    socket.emit("joinChat", chatId);

    return () => {
      socket.off("receiveMessage");
    };
  }, [chatId, MY_ID]);

  /* ---------------- RECEIVE MESSAGE ---------------- */

   useEffect(() => {
    socket.on("receiveMessage", async (msg) => {
      const finalMsg = await translateIfNeeded(msg);

      setMessages((prev) => [...prev, finalMsg]);
    });

    return () => socket.off("receiveMessage");
  }, []); 

  useEffect(() => {
  socket.on("messageDeleted", ({ messageId }) => {
    setMessages((prev) =>
      prev.filter((msg) => msg._id !== messageId)
    );
  });

  return () => socket.off("messageDeleted");
}, []);

  /* ---------------- media ---------------- */
  const openMediaOptions = () => {
  Alert.alert("Select", "Choose option", [
    {
      text: "Camera",
      onPress: openCamera,
    },
    {
      text: "Gallery",
      onPress: openGallery,
    },
    {
      text: "Cancel",
      style: "cancel",
    },
  ]);
};

const openCamera = async () => {
  setLoadingMedia(true);

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 0.7,
  });

  setLoadingMedia(false);

  if (result.canceled) return;

  handleMedia(result.assets);
};


const openGallery = async () => {
  setLoadingMedia(true);

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsMultipleSelection: true,
    selectionLimit: 5, // 🔥 max 5 images
    quality: 0.7,
  });

  setLoadingMedia(false);

  if (result.canceled) return;

  handleMedia(result.assets);
};

const handleMedia = (assets) => {
  const images = assets.filter(a => a.type === "image");
  const videos = assets.filter(a => a.type === "video");

  if (videos.length > 1) {
    alert("Only 1 video allowed");
    return;
  }

  if (images.length > 5) {
    alert("Max 5 images allowed");
    return;
  }

  // 👉 navigate to preview screen (BEST UX)
  navigation.navigate("MediaPreview", {
    media: assets,
    chatId,
    user,
    mode:"send"
  });
};

  /* ---------------- SEND MESSAGE ---------------- */
const sendMessage = () => {
  if (!text.trim()) return;

   // 🔥 INSTANT UI UPDATE

  // 🔥 SEND TO BACKEND
  socket.emit("sendMessage", {
    chatId,
    sender: MY_ID,
    text,
  });
 
  setText("");
};

const handleDelete = (messageId) => {
  Alert.alert("Delete", "Delete this message?", [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Delete",
      onPress: () => {
        socket.emit("deleteMessage", {
          messageId,
          userId: MY_ID,
        });
      },
    },
  ]);
};


useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      setKeyboardOpenedOnce(true); // 🔥 important
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);



  /* ---------------- STATUS UPDATE ---------------- */
/*   useEffect(() => {
    socket.on("messageStatusUpdate", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status } : m
        )
      );
    });

    return () => socket.off("messageStatusUpdate");
  }, []);
 */
/* ---------------- SEEN ---------------- */
/*   useEffect(() => {
    messages.forEach((msg) => {
      if (msg.sender !== MY_ID && msg.status !== "seen") {
        socket.emit("messageSeen", { messageId: msg._id, chatId });
      }
    });
  }, [messages]); */

/* ---------------- MARK READ ---------------- */  
  useEffect(() => {
    if (!chatId || !MY_ID) return;
  
    socket.emit("markAsRead", {
      chatId,
      userId: MY_ID,
    });
  }, [chatId]);

  useEffect(() => {
  socket.on("messageStatusUpdate", ({ messageId, status }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, status } : msg
      )
    );
  });

  return () => socket.off("messageStatusUpdate");
}, []);


const groupMessages = (messages) => {
  const groups = [];
  let lastLabel = null; // 🔥 FIX

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    const today = new Date();

    let label = msgDate.toDateString();

    if (msgDate.toDateString() === today.toDateString()) {
      label = "Today";
    } else {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (msgDate.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      }
    }

    // ✅ FIX: compare with lastLabel, not last item
    if (label !== lastLabel) {
      groups.push({ type: "header", label });
      lastLabel = label;
    }

    groups.push({ type: "message", data: msg });
  });

  return groups;
};

  return (
    <SafeAreaView style={styles.container}>

        {loadingMedia && (
          <View style={styles.overlay}>
            <Text style={{ color: "#fff" }}>Opening...</Text>
          </View>
        )}

      {/* 🔥 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

          <Image source={{ uri: user.profileImage }} style={styles.avatar} />

          <View>
            <Text style={styles.name}>{user.name}</Text>
          </View>

      </View>

      {/* 🔥 MAIN */}
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>

        {/* MESSAGES */}
        <FlatList
          ref={flatListRef}
          data={groupMessages(  [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  ))}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
          keyExtractor={(item, index) =>   item.type === "header" ? "header-" + index : item.data._id}

          keyboardShouldPersistTaps="handled"

          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }

          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }

          renderItem={({ item }) => {
            // 🔥 HEADER
            if (item.type === "header") {
              return (
                <Text
                  style={{
                    alignSelf: "center",
                    backgroundColor: "#eee",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    marginVertical: 10,
                    fontSize: 12,
                    color: "#555",
                  }}
                >
                  {item.label}
                </Text>
              );
            }

            const msg = item.data;
            const isMe = msg.sender?._id === MY_ID || msg.sender === MY_ID;

            const time = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <TouchableOpacity
               onLongPress={() => handleDelete(msg._id)}
                style={[
                  styles.messageContainer,
                  isMe ? styles.rightAlign : styles.leftAlign
                ]}
              >

                {/* 🔥 MEDIA (NO BUBBLE) */}
                {msg.media ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("MediaPreview", {
                        media: [
                          {
                            uri: msg.media,
                            type: msg.media.includes("video") ? "video" : "image",
                          },
                        ],
                        chatId,
                        user,
                        mode:"view"
                      })
                    }
                    onLongPress={() => handleDelete(msg._id)} 
                  >
                    {msg.media.includes("image") ? (
                      <Image
                        source={{ uri: msg.media }}
                        style={styles.media}
                      />
                    ) : (
                      <Video
                        source={{ uri: msg.media }}
                        style={styles.media}
                        useNativeControls
                        resizeMode="cover"
                      />
                    )}

                    <Text style={styles.mediaTime}>{time}</Text>
                  </TouchableOpacity>
                ) : (
                  /* 🔥 TEXT (WITH BUBBLE) */
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.myBubble : styles.otherBubble
                    ]}
                  >
                    <Text style={isMe ? styles.myText : styles.otherText}>
                      {msg.text}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.time}>{time}</Text>

                    </View>
                  </View>
                )}

              </TouchableOpacity>
            );
          }}
        />

        {/* 🔥 SIMPLE INPUT BAR */}
        <View   style={[
            styles.inputContainer,
            {
              marginBottom: keyboardOpenedOnce ? 1 : 50
            }
          ]}>

          {/* IMAGE BUTTON */}
          <TouchableOpacity style={styles.iconBtn} onPress={openMediaOptions}>
            <Ionicons name="image-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>

          {/* INPUT */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            multiline
            style={styles.input}
          />

          {/* SEND BUTTON */}
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>

        </View>

      </View>
    </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 35,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
    marginTop: 20,
  },

  back: {
    fontSize: 18,
  },

  headerUser: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },

  name: {
    fontWeight: "bold",
    fontSize: 15,
  },

  status: {
    color: "gray",
    fontSize: 12,
  },

  /* MESSAGES */
messageContainer: {
  marginVertical: 4,
  flexDirection: "row",
},

leftAlign: {
  justifyContent: "flex-start",
},

rightAlign: {
  justifyContent: "flex-end",
},

bubble: {
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 16,
  maxWidth: "75%",
  marginVertical: 4,

  // 🔥 shadow (Android + iOS)
  elevation: 2,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
},

// 🔥 SENT (RIGHT)
myBubble: {
  backgroundColor: "#2e7d32", // 🌱 Agri green
  borderTopRightRadius: 4,
},

// 🔥 RECEIVED (LEFT)
otherBubble: {
  backgroundColor: "#ffffff",
  borderTopLeftRadius: 4,
  borderWidth: 0.5,
  borderColor: "#eee",
},

myText: {
  color: "#fff",
  fontSize: 16,
},

otherText: {
  color: "#000",
  fontSize: 15,
},

/* 🔥 TIME + TICKS */
metaRow: {
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: 4,
},

  /* INPUT */
inputContainer: {
  flexDirection: "row",
  alignItems: "center",
  padding: 8,
  margin: 6,
  borderRadius: 30,
  backgroundColor: "#f1f1f1",
},

input: {
  flex: 1,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
  maxHeight: 120,
},

iconBtn: {
  marginHorizontal: 5,
},

sendBtn: {
  backgroundColor: "#2e7d32",
  padding: 10,
  borderRadius: 20,
  marginLeft: 5,
},
bubbleContent: {
  flexDirection: "row",
  alignItems: "flex-end",
},

time: {
  fontSize: 10,
  color: "#ccc",
  marginRight: 4,
},

tick: {
  fontSize: 11,
  color: "#bbb",
},
overlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},
mediaBubble: {
  backgroundColor: "transparent", // 🔥 REMOVE GREEN
  padding: 0,
  elevation: 0,
  shadowOpacity: 0,
},
media: {
  width: 200,
  height: 200,
  borderRadius: 12,
},

mediaTime: {
  position: "absolute",
  bottom: 5,
  right: 8,
  fontSize: 10,
  color: "#fff",
  backgroundColor: "rgba(0,0,0,0.4)",
  paddingHorizontal: 5,
  borderRadius: 5,
},
});
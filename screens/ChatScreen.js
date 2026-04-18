/* import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Image,
  StyleSheet
} from "react-native";
import axios from "axios";
import { useUser } from "../context/UserContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ChatsScreen({ navigation }) {
  const { userProfile } = useUser();
  const MY_ID = userProfile?._id;

  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!MY_ID) return;

    const loadChats = async () => {
      const { data } = await axios.get(
        `${API_URL}/api/chat/userChats/${MY_ID}`
      );
      setChats(data);
    };

    loadChats();
  }, [MY_ID]);

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const otherUser = item.members.find(
          (m) => m._id !== MY_ID
        );

        return (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() =>
              navigation.navigate("ChatRoom", {
                chatId: item._id,
                user: otherUser,
              })
            }
          >
            <Image
              source={{ uri: otherUser.profileImage }}
              style={styles.avatar}
            />

            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.name}>{otherUser.name}</Text>
                <Text style={styles.time}>
                  {item.updatedAt?.slice(11, 16)}
                </Text>
              </View>

              <Text numberOfLines={1} style={styles.lastMsg}>
                {item.lastMessage?.text || "Media"}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  content: {
    flex: 1,
    marginLeft: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    fontWeight: "bold",
    fontSize: 15,
  },

  time: {
    fontSize: 12,
    color: "gray",
  },

  lastMsg: {
    color: "gray",
    marginTop: 4,
  },
}); */




import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { useUser } from "../context/UserContext";
import socket from "../services/socket";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ChatsScreen({ navigation }) {
  const { userProfile } = useUser();
  const MY_ID = userProfile?._id;

  const [chats, setChats] = useState([]);

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (date) => {
    if (!date) return "";

    const msgDate = new Date(date);
    const now = new Date();

    const isToday =
      msgDate.toDateString() === now.toDateString();

    if (isToday) {
      return msgDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return msgDate.toLocaleDateString();
    }
  };

  /* ---------------- LOAD CHATS ---------------- */
  const loadChats = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/chat/userChats/${MY_ID}`
      );

      // 🔥 sort by latest message
      const sorted = data.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.updatedAt;
        const bTime = b.lastMessage?.createdAt || b.updatedAt;
        return new Date(bTime) - new Date(aTime);
      });

      setChats(sorted);
    } catch (err) {
      console.log("CHAT LOAD ERROR:", err);
    }
  };

useEffect(() => {
  if (!MY_ID) return;

  loadChats();

  socket.emit("addUser", MY_ID);

  socket.on("receiveMessage", () => {
    loadChats();
  });

  // ✅ NEW: when messages read → remove badge
  socket.on("messagesRead", () => {
    loadChats();
  });

  return () => {
    socket.off("receiveMessage");
    socket.off("messagesRead");
  };
}, [MY_ID]);


  return (
    !chats.length ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No chats yet</Text>
      </View>
    ) : (   
    <FlatList
      data={chats}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const otherUser = item.members.find(
          (m) => m._id !== MY_ID
        );

        const lastMsg = item.lastMessage;

        return (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() =>
              navigation.navigate("ChatRoom", {
                chatId: item._id,
                user: otherUser,
              })
            }
          >
            {/* PROFILE */}
            <Image
              source={{ uri: otherUser.profileImage }}
              style={styles.avatar}
            />

            {/* CONTENT */}
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.name}>{otherUser.name}</Text>

                <Text style={styles.time}>
                  {formatTime(
                    lastMsg?.createdAt || item.updatedAt
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text numberOfLines={1} style={styles.lastMsg}>
                  {lastMsg?.text
                    ? lastMsg.text
                    : lastMsg?.media
                    ? "📷 Media"
                    : "No messages"}
                </Text>

                {/* 🔥 UNREAD BADGE (mock for now) */}
                {item.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  )
);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  content: {
    flex: 1,
    marginLeft: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontWeight: "bold",
    fontSize: 15,
  },

  time: {
    fontSize: 12,
    color: "gray",
  },

  lastMsg: {
    color: "gray",
    marginTop: 4,
    maxWidth: "80%",
  },

  badge: {
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
  },

});
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import axios from "axios";
import { useUser } from "../context/UserContext";
import PostCard from "../components/PostCard";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../firebase/firebaseConfig";
import { useRoute } from "@react-navigation/native";


const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ProfileScreen({ route, navigation }) {
  const { user } = route.params;
  const { userProfile, setUserProfile } = useUser();

  const MY_ID = userProfile?._id;

  const [posts, setPosts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [hasRequestedYou, setHasRequestedYou] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [connectionsCount, setConnectionsCount] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const res = await axios.get(
      `${API_URL}/api/user/profile/${user._id}?viewerId=${MY_ID}`
    );

    setConnectionsCount(res.data.user.connections.length);
    setPosts(res.data.posts || []);
    setIsConnected(res.data.isConnected);
    setIsRequested(res.data.isRequested);
    setHasRequestedYou(res.data.hasRequestedYou);

  };

  const sendRequest = async () => {
    await axios.post(`${API_URL}/api/network/send-request`, {
      fromId: MY_ID,
      toId: user._id,
    });
    setIsRequested(true);
  };

  const acceptRequest = async () => {
  await axios.post(`${API_URL}/api/network/accept-request`, {
    userId: MY_ID,
    requesterId: user._id,
  });
  setIsConnected(true);
  setHasRequestedYou(false);
};

const ignoreRequest = async () => {
  await axios.post(`${API_URL}/api/network/remove-request`, {
    userId: MY_ID,
    requesterId: user._id,
  });
  setHasRequestedYou(false);
};

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

const isMe=MY_ID === user._id;
const displayUser = isMe ? userProfile : user;

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (!result.canceled) {
    uploadImage(result.assets[0].uri);
  }
};

const uploadImage = async (uri) => {
  try {
    setUploading(true);

    const formData = new FormData();

    formData.append("image", {
      uri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    const idToken = await auth.currentUser.getIdToken();
    formData.append("idToken", idToken);

    const res = await axios.post(
      `${API_URL}/api/user/upload-profile`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    setUserProfile({
      ...userProfile,
      profileImage: res.data.profileImage,
    });

    await loadProfile();

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
  } finally {
    setUploading(false);
  }
};
 
  return (
    <FlatList
      data={posts}
      extraData={posts}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingBottom: 20 }}

      ListHeaderComponent={() => (
        <View style={styles.container}>

          {/* 🔥 TOP BANNER */}
          <View style={styles.banner} />

          {/* 🔥 PROFILE IMAGE */}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: displayUser.profileImage + "?t=" + Date.now() }} style={styles.avatar} />

            {isMe && (
              <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
                <Text style={{ color: "#fff", fontSize: 12 }}>📷</Text>
              </TouchableOpacity>
            )}
          </View>
          {uploading && (
          <Text style={{ marginTop: 5, color: "#2e7d32" }}>
            Updating profile...
          </Text>
        )}

          {/* 🔥 DETAILS */}
          <View style={styles.info}>
            <Text style={styles.name}>{displayUser.name}</Text>
            <Text style={styles.location}>
              {displayUser.state}, {displayUser.district}
            </Text>
          </View>

          {/* 🔥 BUTTON */}
          <View style={{ marginTop: 10 }}>

            {/* 🔥 SELF PROFILE */}
            {isMe ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>

                {/* CONNECTION COUNT */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("MainTabs", { screen: "Network", params: { tab: "connections" } })}
                >
                  <Text style={{ fontWeight: "bold", color: "#0A66C2" }}>
                    {connectionsCount} Connections
                  </Text>
                </TouchableOpacity>

                {/* EDIT BUTTON */}
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate("EditProfile")}
                >
                  <Text style={styles.btnTextBlue}>Edit</Text>
                </TouchableOpacity>

              </View>

            ) : isConnected ? (
              <TouchableOpacity style={styles.msgBtn} onPress={goToChat}>
                <Text style={styles.btnText}>Message</Text>
              </TouchableOpacity>

            ) : hasRequestedYou ? (
              <View style={{ flexDirection: "row", marginTop: 10 }}>

                <TouchableOpacity style={styles.acceptBtn} onPress={acceptRequest}>
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.ignoreBtn} onPress={ignoreRequest}>
                  <Text style={styles.btnTextGray}>Ignore</Text>
                </TouchableOpacity>

              </View>

            ) : isRequested ? (
              <View style={styles.pendingBtn}>
                <Text style={styles.btnTextGray}>Pending</Text>
              </View>

            ) : (
              <TouchableOpacity style={styles.connectBtn} onPress={sendRequest}>
                <Text style={styles.btnTextBlue}>Connect</Text>
              </TouchableOpacity>
            )}

          </View>

          {/* 🔥 POSTS HEADER */}
          <Text style={styles.sectionTitle}>Posts</Text>

        </View>
      )}

      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet 🌱</Text>
        </View>
      )}

      renderItem={({ item }) => (
  <PostCard
    post={item}
    showDelete={true}
    onDelete={(postId) => {
      setPosts(prev => prev.filter(p => p._id !== postId));
    }}
  />
)}
    />
    
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingBottom: 15,
  },

  // 🔥 TOP GREEN BANNER (Agri theme)
  banner: {
    width: "100%",
    height: 100,
    backgroundColor: "#4CAF50",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginTop: -45, // 🔥 pushes image down nicely
    borderWidth: 3,
    borderColor: "#fff",
  },

  info: {
    alignItems: "center",
    marginTop: 10,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
  },

  location: {
    color: "gray",
    marginTop: 4,
  },

  sectionTitle: {
    alignSelf: "flex-start",
    marginLeft: 15,
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
  },

  connectBtn: {
    borderWidth: 1,
    borderColor: "#0A66C2",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  msgBtn: {
    backgroundColor: "#0A66C2",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  pendingBtn: {
    backgroundColor: "#eee",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  btnTextBlue: {
    color: "#0A66C2",
    fontWeight: "bold",
  },

  btnTextGray: {
    color: "gray",
    fontWeight: "bold",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },

  emptyText: {
    color: "gray",
    fontSize: 14,
  },
  acceptBtn: {
  backgroundColor: "#2e7d32",
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 20,
  marginRight: 10,
},

ignoreBtn: {
  borderWidth: 1,
  borderColor: "#ccc",
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 20,
},
editBtn: {
  borderWidth: 1,
  borderColor: "#0A66C2",
  paddingHorizontal: 15,
  paddingVertical: 6,
  borderRadius: 20,
},
avatarWrapper: {
  position: "relative",
},

cameraIcon: {
  position: "absolute",
  bottom: 0,
  right: 0,
  backgroundColor: "#031404b8",
  padding: 6,
  borderRadius: 20,
},
});
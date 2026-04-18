import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import { auth } from "../firebase/firebaseConfig";
import { useUser } from "../context/UserContext";
import PostCard from "../components/PostCard";
import { useNavigation } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function HomeScreen() {
  const {userProfile} = useUser();
  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [cache, setCache] = useState({
    local: null,
    en: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("local");

  useEffect(() => {
    if (!userProfile) return;

    // 🔥 USE CACHE FIRST
    if (cache[viewMode]) {
      setPosts(cache[viewMode]);
      setLoading(false);
    } else {
      fetchPosts();
    }
  }, [viewMode, userProfile]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const idToken = await auth.currentUser.getIdToken();

      const res = await axios.post(
        `${API_URL}/api/posts/all`,
        { idToken, viewMode }
      );

      setPosts(res.data);

      // 🔥 SAVE TO CACHE
      setCache((prev) => ({
        ...prev,
        [viewMode]: res.data,
      }));

    } catch (error) {
      console.log("FETCH ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (!userProfile) {
    return <Text>Loading...</Text>;
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(); // refresh ignores cache
  };

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      viewMode={viewMode}
      userLanguage={userProfile.languageCode}
    />
  );

  /* --------------------search filter-------------------- */
  const filteredPosts = posts.filter((p) => {
    const text = search.toLowerCase();

    return (
      (p.author?.name || "").toLowerCase().includes(text) ||
      (p.author?.state || "").toLowerCase().includes(text) ||
      (p.author?.district || "").toLowerCase().includes(text) ||
      (p.textOriginal || "").toLowerCase().includes(text) ||
      (p.translatedText || "").toLowerCase().includes(text)
    );
  });

    /* 🔥 SETTINGS */
  const openSettings = () => {
    navigation.navigate("Settings");
  };


  const handleDeleteAccount = async () => {
      try {
        await axios.delete(`${API_URL}/api/user/delete/${userProfile._id}`);
        alert("Account deleted");
      } catch (err) {
        console.log(err);
      }
  };


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.appName}>Agri Bond 🌾</Text>
        <TouchableOpacity onPress={openSettings}>
          <Feather name="settings" size={22} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ProfileScreen", { user: userProfile })
          }
        >
        <Image
          source={{ uri: userProfile.profileImage }}
          style={styles.userAvatar}
        />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => navigation.navigate("Network", { tab: "all", focusSearch: true })}
        >
          <Feather name="search" size={18} color="#777" />
          <Text style={{ marginLeft: 8, color: "#777" }}>
            Search farmers...
          </Text>
        </TouchableOpacity>
      </View>

      {/* LANGUAGE TOGGLE */}
      <View style={{ flexDirection: "row", marginLeft: "auto", marginRight: 9 }}>
        <TouchableOpacity
          onPress={() => {
            if (viewMode !== "local") setViewMode("local");
          }}
        >
          <Text style={{ marginRight: 15 }}>
            {viewMode === "local" ? "🔘" : "⚪"} My Language
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (viewMode !== "en") setViewMode("en");
          }}
        >
          <Text>
            {viewMode === "en" ? "🔘" : "⚪"} English
          </Text>
        </TouchableOpacity>
      </View>

      {/* POSTS */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={{ marginTop: 10 }}>Translating...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    marginTop: 15,
  },

  appName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2e7d32",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 10,
    borderRadius: 20,
    height: 40,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
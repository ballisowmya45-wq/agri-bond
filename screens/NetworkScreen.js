import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet 
} from "react-native";
import axios from "axios";
import UserCard from "../components/UserCard";
import RequestCard from "../components/RequestCard";
import ConnectionCard from "../components/ConnectionCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { useRef } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL;


export default function NetworkScreen({ navigation, route }) {

  const initialTab = route?.params?.tab;

  const searchRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab || "all");
  const { userProfile } = useUser();
const MY_ID = userProfile?._id;

useEffect(() => {
  if (MY_ID) {
    loadData();
  }
}, [MY_ID]);

useEffect(() => {
  if (route?.params?.tab) {
    setActiveTab(route.params.tab);
  }
}, [route?.params?.tab]);

useEffect(() => {
  if (route?.params?.focusSearch) {
    setTimeout(() => {
      searchRef.current?.focus();
    }, 300); // slight delay for navigation
  }
}, [route?.params?.focusSearch]);

  const loadData = async () => {
    const usersRes = await axios.get(`${API_URL}/api/network/users/${MY_ID}`);
    const netRes = await axios.get(`${API_URL}/api/network/network/${MY_ID}`);

    setUsers(usersRes.data);
    setRequests(netRes.data.requests);
    setConnections(netRes.data.connections);
    setSentRequests(netRes.data.sent || []); // backend should send this
  };

  // 🔍 FILTER SEARCH
/*   const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.location || "").toLowerCase().includes(search.toLowerCase())
  ); */

const filterData = (data) => {
  return data.filter((u) => {
    const searchText = search.toLowerCase();

    return (
      (u.name || "").toLowerCase().includes(searchText) ||
      (u.state || "").toLowerCase().includes(searchText) ||
      (u.district || "").toLowerCase().includes(searchText)
    );
  });
};

  // 🔥 RENDER BASED ON TAB
  const renderContent = () => {
    const filtered = filterData(users);
    if (activeTab === "requests") {
      const filtered = filterData(requests);
      if (requests.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No requests received</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={filtered}
          renderItem={({ item }) => (
            <RequestCard user={item} reload={loadData} />
          )}
        />
      );
    }

    if (activeTab === "sent") {
      const filtered = filterData(sentRequests);
       if (sentRequests.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No requests sent</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={filtered}
          renderItem={({ item }) => (
            <UserCard  user={{ ...item, isRequested: true }} isPending />
          )}
        />
      );
    }

    if (activeTab === "connections") {
      const filtered = filterData(connections);
      if (connections.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Not connected to anyone yet</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={filtered}
          renderItem={({ item }) => (
            <ConnectionCard user={item} navigation={navigation} />
          )}
        />
      );
    }

    // 🔥 DEFAULT → ALL USERS
      if (filtered.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        );
      }
    return (
      <FlatList
        data={filtered}
        renderItem={({ item }) => (
          <UserCard user={item} reload={loadData} />
        )}
      />
    );
  };

return (
  <SafeAreaView style={{ flex: 1, paddingHorizontal: 10 }}>

    <View style={{ marginTop: 10 }}>

      {/* 🔍 SEARCH */}
      <TextInput
          ref={searchRef}
        placeholder="Search by name or location..."
        value={search}
        onChangeText={setSearch}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 10,
          marginBottom: 10
        }}
      />

      {/* 🔥 TABS */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 10
      }}>
        {["all", "requests", "sent", "connections"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text style={{
              color: activeTab === tab ? "#0A66C2" : "gray",
              fontWeight: "bold"
            }}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </View>

    {/* 🔥 CONTENT */}
    <View style={{ flex: 1 }}>
      {renderContent()}
    </View>

  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

  emptyText: {
    color: "gray",
    fontSize: 14,
  },
});
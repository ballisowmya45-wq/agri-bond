import React from "react";
import { View, Text, Image, FlatList } from "react-native";

export default function ChatProfileScreen({ route }) {
  const { user, media } = route.params;

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Image
        source={{ uri: user.profileImage }}
        style={{ width: 80, height: 80, borderRadius: 40 }}
      />

      <Text>{user.name}</Text>
      <Text>{user.state}, {user.district}</Text>

      <FlatList
        data={media}
        numColumns={3}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: 100, height: 100 }}
          />
        )}
      />
    </View>
  );
}
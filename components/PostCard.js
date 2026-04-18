import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Share
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import axios from "axios";
import { auth } from "../firebase/firebaseConfig";
import { KeyboardAvoidingView, Platform } from "react-native";
import { FlatList, Dimensions, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const PostCard = ({ post, viewMode, userLanguage, idToken,onDelete,showDelete }) => {

  const [showOriginal, setShowOriginal] = useState(false);
  const [updatedPost, setUpdatedPost] = useState(post);
  const { width } = Dimensions.get("window");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const navigation = useNavigation();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [translatedMap, setTranslatedMap] = useState({});
const [showOriginalMap, setShowOriginalMap] = useState({});
  const liked = updatedPost?.likes?.some(
  id => id?.toString() === updatedPost?.currentUserId?.toString()
);

const [showAllComments, setShowAllComments] = useState(false);

  const currentViewLang =
    viewMode === "en" ? "en" : userLanguage;

  const isDifferentLanguage =
    post.originalLanguage !== currentViewLang;
  

  // ✅ detect already voted
/*   useEffect(() => {
    if (!updatedPost.poll) return;

    updatedPost.poll.options.forEach((opt, index) => {
      if (opt.votes.includes(updatedPost.author?._id)) {
        setSelectedOption(index);
      }
    });
  }, [updatedPost]); */

    useEffect(() => {
  if (!updatedPost.poll) return;

  const userId = updatedPost.currentUserId;

  let found = null;

  updatedPost.poll.options.forEach((opt, index) => {
    if (opt.votes.some(v => v.toString() === userId)) {
      found = index;
    }
  });

  setSelectedOption(found);
}, [updatedPost]);

  // ✅ LIKE
  const handleLike = async () => {
  try {
    setLoading(true);
    setUpdatedPost(prev => {
  const userId = prev.currentUserId;

  const alreadyLiked = prev.likes.some(
    id => id.toString() === userId
  );

  return {
    ...prev,
    likes: alreadyLiked
      ? prev.likes.filter(id => id.toString() !== userId)
      : [...prev.likes, userId]
  };
});

    const idToken = await auth.currentUser.getIdToken();

    const { data } = await axios.post(`${API_URL}/api/posts/like`, {
      idToken,
      postId: updatedPost._id,
    });
    setUpdatedPost(data);

    // ✅ IMPORTANT FIX
   
   // setLiked(prev => !prev);

  } catch (err) {
    console.log("LIKE ERROR:", err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
};
//delete post
const handleDeletePost = async () => {
  try {
    const idToken = await auth.currentUser.getIdToken();
      console.log("DELETING POST ID:", post._id); //
    await axios.post(`${API_URL}/api/posts/delete`, {
      idToken,
      postId: post._id,
    });

    // 🔥 remove from UI
    if (onDelete) {
      onDelete(updatedPost._id);
      
    }

  } catch (err) {
    console.log("DELETE ERROR:", err.response?.data || err.message);
  }
};

  // ✅ COMMENT
  const handleComment = async () => {
    if (!comment) return;

    try {
      setLoading(true);
      const idToken = await auth.currentUser.getIdToken();

      const { data } = await axios.post(`${API_URL}/api/posts/comment`, {
        idToken,
        postId: updatedPost._id,
        text: comment,
      });

      setUpdatedPost(data);
      setComment("");

    } catch (err) {
      console.log("COMMENT ERROR:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleTranslate = async (id, text) => {
  try {
    const idToken = await auth.currentUser.getIdToken();

    const { data } = await axios.post(
      `${API_URL}/api/translate`,
      {
        idToken,
        text,
        targetLang: userLanguage
      }
    );

    setTranslatedMap(prev => ({
      ...prev,
      [id]: data.text
    }));

    setShowOriginalMap(prev => ({
      ...prev,
      [id]: false
    }));

  } catch (err) {
    console.log("TRANSLATE ERROR:", err.message);
  }
};
  const handleLikeComment = async (commentId) => {
    console.log("LIKE COMMENT CLICKED:", commentId);
  const idToken = await auth.currentUser.getIdToken();

  const { data } = await axios.post(
    `${API_URL}/api/posts/comment/like`,
    { idToken, postId: updatedPost._id, commentId }
  );

  setUpdatedPost(data);
};
const handleDeleteComment = async (commentId) => {
  console.log("DELETE CLICKED:", commentId);
  const idToken = await auth.currentUser.getIdToken();

  const { data } = await axios.post(
    `${API_URL}/api/posts/comment/delete`,
    { idToken, postId: updatedPost._id, commentId }
  );

  setUpdatedPost(data);
};
const [replyText, setReplyText] = useState("");
const [replyTo, setReplyTo] = useState(null);

const handleReply = async () => {
   console.log("REPLY CLICKED:", replyTo, replyText);
  const idToken = await auth.currentUser.getIdToken();
  

  const { data } = await axios.post(
    `${API_URL}/api/posts/comment/reply`,
    {
      idToken,
      postId: updatedPost._id,
      commentId: replyTo,
      text: replyText
    }
  );

  setUpdatedPost(data);
  setReplyText("");
  setReplyTo(null);
};
  // ✅ POLL
 const handleVote = async (index) => {
  try {
    const idToken = await auth.currentUser.getIdToken();

    // 🔥 preserve translated poll
    const currentTranslatedPoll = { ...updatedPost.poll };

    const { data } = await axios.post(`${API_URL}/api/posts/vote`, {
      idToken,
      postId: updatedPost._id,
      optionIndex: selectedOption === index ? null : index
    });

    // 🔥 merge votes without losing translation
    const mergedOptions = currentTranslatedPoll.options.map((opt, i) => ({
      ...opt,
      votes: data.poll.options[i].votes
    }));

    setUpdatedPost({
      ...data,
      translatedText: updatedPost.translatedText || data.translatedText,
      poll: {
        question: currentTranslatedPoll.question,
        options: mergedOptions
      }
    });

  } catch (err) {
    console.log("POLL ERROR:", err.response?.data || err.message);
  }
};
  // ✅ SHARE
  const handleShare = async () => {
    await Share.share({
      message: updatedPost.textOriginal || "Check this post!",
    });
  };

  return (
  /*<KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ }}
  >*/
    <View style={styles.card}>

      {/* HEADER */}
     <View style={styles.header}>

  {/* LEFT SIDE → Profile click */}
  <TouchableOpacity
    style={{ flexDirection: "row", flex: 1 }}
    onPress={() =>
      navigation.navigate("ProfileScreen", {
        user: updatedPost.author
      })
    }
  >
    <Image
      source={{
        uri:
          updatedPost.author?.profileImage ||
          "https://i.pravatar.cc/100",
      }}
      style={styles.profile}
    />

    <View>
      <Text style={styles.name}>
        {updatedPost.author?.name || "User"}
      </Text>

      <Text style={styles.location}>
        {updatedPost.author?.state}, {updatedPost.author?.district}
      </Text>
    </View>
  </TouchableOpacity>

  {/* RIGHT SIDE → DELETE ICON */}
  {showDelete && updatedPost.author?._id?.toString() === updatedPost.currentUserId && (
  <TouchableOpacity onPress={handleDeletePost}>
    <Ionicons name="trash-outline" size={20} color="red" />
  </TouchableOpacity>
)}

</View>

      {/* TEXT */}
      <Text style={styles.content}>
        {showOriginal
          ? updatedPost.textOriginal
          : updatedPost.translatedText || updatedPost.textOriginal}
      </Text>

      {isDifferentLanguage && (
        <TouchableOpacity onPress={() => setShowOriginal(!showOriginal)}>
          <Text style={styles.toggle}>
            {showOriginal ? "Show Translated" : "Show Original"}
          </Text>
        </TouchableOpacity>
      )}

      {/* POLL */}
      {updatedPost.poll && (
        <View style={{ marginTop: 10, marginBottom: 10 }}>
          <Text style={{ fontWeight: "bold" }}>
            {updatedPost.poll.question}
          </Text>

          {updatedPost.poll.options.map((opt, index) => {

            const totalVotes = updatedPost.poll.options.reduce(
              (sum, o) => sum + o.votes.length,
              0
            );

            const percent =
              totalVotes > 0
                ? (opt.votes.length / totalVotes) * 100
                : 0;

            const isSelected = selectedOption === index;

            return (
              /*<TouchableOpacity
                key={index}
                disabled={loading}
                onPress={() => handleVote(index)}
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: isSelected ? "#1976d2" : "#f1f1f1"
                }}
              >
                <Text style={{ color: isSelected ? "white" : "black" }}>
                  {opt.text}
                </Text>

                <Text style={{ color: isSelected ? "white" : "gray" }}>
                  {Math.round(percent)}%
                </Text>
              </TouchableOpacity>*/
              <TouchableOpacity
  key={index}
  disabled={loading}
  onPress={() => handleVote(index)}
  style={{
  /*  marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f1f1f1"*/
    marginTop: index === 0 ? 8 : 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    backgroundColor: isSelected ? "#1976d2" : "#f1f1f1"
  }}
>

  {/* ✅ PERCENTAGE BAR */}
  <View
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: `${Math.round(percent)}%`,
      backgroundColor: isSelected ? "#1976d2" :"#e0e0e0"
    }}
  />

  {/* ✅ CONTENT */}
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12
    }}
  >
    <Text style={{ color: isSelected ? "white" : "black" }}>
      {opt.text}
    </Text>

    <Text style={{ color: isSelected ? "white" : "black" }}>
      {Math.round(percent)}%
    </Text>
  </View>

</TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* MEDIA */}
      {/*updatedPost.images?.map((img, i) => (
        <Image key={i} source={{ uri: img }} style={styles.media} />
      ))*/}
     {/* ✅ COMBINED MEDIA CAROUSEL */}
{(updatedPost.images?.length > 0 || updatedPost.video) && (
   //<View style={{ marginTop: }}>
  <FlatList
    data={[
      ...(updatedPost.images || []).map(img => ({ type: "image", uri: img })),
      ...(updatedPost.video ? [{ type: "video", uri: updatedPost.video }] : [])
    ]}
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    keyExtractor={(item, index) => index.toString()}
    renderItem={({ item }) => (
      <View style={{ width: width - 24, marginRight: 10 }}>
        
        {item.type === "image" ? (
          <TouchableOpacity onPress={() => setSelectedImage(item.uri)}>
            <Image
              source={{ uri: item.uri }}
              style={{
                width: "100%",
                height: 250,
                borderRadius: 10
              }}
            />
          </TouchableOpacity>
        ) : (
          <Video
            source={{ uri: item.uri }}
            style={{
              width: "100%",
              height: 250,
              borderRadius: 10
            }}
            useNativeControls
          />
        )}

      </View>
    )}
  />
 // </View>
)}
      {/* ACTIONS */}
      <View style={styles.actions}>
        
        

        <TouchableOpacity
          disabled={loading}
          onPress={handleLike}
          style={styles.actionItem}
        >
          <Ionicons
  name={liked ? "heart" : "heart-outline"}
  size={22}
  color={liked ? "red" : "black"}
/>
          <Text>Like ({updatedPost.likes?.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
  style={styles.actionItem}
  onPress={() => setShowAllComments(prev => !prev)}
>
          <Ionicons name="chatbubble-outline" size={22} />
          <Text>Comment ({updatedPost.comments?.length})</Text>
        </TouchableOpacity>
        

        <TouchableOpacity onPress={handleShare} style={styles.actionItem}>
          <Ionicons name="share-outline" size={22} />
          <Text>Share</Text>
        </TouchableOpacity>

      </View>
    {updatedPost.comments?.length > 0 && (
  <View style={{ marginTop: 10 }}>

    {(updatedPost.comments || [])
      .slice(showAllComments ? 0 : -2)
      .map((c, i) => {

        const isCommentLiked = (c.likes || []).some(
          id => id.toString() === updatedPost.currentUserId
        );
                   const isOriginal = showOriginalMap[c._id];
const displayText =
  isOriginal || !translatedMap[c._id]
    ? c.text
    : translatedMap[c._id];

        return (
          <View key={i} style={{ marginBottom: 10 }}>

            {/* NAME */}
            <Text style={{ fontWeight: "bold" }}>
              {c.user?.name || "User"}
            </Text>

            {/* TEXT */}


<Text>
  {displayText.split(/(@\w+)/g).map((part, index) =>
    part.startsWith("@") ? (
      <Text key={index} style={{ color: "#1976d2" }}>
        {part}
      </Text>
    ) : (
      part
    )
  )}
</Text>
{!translatedMap[c._id] ? (
  <TouchableOpacity onPress={() => handleTranslate(c._id, c.text)}>
    <Text style={{ color: "#1976d2" }}>Translate</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity
    onPress={() =>
      setShowOriginalMap(prev => ({
        ...prev,
        [c._id]: !prev[c._id]
      }))
    }
  >
    <Text style={{ color: "#1976d2" }}>
      {showOriginalMap[c._id]
        ? "Show Translated"
        : "Show Original"}
    </Text>
  </TouchableOpacity>
)}

            {/* ACTIONS */}
            <View style={{ flexDirection: "row", gap: 15, marginTop: 5 }}>

              {/* LIKE */}
              <TouchableOpacity onPress={() => handleLikeComment(c._id)}>
                <Text style={{ color: isCommentLiked ? "red" : "gray" }}>
                  Like ({c.likes?.length || 0})
                </Text>
              </TouchableOpacity>

              {/* REPLY */}
              <TouchableOpacity onPress={() => {
  console.log("REPLY CLICKED:", c._id);
  setReplyTo(c._id.toString());
}}>
                <Text style={{ color: "#1976d2" }}>Reply</Text>
              </TouchableOpacity>

              {/* DELETE */}
              {c.user?._id?.toString() === updatedPost.currentUserId && (
                <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
                  <Text style={{ color: "red" }}>Delete</Text>
                </TouchableOpacity>
              )}

            </View>

            {/* REPLIES */}
           {c.replies?.map((r, idx) => {

  // ✅ MOVE HERE
  const replyId = r._id || `${c._id}-${idx}`;
  const isOriginal = showOriginalMap[replyId];

  const displayText =
    isOriginal || !translatedMap[replyId]
      ? r.text
      : translatedMap[replyId];

  return (
    <View key={idx} style={{ marginLeft: 20, marginTop: 5 }}>

      <Text style={{ fontWeight: "bold" }}>
        {r.user?.name || "User"}
      </Text>

      <Text>
        {displayText.split(/(@\w+)/g).map((part, index) =>
          part.startsWith("@") ? (
            <Text key={index} style={{ color: "#1976d2" }}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>

      {/* TRANSLATE BUTTON */}
      {!translatedMap[replyId] ? (
        <TouchableOpacity onPress={() => handleTranslate(replyId, r.text)}>
          <Text style={{ color: "#1976d2" }}>
            Translate
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() =>
            setShowOriginalMap(prev => ({
              ...prev,
              [replyId]: !prev[replyId]
            }))
          }
        >
          <Text style={{ color: "#1976d2" }}>
            {showOriginalMap[replyId]
              ? "Show Translated"
              : "Show Original"}
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
})}

          </View>
        );
      })}
  </View>
)}
{replyTo && (
  <View style={{ marginTop: 10 }}>

    {/* 🔥 Show replying info */}
    <Text style={{ color: "gray", marginBottom: 5 }}>
      Replying to comment...
    </Text>

    <View style={{ flexDirection: "row" }}>
      <TextInput
        value={replyText}
        onChangeText={setReplyText}
        placeholder="Write reply..."
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 8
        }}
      />

      <TouchableOpacity onPress={handleReply}>
        <Text style={{ marginLeft: 10, color: "#1976d2" }}>
          Send
        </Text>
      </TouchableOpacity>
    </View>

    {/* ❌ Cancel reply */}
    <TouchableOpacity onPress={() => setReplyTo(null)}>
      <Text style={{ color: "red", marginTop: 5 }}>
        Cancel
      </Text>
    </TouchableOpacity>

  </View>
)}

      {/* COMMENT INPUT */}
      <View style={{ flexDirection: "row", marginTop: 10 }}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Write comment... @username"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 8
          }}
        />

        <TouchableOpacity
  disabled={loading || !comment.trim()}
  onPress={handleComment}
>
          <Text style={{ marginLeft: 10, color: "#1976d2" }}>
            Post
          </Text>
        </TouchableOpacity>
      </View>
      <Modal visible={!!selectedImage} transparent={true}>
  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center"
    }}
    onPress={() => setSelectedImage(null)}
  >
    <Image
      source={{ uri: selectedImage }}
      style={{
        width: "100%",
        height: "80%",
        resizeMode: "contain"
      }}
    />
  </TouchableOpacity>
</Modal>

    </View>
    //</KeyboardAvoidingView>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
  },
  header: {
    flexDirection: "row",
    marginBottom: 8,
  },
  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    fontWeight: "bold",
  },
  location: {
    color: "gray",
    fontSize: 12,
  },
  content: {
    marginVertical: 8,
  },
  toggle: {
    color: "#1976d2",
  },
  media: {
    width: "100%",
    height: 200,
    marginTop: 8,
    borderRadius: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfileState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await AsyncStorage.getItem("userProfile");
        if (data) {
          setUserProfileState(JSON.parse(data));
        }
      } catch (err) {
        console.log("LOAD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const setUserProfile = async (user) => {
    try {
      if (user) {
        await AsyncStorage.setItem("userProfile", JSON.stringify(user));
        setUserProfileState(user);
      } else {
        await AsyncStorage.removeItem("userProfile");
        setUserProfileState(null);
      }
    } catch (err) {
      console.log("SAVE ERROR:", err);
    }
  };

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
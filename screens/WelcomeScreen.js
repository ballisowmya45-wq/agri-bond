import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

import { auth } from "../firebase/firebaseConfig";
import firebaseConfig from "../firebase/firebaseConfig";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { signInWithPhoneNumber } from "firebase/auth";
import axios from "axios";
import { useUser } from "../context/UserContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function WelcomeScreen({ navigation }) {
  const { setUserProfile } = useUser();
  const recaptchaVerifier = useRef(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // 🔥 TIMER EFFECT
  useEffect(() => {
    let interval;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && confirmation) {
      setCanResend(true);
    }

    return () => clearInterval(interval);
  }, [timer]);

  // 🔥 SEND OTP
  const sendOTP = async () => {
    if (!phone || phone.length !== 10)
      return Alert.alert("Enter valid 10 digit number");

    try {
      setLoading(true);

      const formatted = `+91${phone}`;

      const result = await signInWithPhoneNumber(
        auth,
        formatted,
        recaptchaVerifier.current
      );

      setConfirmation(result);

      setTimer(60);
      setCanResend(false);

    } catch (error) {
      Alert.alert("Error", error.message);
    }

    setLoading(false);
  };

  // 🔥 RESEND OTP
  const resendOTP = async () => {
    if (!canResend) return;

    try {
      setLoading(true);

      const formatted = `+91${phone}`;

      const result = await signInWithPhoneNumber(
        auth,
        formatted,
        recaptchaVerifier.current
      );

      setConfirmation(result);
      setTimer(60);
      setCanResend(false);

    } catch (error) {
      Alert.alert("Error", error.message);
    }

    setLoading(false);
  };

  // 🔥 VERIFY OTP
const verifyOTP = async () => {
  if (!otp || otp.length !== 6)
    return Alert.alert("Enter valid 6 digit OTP");

  try {
    setLoading(true);

    const result = await confirmation.confirm(otp);
    const idToken = await result.user.getIdToken();
    
     

    const res = await axios.post(
      `${API_URL}/api/user/check-user`,
      { idToken }
    );

    // 🔥 IMPORTANT: SAVE USER
    if (res.data.user) {
      await setUserProfile(res.data.user);
    }

if (res.data.exists) {
  navigation.reset({
    index: 0,
    routes: [{ name: "MainTabs" }],
  });
} else {
  navigation.navigate("CompleteProfile");
}

  } catch (error) {
    console.log("OTP ERROR:", error);
    Alert.alert("Invalid or Expired OTP");
  }

  setLoading(false);
};

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require("../assets/background.jpeg")}
        style={styles.background}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" />

        {/* Invisible Recaptcha */}
        <View style={{ height: 0 }}>
          { <FirebaseRecaptchaVerifierModal
            ref={recaptchaVerifier}
            firebaseConfig={firebaseConfig}
            //attemptInvisibleVerification={true}
          /> }
        </View>

        <View style={styles.overlay} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
          style={{ flex: 1 }}
        >
          <View style={styles.mainContainer}>

            {/* HERO CENTER */}
            <View style={styles.heroWrapper}>
              <Text style={styles.title}>🌾AgriBond🌾</Text>
              <Text style={styles.subtitle}>
                Empowering Indian Agriculture
              </Text>
            </View>

            {/* INPUTS BOTTOM */}
            <View style={styles.inputSection}>
              {!confirmation ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      placeholder="Enter Mobile Number"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                      value={phone}
                      onChangeText={setPhone}
                      style={styles.input}
                      maxLength={10}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={sendOTP}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    style={styles.otpInput}
                    maxLength={6}
                  />

                  {/* TIMER */}
                  {timer > 0 ? (
                    <Text style={styles.timerText}>
                      OTP expires in 00:
                      {timer < 10 ? `0${timer}` : timer}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={resendOTP}>
                      <Text style={styles.resendText}>
                        Didn't receive OTP? Resend OTP
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.button}
                    onPress={verifyOTP}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        Verify & Continue
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 60, 25, 0.45)",
  },

  mainContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingVertical: 60,
  },

  heroWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#e8f5e9",
  },

  inputSection: {
    marginBottom: 30,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
  },

  countryCode: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
    color: "#2e7d32",
  },

  input: {
    flex: 1,
    fontSize: 16,
  },

  otpInput: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingVertical: 14,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 6,
    marginBottom: 15,
  },

  timerText: {
    textAlign: "center",
    color: "#ffffff",
    marginBottom: 15,
  },

  resendText: {
    textAlign: "center",
    color: "#ffffff",
    marginBottom: 15,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDudT-7QJ1djzbQRdyyyh4iScPfSg7HpiQ",
  authDomain: "agri-bond-7df79.firebaseapp.com",
  projectId: "agri-bond-7df79",
  appId: "1:152976416129:web:e7ea9adb6012fe5e53dc80",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default firebaseConfig;
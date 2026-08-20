import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk",
    authDomain: "manhfilm-105b3.firebaseapp.com",
    projectId: "manhfilm-105b3",
    storageBucket: "manhfilm-105b3.firebasestorage.app",
    messagingSenderId: "812294175210",
    appId: "1:812294175210:web:9f8795c9cbfa2b486ada93",
    measurementId: "G-NWLLNRS8LZ"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services với bộ nhớ đệm IndexedDB đa tab (tiết kiệm tối đa lượt đọc Firestore)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

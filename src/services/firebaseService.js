import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { uploadImageToCloudinary } from "../config/cloudiaryConfig";

export const addDocument = async (collectionName, values) => {
    try {
        if (values.imgUrl && !values.imgUrl.includes("res.cloudinary.com")) {
            const imgUrl = await uploadImageToCloudinary(values.imgUrl, collectionName);
            values.imgUrl = imgUrl;
        }
        if (values.avatarUrl && !values.avatarUrl.includes("res.cloudinary.com")) {
            const avatarUrl = await uploadImageToCloudinary(values.avatarUrl, collectionName);
            values.avatarUrl = avatarUrl;
        }
        
        values.createdAt = Date.now();
        values.updatedAt = Date.now();
        
        const docRef = await addDoc(collection(db, collectionName), values);
        const addedDoc = await getDoc(doc(db, collectionName, docRef.id));
        return { id: docRef.id, ...addedDoc.data() };
    } catch (error) {
        console.error('Error adding document:', error);
        throw error;
    }
};

export const fetchDocumentsRealtime = (collectionName, callback) => {
    const collectionRef = collection(db, collectionName);

    const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        documents.sort((a, b) => {
            const timeA = a.createdAt || 0;
            const timeB = b.createdAt || 0;
            return timeB - timeA;
        });

        callback(documents);
    });

    return unsubscribe;
};

export const updateDocument = async (collectionName, values) => {
    const { id, ...updatedValues } = values;

    if (updatedValues.imgUrl && !updatedValues.imgUrl.includes("res.cloudinary.com")) {
        const imgUrl = await uploadImageToCloudinary(updatedValues.imgUrl, collectionName);
        updatedValues.imgUrl = imgUrl;
    }
    
    if (updatedValues.avatarUrl && !updatedValues.avatarUrl.includes("res.cloudinary.com")) {
        const avatarUrl = await uploadImageToCloudinary(updatedValues.avatarUrl, collectionName);
        updatedValues.avatarUrl = avatarUrl;
    }

    updatedValues.updatedAt = Date.now();

    await updateDoc(doc(collection(db, collectionName), values.id), updatedValues);
};

export const deleteDocument = async (collectionName, values) => {
    const id = values.id;

    if (collectionName === "Movies") {
        const epQ = query(collection(db, "Episodes"), where("movieID", "==", id));
        const epSnap = await getDocs(epQ);
        epSnap.forEach(async (docSnap) => await deleteDoc(doc(db, "Episodes", docSnap.id)));

        const stQ = query(collection(db, "ShowTimes"), where("movieId", "==", id));
        const stSnap = await getDocs(stQ);
        stSnap.forEach(async (docSnap) => await deleteDoc(doc(db, "ShowTimes", docSnap.id)));

        const cmQ = query(collection(db, "Comments"), where("moviesId", "==", id));
        const cmSnap = await getDocs(cmQ);
        cmSnap.forEach(async (docSnap) => await deleteDoc(doc(db, "Comments", docSnap.id)));

        const rvQ = query(collection(db, "Reviews"), where("moviesId", "==", id));
        const rvSnap = await getDocs(rvQ);
        rvSnap.forEach(async (docSnap) => await deleteDoc(doc(db, "Reviews", docSnap.id)));
    } 
    else if (["Characters", "Actors", "Categories", "Authors"].includes(collectionName)) {
        const moviesSnap = await getDocs(collection(db, "Movies"));
        for (const docSnap of moviesSnap.docs) {
            const movieData = docSnap.data();
            let needsUpdate = false;
            let updatedData = {};

            if (collectionName === "Characters" && movieData.list_Character?.includes(id)) {
                updatedData.list_Character = movieData.list_Character.filter(e => e !== id);
                needsUpdate = true;
            }
            if (collectionName === "Actors" && movieData.list_Actor?.includes(id)) {
                updatedData.list_Actor = movieData.list_Actor.filter(e => e !== id);
                needsUpdate = true;
            }
            if (collectionName === "Categories" && movieData.list_Category?.includes(id)) {
                updatedData.list_Category = movieData.list_Category.filter(e => e !== id);
                needsUpdate = true;
            }
            if (collectionName === "Authors" && (movieData.author === id || movieData.author_id === id)) {
                if (movieData.author === id) updatedData.author = "";
                if (movieData.author_id === id) updatedData.author_id = "";
                needsUpdate = true;
            }

            if (needsUpdate) {
                await updateDoc(doc(db, "Movies", docSnap.id), updatedData);
            }
        }
    }

    await deleteDoc(doc(collection(db, collectionName), id));
};

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { uploadImageToCloudinary } from "../config/cloudinaryConfig";

const CREATED_AT_COLLECTIONS = ["Movies", "Users", "Reviews", "Comments", "Favorites", "Folders", "MoviesSave", "WatchHistory"];

const uploadIfNeeded = async (url, collectionName) => {
    if (url && !url.includes("res.cloudinary.com") && (url.startsWith("data:image") || url.startsWith("http"))) {
        return await uploadImageToCloudinary(url, collectionName);
    }
    return url;
};

export const addDocument = async (collectionName, values) => {
    try {
        if (values.imgUrl) values.imgUrl = await uploadIfNeeded(values.imgUrl, collectionName);
        if (values.avatarUrl) values.avatarUrl = await uploadIfNeeded(values.avatarUrl, collectionName);
        if (CREATED_AT_COLLECTIONS.includes(collectionName)) values.createdAt = Date.now();

        const docRef = await addDoc(collection(db, collectionName), values);
        await updateDoc(doc(db, collectionName, docRef.id), { id: docRef.id });
        const addedDoc = await getDoc(doc(db, collectionName, docRef.id));
        return { id: docRef.id, ...addedDoc.data() };
    } catch (error) {
        throw error;
    }
};

export const fetchDocumentsRealtime = (collectionName, callback) => {
    return onSnapshot(collection(db, collectionName), (snapshot) => {
        const documents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        documents.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        callback(documents);
    });
};

export const fetchDocumentsRealtimePage = (collectionName, pageSize, callback) => {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(pageSize));
    return onSnapshot(q, (snapshot) => {
        const documents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(documents, snapshot.docs[snapshot.docs.length - 1]);
    });
};

export const updateDocument = async (collectionName, values) => {
    const { id, ...updatedValues } = values;
    if (updatedValues.imgUrl) updatedValues.imgUrl = await uploadIfNeeded(updatedValues.imgUrl, collectionName);
    if (updatedValues.avatarUrl) updatedValues.avatarUrl = await uploadIfNeeded(updatedValues.avatarUrl, collectionName);
    updatedValues.updatedAt = Date.now();
    await updateDoc(doc(db, collectionName, id), updatedValues);
};

export const deleteDocument = async (collectionName, values) => {
    const id = values.id;

    if (collectionName === "Movies") {
        const relatedCollections = ["Episodes", "ShowTimes", "Comments", "Reviews"];
        for (const col of relatedCollections) {
            const snap = await getDocs(query(collection(db, col), where("movieID", "==", id)));
            for (const d of snap.docs) await deleteDoc(doc(db, col, d.id));
        }
    } else if (["Characters", "Actors", "Categories", "Authors"].includes(collectionName)) {
        const fieldMap = { Characters: "listCharacter", Actors: "listActor", Categories: "listCategory", Authors: "listAuthor" };
        const field = fieldMap[collectionName];
        const moviesSnap = await getDocs(collection(db, "Movies"));

        for (const d of moviesSnap.docs) {
            const data = d.data();
            const updatedData = {};
            let needsUpdate = false;

            if (data[field]?.includes(id)) {
                updatedData[field] = data[field].filter(e => e !== id);
                needsUpdate = true;
            }
            if (needsUpdate) await updateDoc(doc(db, "Movies", d.id), updatedData);
        }
    }

    await deleteDoc(doc(db, collectionName, id));
};

export const fetchDataById = (collectionName, fieldName, fieldValue, callback) => {
    const q = query(collection(db, collectionName), where(fieldName, "==", fieldValue));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
};

export const getDocumentById = async (collectionName, docId) => {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

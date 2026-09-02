import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, updateDoc, setDoc, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { uploadImageToCloudinary } from "../config/cloudinaryConfig";

const CREATED_AT_COLLECTIONS = ["Movies", "Users", "Reviews", "Comments", "Favorites", "Folders", "MoviesSave", "WatchHistory"];

const uploadIfNeeded = async (url, collectionName) => {
    try {
        if (url && typeof url === 'string' && url.startsWith("data:image") && !url.includes("res.cloudinary.com")) {
            return await uploadImageToCloudinary(url, collectionName);
        }
    } catch (err) {
        console.warn("Could not upload image to Cloudinary, using original:", err);
    }
    return url;
};

export const addDocument = async (collectionName, values) => {
    try {
        if (values.imgUrl) values.imgUrl = await uploadIfNeeded(values.imgUrl, collectionName);
        if (values.avatarUrl) values.avatarUrl = await uploadIfNeeded(values.avatarUrl, collectionName);
        
        const docRef = doc(collection(db, collectionName));
        const finalData = {
            ...values,
            id: docRef.id,
            ...(CREATED_AT_COLLECTIONS.includes(collectionName) ? { createdAt: Date.now() } : {})
        };
        await setDoc(docRef, finalData);
        return finalData;
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

export const updateDocument = async (collectionName, values, skipUpdatedAt = false) => {
    const { id, ...updatedValues } = values;
    if (updatedValues.imgUrl) updatedValues.imgUrl = await uploadIfNeeded(updatedValues.imgUrl, collectionName);
    if (updatedValues.avatarUrl) updatedValues.avatarUrl = await uploadIfNeeded(updatedValues.avatarUrl, collectionName);
    if (!skipUpdatedAt) {
        updatedValues.updatedAt = Date.now();
    }
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

export const getTop5Films = async () => {
    try {

        const q = query(
            collection(db, "Movies"),
            orderBy("views", "desc"),
            limit(5)
        );

        const snapshot = await getDocs(q);

        const films = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        return films;

    } catch (error) {

        console.error(
            "Error getting top 5 films:",
            error
        );

        return [];

    }
};


export const getTop5RentedFilms = async () => {
    try {

        // 1. Get all rent records
        const rentSnapshot = await getDocs(collection(db, "RentMovies"));

        // 2. Count rentals per movieID
        const rentCount = {};
        rentSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const movieID = data.movieID;
            if (movieID) {
                rentCount[movieID] = (rentCount[movieID] || 0) + 1;
            }
        });

        // 3. Sort by count and take top 5
        const top5 = Object.entries(rentCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // 4. Fetch movie details for each
        const films = await Promise.all(
            top5.map(async ([movieID, count]) => {
                const movieDoc = await getDoc(doc(db, "Movies", movieID));
                if (movieDoc.exists()) {
                    return {
                        id: movieDoc.id,
                        ...movieDoc.data(),
                        rentCount: count,
                    };
                }
                return null;
            })
        );

        return films.filter(Boolean);

    } catch (error) {

        console.error(
            "Error getting top 5 rented films:",
            error
        );

        return [];

    }
};
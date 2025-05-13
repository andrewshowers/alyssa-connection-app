// src/services/challengeService.js
import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  setDoc,
  updateDoc,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { getCurrentUser } from "./authService";

// Get challenge for a specific date
export const getChallengeByDate = async (date) => {
  try {
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    const startOfDay = Timestamp.fromDate(formattedDate);
    formattedDate.setHours(23, 59, 59, 999);
    const endOfDay = Timestamp.fromDate(formattedDate);
    
    const challengesRef = collection(db, "challenges");
    const q = query(
      challengesRef, 
      where("date", ">=", startOfDay),
      where("date", "<=", endOfDay)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    };
  } catch (error) {
    console.error("Error getting challenge by date: ", error);
    throw error;
  }
};

// Get all challenges
export const getAllChallenges = async () => {
  try {
    const challengesRef = collection(db, "challenges");
    const q = query(challengesRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
  } catch (error) {
    console.error("Error getting challenges: ", error);
    throw error;
  }
};

// Create a new challenge
export const createChallenge = async (challengeData) => {
  try {
    const { prompt, date } = challengeData;
    const challengeId = `challenge_${date.toISOString().split('T')[0]}`;
    const challengeRef = doc(db, "challenges", challengeId);
    
    await setDoc(challengeRef, {
      prompt,
      date: Timestamp.fromDate(date),
      responses: {},
      createdAt: Timestamp.now()
    });
    
    return challengeId;
  } catch (error) {
    console.error("Error creating challenge: ", error);
    throw error;
  }
};

// Submit a response to a challenge
export const submitChallengeResponse = async (challengeId, responseText, responseFile = null) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    
    const challengeRef = doc(db, "challenges", challengeId);
    
    let fileUrl = '';
    if (responseFile) {
      const path = `challenges/${challengeId}/${user.uid}/${responseFile.name}`;
      fileUrl = await uploadFile(responseFile, path);
    }
    
    const challengeDoc = await getDoc(challengeRef);
    const currentResponses = challengeDoc.data().responses || {};
    
    await updateDoc(challengeRef, {
      [`responses.${user.uid}`]: {
        text: responseText,
        fileUrl,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: Timestamp.now()
      }
    });
    
    return true;
  } catch (error) {
    console.error("Error submitting challenge response: ", error);
    throw error;
  }
};

// Upload file helper
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

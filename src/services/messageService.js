// src/services/messageService.js
import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  setDoc,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";

// Get all messages
export const getAllMessages = async () => {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
  } catch (error) {
    console.error("Error getting messages: ", error);
    throw error;
  }
};

// Get a specific message by date
export const getMessageByDate = async (date) => {
  try {
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    const startOfDay = Timestamp.fromDate(formattedDate);
    formattedDate.setHours(23, 59, 59, 999);
    const endOfDay = Timestamp.fromDate(formattedDate);
    
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef, 
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
    console.error("Error getting message by date: ", error);
    throw error;
  }
};

// Upload a file to storage and get URL
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

// Create a new message
export const createMessage = async (messageData, files = {}) => {
  try {
    const { text, date, type } = messageData;
    const messageId = `message_${date.toISOString().split('T')[0]}`;
    const messageRef = doc(db, "messages", messageId);
    
    // Upload files if they exist
    let mediaUrl = '';
    if (files.media) {
      const path = `messages/${messageId}/${files.media.name}`;
      mediaUrl = await uploadFile(files.media, path);
    }
    
    await setDoc(messageRef, {
      text,
      date: Timestamp.fromDate(date),
      type,
      mediaUrl,
      createdAt: Timestamp.now()
    });
    
    return messageId;
  } catch (error) {
    console.error("Error creating message: ", error);
    throw error;
  }
};

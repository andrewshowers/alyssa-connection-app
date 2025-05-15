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
  updateDoc,
  arrayUnion,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { getCurrentUser } from './authService';

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

// Get messages for a specific date
export const getMessagesByDate = async (date) => {
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
      where("date", "<=", endOfDay),
      orderBy("date", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
  } catch (error) {
    console.error("Error getting messages by date: ", error);
    throw error;
  }
};

// Keep the original function for backward compatibility
export const getMessageByDate = async (date) => {
  const messages = await getMessagesByDate(date);
  return messages.length > 0 ? messages[0] : null;
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
    // Generate a unique ID with date and timestamp
    const messageId = `message_${date.toISOString().split('T')[0]}_${Date.now()}`;
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
      views: [],
      createdAt: Timestamp.now()
    });
    
    return messageId;
  } catch (error) {
    console.error("Error creating message: ", error);
    throw error;
  }
};

// Mark a message as viewed - with duplicate prevention
export const markMessageAsViewed = async (messageId) => {
  try {
    const user = getCurrentUser();
    if (!user) return;
    
    const messageRef = doc(db, "messages", messageId);
    
    // First check if this message exists
    const messageDoc = await getDoc(messageRef);
    if (!messageDoc.exists()) {
      console.warn("Message not found:", messageId);
      return false;
    }
    
    // Check if this user has already viewed this message recently
    const messageData = messageDoc.data();
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 minute ago
    
    const recentViewByUser = messageData.views && messageData.views.some(view => {
      // If user has already viewed and it was less than a minute ago
      return view.userId === user.uid && 
             new Date(view.timestamp) > oneMinuteAgo;
    });
    
    // If user already viewed recently, don't record again
    if (recentViewByUser) {
      return true;
    }
    
    // Record the view
    await updateDoc(messageRef, {
      views: arrayUnion({
        userId: user.uid,
        displayName: user.displayName,
        email: user.email,
        timestamp: now.toISOString()
      })
    });
    
    return true;
  } catch (error) {
    console.error("Error marking message as viewed:", error);
    return false;
  }
};
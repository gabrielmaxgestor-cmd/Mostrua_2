import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export const notificationService = {
  async notifyNicheUpdate(nicheId: string, title: string, message: string, link?: string) {
    try {
      const q = query(collection(db, "resellers"), where("nicheId", "==", nicheId));
      const snapshot = await getDocs(q);
      
      const promises = snapshot.docs.map(resellerDoc => {
        return addDoc(collection(db, "notifications"), {
          resellerId: resellerDoc.id,
          title,
          message,
          type: "niche_update",
          read: false,
          link: link || null,
          createdAt: serverTimestamp()
        });
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Error sending notifications to niche:", error);
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const docRef = doc(db, "notifications", notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  async markAllAsRead(resellerId: string) {
    try {
      const q = query(collection(db, "notifications"), where("resellerId", "==", resellerId), where("read", "==", false));
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(d => updateDoc(doc(db, "notifications", d.id), { read: true }));
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }
};

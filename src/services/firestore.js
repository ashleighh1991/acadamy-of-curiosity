import {
  setDoc,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Publish new essay
 * @param {string} userId - Author's Firebase UID
 * @param {object} essayData - Essay content and metadata
 * @returns {Promise} Essay ID
 */
export const publishEssay = async (userId, essayData) => {
  try {
    const docRef = await addDoc(collection(db, 'essays'), {
      authorId: userId,
      title: essayData.title,
      content: essayData.content,
      excerpt: essayData.excerpt,
      challengeId: essayData.challengeId,
      publishedAt: new Date().toISOString(),
      likes: 0,
      views: 0,
      comments: [],
      versions: [
        {
          content: essayData.content,
          savedAt: new Date().toISOString(),
        },
      ],
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Publish essay error: ${error.message}`);
  }
};

/**
 * Get essay by ID
 * @param {string} essayId - Essay document ID
 * @returns {Promise} Essay data
 */
export const getEssay = async (essayId) => {
  try {
    const docSnap = await getDoc(doc(db, 'essays', essayId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    throw new Error(`Get essay error: ${error.message}`);
  }
};

/**
 * Get all essays (community feed)
 * @returns {Promise} Array of essays
 */
export const getAllEssays = async () => {
  try {
    const q = query(collection(db, 'essays'), orderBy('publishedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Get essays error: ${error.message}`);
  }
};

/**
 * Get essays by author
 * @param {string} authorId - Author's Firebase UID
 * @returns {Promise} Array of essays
 */
export const getEssaysByAuthor = async (authorId) => {
  try {
    const q = query(collection(db, 'essays'), where('authorId', '==', authorId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Get author essays error: ${error.message}`);
  }
};

/**
 * Delete essay
 * @param {string} essayId - Essay document ID
 * @returns {Promise}
 */
export const deleteEssay = async (essayId) => {
  try {
    await deleteDoc(doc(db, 'essays', essayId));
  } catch (error) {
    throw new Error(`Delete essay error: ${error.message}`);
  }
};

/**
 * Update essay (new version)
 * @param {string} essayId - Essay document ID
 * @param {string} content - Updated content
 * @returns {Promise}
 */
export const updateEssay = async (essayId, content) => {
  try {
    const docRef = doc(db, 'essays', essayId);
    const docSnap = await getDoc(docRef);
    const versions = docSnap.data().versions || [];

    await updateDoc(docRef, {
      content: content,
      versions: [
        ...versions,
        {
          content: content,
          savedAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    throw new Error(`Update essay error: ${error.message}`);
  }
};

/**
 * Like/unlike essay
 * @param {string} essayId - Essay document ID
 * @param {number} increment - 1 to like, -1 to unlike
 * @returns {Promise}
 */
export const likeEssay = async (essayId, increment) => {
  try {
    const docRef = doc(db, 'essays', essayId);
    const docSnap = await getDoc(docRef);
    const currentLikes = docSnap.data().likes || 0;

    await updateDoc(docRef, {
      likes: Math.max(0, currentLikes + increment),
    });
  } catch (error) {
    throw new Error(`Like essay error: ${error.message}`);
  }
};

/**
 * Add comment to essay
 * @param {string} essayId - Essay document ID
 * @param {string} userId - Commenter's Firebase UID
 * @param {string} text - Comment text
 * @returns {Promise}
 */
export const addCommentToEssay = async (essayId, userId, text) => {
  try {
    const docRef = doc(db, 'essays', essayId);
    const docSnap = await getDoc(docRef);
    const comments = docSnap.data().comments || [];

    await updateDoc(docRef, {
      comments: [
        ...comments,
        {
          userId,
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    throw new Error(`Add comment error: ${error.message}`);
  }
};

/**
 * Record challenge enrollment
 * @param {string} userId - User's Firebase UID
 * @param {number} challengeId - Challenge ID
 * @param {object} paymentInfo - Payment info (optional, for paid challenges)
 * @returns {Promise}
 */
export const recordEnrollment = async (userId, challengeId, paymentInfo = null) => {
  try {
    const enrollmentId = `${userId}_${challengeId}`;
    
    // Record the enrollment
    await setDoc(doc(db, 'enrollments', enrollmentId), {
      userId,
      challengeId,
      enrolledAt: new Date().toISOString(),
      paymentId: paymentInfo?.paymentId || null,
      amountPaid: paymentInfo?.amount || 0,
      status: 'active',
    });

    // Update user's enrolled challenges
    const userRef = doc(db, 'users', userId);
    
    try {
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data()) {
        // User exists, update their enrolled challenges
        const enrolledChallenges = userDoc.data().enrolledChallenges || [];
        if (!enrolledChallenges.includes(challengeId)) {
          await updateDoc(userRef, {
            enrolledChallenges: [...enrolledChallenges, challengeId],
          });
        }
      } else {
        // User doesn't exist, create new document
        await setDoc(userRef, {
          enrolledChallenges: [challengeId],
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (userError) {
      console.log('User document update - creating new:', userError.message);
      // If all else fails, just create/merge the user doc
      await setDoc(userRef, {
        enrolledChallenges: [challengeId],
      }, { merge: true });
    }
  } catch (error) {
    console.error('Enrollment error:', error);
    throw new Error(`Record enrollment error: ${error.message}`);
  }
};

/**
 * Get user enrollments
 * @param {string} userId - User's Firebase UID
 * @returns {Promise} Array of enrollments
 */
export const getUserEnrollments = async (userId) => {
  try {
    const q = query(collection(db, 'enrollments'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Get enrollments error: ${error.message}`);
  }
};

/**
 * Check if user is enrolled in challenge
 * @param {string} userId - User's Firebase UID
 * @param {number} challengeId - Challenge ID
 * @returns {Promise} Boolean
 */
export const isUserEnrolled = async (userId, challengeId) => {
  try {
    const enrollmentId = `${userId}_${challengeId}`;
    const docSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
    return docSnap.exists();
  } catch (error) {
    throw new Error(`Check enrollment error: ${error.message}`);
  }
};
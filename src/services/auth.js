import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { setDoc, doc, getDoc } from 'firebase/firestore';

/**
 * Sign up new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User full name
 * @returns {Promise} User credential
 */
export const signup = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName: name });

    // Save user profile to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: name,
      createdAt: new Date().toISOString(),
      subscriptionPlan: null,
      enrolledChallenges: [],
      publishedEssays: [],
    });

    return user;
  } catch (error) {
    throw new Error(`Signup error: ${error.message}`);
  }
};

/**
 * Sign in existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} User credential
 */
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(`Login error: ${error.message}`);
  }
};

/**
 * Sign out current user
 * @returns {Promise}
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(`Logout error: ${error.message}`);
  }
};

/**
 * Get user profile from Firestore
 * @param {string} userId - Firebase UID
 * @returns {Promise} User profile object
 */
export const getUserProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    throw new Error(`Get profile error: ${error.message}`);
  }
};

/**
 * Update user profile
 * @param {string} userId - Firebase UID
 * @param {object} updates - Fields to update
 * @returns {Promise}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await setDoc(doc(db, 'users', userId), updates, { merge: true });
  } catch (error) {
    throw new Error(`Update profile error: ${error.message}`);
  }
};

/**
 * Listen to auth state changes
 * @param {function} callback - Function to call on auth state change
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
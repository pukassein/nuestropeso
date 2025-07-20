import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import { firebaseConfig } from '../config/firebaseConfig';
import { User, WeightEntry } from '../types';
import { INITIAL_USERS } from '../constants';

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const Timestamp = firebase.firestore.Timestamp;

/**
 * Seeds the database with initial user data if it's empty.
 * This function is called once during app initialization.
 */
const seedDatabase = async () => {
    console.log("Database is empty. Seeding with initial data...");
    const batch = db.batch();

    INITIAL_USERS.forEach(user => {
        const userDocRef = db.collection("users").doc(user.id);
        // Destructure to separate user data from weight history
        const { weightHistory, ...userData } = user;
        batch.set(userDocRef, userData);

        // Add each weight entry to a subcollection for that user
        const weightHistoryCollectionRef = userDocRef.collection("weightHistory");
        user.weightHistory.forEach(entry => {
            const weightDocRef = weightHistoryCollectionRef.doc(); // Creates a new doc with a random ID
            batch.set(weightDocRef, {
                date: Timestamp.fromDate(new Date(entry.date)), // Store as Firestore Timestamp for proper ordering
                weight: entry.weight
            });
        });
    });

    await batch.commit();
    console.log("Database seeded successfully.");
};

/**
 * Initializes the Firebase connection and seeds the database if necessary.
 * @throws An error if the Firebase config is not set up.
 */
export const initFirebaseAndSeed = async () => {
    if (firebaseConfig.projectId.startsWith('YOUR_')) {
         throw new Error("Please configure your Firebase settings in firebaseConfig.ts");
    }
    const snapshot = await db.collection('users').get();
    if (snapshot.empty) {
        await seedDatabase();
    }
};

/**
 * Fetches all users and their complete weight histories from Firestore.
 */
export const getUsers = async (): Promise<User[]> => {
    const usersSnapshot = await db.collection('users').get();
    
    const users: User[] = [];
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as Omit<User, 'weightHistory' | 'id'>;
        
        // Fetch weight history from the subcollection
        const weightHistorySnapshot = await db.collection(`users/${userDoc.id}/weightHistory`).orderBy("date", "asc").get();
        
        const weightHistory: WeightEntry[] = weightHistorySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                date: (data.date as firebase.firestore.Timestamp).toDate().toISOString(),
                weight: data.weight,
                userId: userDoc.id as 'hussein' | 'rola'
            };
        });

        users.push({ 
            ...userData, 
            id: userDoc.id as 'hussein' | 'rola', 
            weightHistory 
        });
    }

    // Ensure Rola's card always appears first for consistent UI
    users.sort((a, b) => a.id === 'rola' ? -1 : 1);
    return users;
};

/**
 * Adds a new weight entry for a specific user.
 */
export const addWeightEntry = async (userId: 'hussein' | 'rola', weight: number) => {
    const weightHistoryCollection = db.collection(`users/${userId}/weightHistory`);
    await weightHistoryCollection.add({
        date: Timestamp.now(),
        weight: weight
    });
};

/**
 * Updates the goal weight for a specific user.
 */
export const updateUserGoalWeight = async (userId: 'hussein' | 'rola', newGoalWeight: number) => {
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({
        goalWeight: newGoalWeight
    });
};

/**
 * Deletes a specific weight entry for a user.
 */
export const deleteWeightEntry = async (userId: 'hussein' | 'rola', idToDelete: string) => {
    const weightDocRef = db.collection(`users/${userId}/weightHistory`).doc(idToDelete);
    await weightDocRef.delete();
};

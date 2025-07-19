import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    query,
    orderBy,
    writeBatch
} from 'firebase/firestore/lite';
import { firebaseConfig } from '../firebaseConfig';
import { User, WeightEntry } from '../types';
import { INITIAL_USERS } from '../constants';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersCollection = collection(db, 'users');

/**
 * Seeds the database with initial user data if it's empty.
 * This function is called once during app initialization.
 */
const seedDatabase = async () => {
    console.log("Database is empty. Seeding with initial data...");
    const batch = writeBatch(db);

    INITIAL_USERS.forEach(user => {
        const userDocRef = doc(db, "users", user.id);
        // Destructure to separate user data from weight history
        const { weightHistory, ...userData } = user;
        batch.set(userDocRef, userData);

        // Add each weight entry to a subcollection for that user
        user.weightHistory.forEach(entry => {
            const weightDocRef = doc(collection(userDocRef, "weightHistory")); // Create a new doc with a random ID
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
    const snapshot = await getDocs(query(usersCollection));
    if (snapshot.empty) {
        await seedDatabase();
    }
};

/**
 * Fetches all users and their complete weight histories from Firestore.
 */
export const getUsers = async (): Promise<User[]> => {
    const usersSnapshot = await getDocs(usersCollection);
    
    const users: User[] = [];
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as Omit<User, 'weightHistory' | 'id'>;
        
        // Fetch weight history from the subcollection
        const weightHistoryCollection = collection(db, `users/${userDoc.id}/weightHistory`);
        const weightHistoryQuery = query(weightHistoryCollection, orderBy("date", "asc"));
        const weightHistorySnapshot = await getDocs(weightHistoryQuery);
        
        const weightHistory: WeightEntry[] = weightHistorySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                date: (data.date as Timestamp).toDate().toISOString(),
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
    const weightHistoryCollection = collection(db, `users/${userId}/weightHistory`);
    await addDoc(weightHistoryCollection, {
        date: Timestamp.now(),
        weight: weight
    });
};

/**
 * Updates the goal weight for a specific user.
 */
export const updateUserGoalWeight = async (userId: 'hussein' | 'rola', newGoalWeight: number) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
        goalWeight: newGoalWeight
    });
};

/**
 * Deletes a specific weight entry for a user.
 */
export const deleteWeightEntry = async (userId: 'hussein' | 'rola', idToDelete: string) => {
    const weightDocRef = doc(db, `users/${userId}/weightHistory`, idToDelete);
    await deleteDoc(weightDocRef);
};
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from '../lib/firebase';
import { Job, UserProfile, Application, Contract } from '../types';
import { INITIAL_JOBS } from '../data/mockJobs';
import { INITIAL_CONTRACTS } from '../data/mockContracts';

// Collection references
const JOBS_COLLECTION = 'jobs';
const USERS_COLLECTION = 'users';
const APPLICATIONS_COLLECTION = 'applications';
const CONTRACTS_COLLECTION = 'contracts';

/**
 * Seed initial jobs to Firestore if the collection is empty
 */
export async function seedInitialJobsIfEmpty(): Promise<void> {
  try {
    const jobsSnap = await getDocs(collection(db, JOBS_COLLECTION));
    if (jobsSnap.empty) {
      console.log('Seeding initial jobs into Firestore database...');
      for (const job of INITIAL_JOBS) {
        await setDoc(doc(db, JOBS_COLLECTION, job.id), job);
      }
      console.log('Initial jobs successfully seeded into Firestore.');
    }
  } catch (error) {
    console.warn('Could not seed initial jobs into Firestore (using offline local fallback):', error);
  }
}

/**
 * Subscribe to realtime updates for jobs in Firestore
 */
export function subscribeToJobs(
  onUpdate: (jobs: Job[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = collection(db, JOBS_COLLECTION);
    return onSnapshot(
      q,
      (snapshot) => {
        const jobsList: Job[] = [];
        snapshot.forEach((docSnap) => {
          jobsList.push(docSnap.data() as Job);
        });
        if (jobsList.length > 0) {
          onUpdate(jobsList);
        }
      },
      (error) => {
        console.warn('Firestore jobs onSnapshot listener error:', error);
        onError?.(error);
      }
    );
  } catch (err: any) {
    console.warn('Failed to initiate jobs subscription:', err);
    return () => {};
  }
}

/**
 * Save or update a job in Firestore
 */
export async function saveJobToFirestore(job: Job): Promise<void> {
  try {
    await setDoc(doc(db, JOBS_COLLECTION, job.id), job, { merge: true });
  } catch (error) {
    console.error('Error saving job to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a job from Firestore
 */
export async function deleteJobFromFirestore(jobId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, JOBS_COLLECTION, jobId));
  } catch (error) {
    console.error('Error deleting job from Firestore:', error);
    throw error;
  }
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(user: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), user, { merge: true });
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
    throw error;
  }
}

/**
 * Fetch a user profile from Firestore
 */
export async function fetchUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Firestore:', error);
    return null;
  }
}

/**
 * Save an application to Firestore
 */
export async function saveApplicationToFirestore(app: Application): Promise<void> {
  try {
    await setDoc(doc(db, APPLICATIONS_COLLECTION, app.id), app, { merge: true });
    // Also update job applicant count if possible
    const jobRef = doc(db, JOBS_COLLECTION, app.jobId);
    const jobSnap = await getDoc(jobRef);
    if (jobSnap.exists()) {
      const currentCount = jobSnap.data().applicantCount || 0;
      await updateDoc(jobRef, { applicantCount: currentCount + 1 });
    }
  } catch (error) {
    console.error('Error saving application to Firestore:', error);
    throw error;
  }
}

/**
 * Subscribe to applications for a user or employer
 */
export function subscribeToApplications(
  userId: string,
  role: 'job_seeker' | 'employer' | 'admin',
  onUpdate: (apps: Application[]) => void
): () => void {
  try {
    const colRef = collection(db, APPLICATIONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const appsList: Application[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Application;
          if (role === 'admin' || role === 'employer') {
            appsList.push(data);
          } else if (data.applicantId === userId) {
            appsList.push(data);
          }
        });
        onUpdate(appsList);
      },
      (error) => {
        console.warn('Firestore applications listener error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to applications:', err);
    return () => {};
  }
}

/**
 * Update application status in Firestore
 */
export async function updateApplicationStatusInFirestore(
  appId: string,
  status: Application['status'],
  notes?: string
): Promise<void> {
  try {
    const payload: Partial<Application> = { status };
    if (notes !== undefined) {
      payload.employerNotes = notes;
    }
    await updateDoc(doc(db, APPLICATIONS_COLLECTION, appId), payload);
  } catch (error) {
    console.error('Error updating application status in Firestore:', error);
    throw error;
  }
}

/**
 * Seed initial contracts to Firestore if the collection is empty
 */
export async function seedInitialContractsIfEmpty(): Promise<void> {
  try {
    const contractsCol = collection(db, CONTRACTS_COLLECTION);
    const snapshot = await getDocs(contractsCol);

    if (snapshot.empty) {
      console.log('Seeding initial contracts to Firestore...');
      for (const contract of INITIAL_CONTRACTS) {
        await setDoc(doc(db, CONTRACTS_COLLECTION, contract.id), contract);
      }
      console.log('Initial contracts seeded successfully.');
    }
  } catch (error) {
    console.warn('Could not seed initial contracts to Firestore (using local/fallback state):', error);
  }
}

/**
 * Subscribe to contracts in Firestore with real-time updates
 */
export function subscribeToContracts(
  onContractsUpdate: (contracts: Contract[]) => void,
  userId?: string,
  userEmail?: string,
  role?: string
): () => void {
  try {
    const contractsCol = collection(db, CONTRACTS_COLLECTION);
    const q = query(contractsCol, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const contracts: Contract[] = [];
        snapshot.forEach((docSnap) => {
          contracts.push(docSnap.data() as Contract);
        });

        // Client-side RBAC filter fallback if full collection was read
        if (role === 'admin') {
          onContractsUpdate(contracts);
        } else if (userId || userEmail) {
          const filtered = contracts.filter(c => 
            c.employerId === userId || 
            c.candidateId === userId || 
            (userEmail && c.candidateEmail?.toLowerCase() === userEmail.toLowerCase())
          );
          onContractsUpdate(filtered);
        } else {
          onContractsUpdate(contracts);
        }
      },
      (error) => {
        console.warn('Firestore contracts listener fallback to local state:', error.message);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to contracts:', err);
    return () => {};
  }
}

/**
 * Save or update contract in Firestore
 */
export async function saveContractToFirestore(contract: Contract): Promise<void> {
  try {
    await setDoc(doc(db, CONTRACTS_COLLECTION, contract.id), contract, { merge: true });
  } catch (error) {
    console.error('Error saving contract to Firestore:', error);
    throw error;
  }
}

/**
 * Delete contract from Firestore
 */
export async function deleteContractFromFirestore(contractId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CONTRACTS_COLLECTION, contractId));
  } catch (error) {
    console.error('Error deleting contract from Firestore:', error);
    throw error;
  }
}


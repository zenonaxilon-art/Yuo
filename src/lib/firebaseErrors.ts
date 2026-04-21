export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: any;
}

export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null, authUser: any) => {
  if (error?.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: authUser ? {
        userId: authUser.uid,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        isAnonymous: authUser.isAnonymous,
        providerInfo: authUser.providerData
      } : null
    };
    console.error("Firestore Permission Error:", JSON.stringify(errorInfo, null, 2));
    throw new Error(JSON.stringify(errorInfo));
  }
  console.error("Firestore Error:", error);
  throw error;
}

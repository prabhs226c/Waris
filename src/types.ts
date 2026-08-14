export interface GlobalConfig {
  id?: string;
  status: 'voting' | 'announced';
  babyName?: string;
  gender?: 'boy' | 'girl';
  photoDataUrl?: string;
  stats?: string;
  updatedAt: number;
}

export interface BabyName {
  id?: string;
  name: string;
  gender: 'boy' | 'girl';
  submittedBy: string;
  submitterUid: string;
  voteCount: number;
  createdAt: number;
}

export interface Vote {
  id?: string;
  uid: string;
  votedAt: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

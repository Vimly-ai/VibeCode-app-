import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'employee';
  department?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  avatar?: string;
  companyId: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}

export interface SavedCredentials {
  email: string;
  passwordHash: string;
  rememberMe: boolean;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  pendingUsers: User[];
  approvedUsers: User[];
  savedCredentials: SavedCredentials | null;
  
  // Authentication functions
  signUp: (email: string, name: string, password: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string; user?: User }>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  autoSignIn: () => Promise<boolean>;
  
  // Admin functions
  approveUser: (userId: string, adminId: string) => boolean;
  rejectUser: (userId: string, adminId: string) => boolean;
  updateUserRole: (userId: string, role: 'admin' | 'employee') => boolean;
  getAllUsers: () => User[];
  getPendingUsers: () => User[];
}

// Helper function to hash passwords
const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'reward_app_salt', // Add salt for security
    { encoding: Crypto.CryptoEncoding.HEX }
  );
};

// Demo admin account for testing (password: "admin123")
const demoAdmin: User = {
  id: 'admin-001',
  email: 'admin@demo.com',
  name: 'Admin User',
  passwordHash: '36a5df1a5d8a4a52dde4962de2b267fa23e6f9d0fcb7166db7309b2bf8e0cd87', // hashed "admin123"
  role: 'admin',
  department: 'Management',
  status: 'approved',
  createdAt: new Date().toISOString(),
  approvedAt: new Date().toISOString(),
  companyId: 'company-001'
};

// Demo approved users (password: "demo123" for all)
const demoUsers: User[] = [
  {
    id: 'user-001',
    email: 'sarah.johnson@gmail.com',
    name: 'Sarah Johnson',
    passwordHash: '2f90bcd72a728cf90a8150dbc05c5435bb33b39a75bbd8399d7515066e0d98b6', // hashed "demo123"
    role: 'employee',
    department: 'Engineering',
    status: 'approved',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    approvedBy: 'admin-001',
    companyId: 'company-001'
  },
  {
    id: 'user-002',
    email: 'mike.chen@yahoo.com',
    name: 'Mike Chen',
    passwordHash: '2f90bcd72a728cf90a8150dbc05c5435bb33b39a75bbd8399d7515066e0d98b6', // hashed "demo123"
    role: 'employee',
    department: 'Marketing',
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    approvedBy: 'admin-001',
    companyId: 'company-001'
  },
  {
    id: 'user-003',
    email: 'jane.smith@company.com',
    name: 'Jane Smith',
    passwordHash: '2f90bcd72a728cf90a8150dbc05c5435bb33b39a75bbd8399d7515066e0d98b6', // hashed "demo123"
    role: 'employee',
    department: 'Hr',
    status: 'approved',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approvedBy: 'admin-001',
    companyId: 'company-001'
  }
];

// Demo pending users
// Demo pending users - Start with clean slate (no pending users)
const demoPendingUsers: User[] = [];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      pendingUsers: demoPendingUsers,
      approvedUsers: [demoAdmin, ...demoUsers],
      savedCredentials: null,
      
      signUp: async (email: string, name: string, password: string) => {
        // Validate password strength
        if (password.length < 6) {
          return { success: false, message: 'Password must be at least 6 characters long' };
        }
        
        // Check if user already exists
        const state = get();
        const existingUser = [...state.approvedUsers, ...state.pendingUsers].find(
          user => user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (existingUser) {
          return { success: false, message: 'An account with this email already exists' };
        }
        
        // Hash password
        const passwordHash = await hashPassword(password);
        
        // Create new pending user
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: email.toLowerCase(),
          name,
          passwordHash,
          role: 'employee',
          status: 'pending',
          createdAt: new Date().toISOString(),
          companyId: 'company-001'
        };
        
        set(state => ({
          pendingUsers: [...state.pendingUsers, newUser]
        }));
        
        return { 
          success: true, 
          message: 'Account created successfully! Please wait for admin approval before you can access the app.' 
        };
      },
      
      signIn: async (email: string, password: string, rememberMe: boolean = false) => {
        const state = get();
        const user = state.approvedUsers.find(
          user => user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (!user) {
          // Check if user is pending
          const pendingUser = state.pendingUsers.find(
            user => user.email.toLowerCase() === email.toLowerCase()
          );
          
          if (pendingUser) {
            return { 
              success: false, 
              message: 'Your account is pending approval. Please contact your administrator.' 
            };
          }
          
          return { 
            success: false, 
            message: 'Invalid email or password.' 
          };
        }
        
        // Verify password
        const passwordHash = await hashPassword(password);
        if (user.passwordHash !== passwordHash) {
          return { 
            success: false, 
            message: 'Invalid email or password.' 
          };
        }
        
        if (user.status !== 'approved') {
          return { 
            success: false, 
            message: 'Your account is not approved yet. Please contact your administrator.' 
          };
        }
        
        // Save credentials if remember me is checked
        const savedCredentials = rememberMe ? {
          email: email.toLowerCase(),
          passwordHash,
          rememberMe: true
        } : null;
        
        set({
          currentUser: user,
          isAuthenticated: true,
          savedCredentials
        });
        
        return { success: true, message: 'Successfully signed in!', user };
      },
      
      signOut: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          savedCredentials: null
        });
      },
      
      forgotPassword: async (email: string) => {
        const state = get();
        const userInApproved = state.approvedUsers.find(
          user => user.email.toLowerCase() === email.toLowerCase()
        );
        const userInPending = state.pendingUsers.find(
          user => user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (!userInApproved && !userInPending) {
          return { success: false, message: 'No account found with this email address' };
        }
        
        // Generate reset token (in real app, this would be sent via email)
        const resetToken = Math.random().toString(36).substring(2, 15);
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
        
        if (userInApproved) {
          set(state => ({
            approvedUsers: state.approvedUsers.map(user =>
              user.email.toLowerCase() === email.toLowerCase()
                ? { ...user, resetToken, resetTokenExpiry }
                : user
            )
          }));
        } else if (userInPending) {
          set(state => ({
            pendingUsers: state.pendingUsers.map(user =>
              user.email.toLowerCase() === email.toLowerCase()
                ? { ...user, resetToken, resetTokenExpiry }
                : user
            )
          }));
        }
        
        return { 
          success: true, 
          message: `Password reset instructions sent! Use this code: ${resetToken}` 
        };
      },
      
      resetPassword: async (email: string, resetToken: string, newPassword: string) => {
        if (newPassword.length < 6) {
          return { success: false, message: 'Password must be at least 6 characters long' };
        }
        
        const state = get();
        const userInApproved = state.approvedUsers.find(
          user => user.email.toLowerCase() === email.toLowerCase()
        );
        const userInPending = state.pendingUsers.find(
          user => user.email.toLowerCase() === email.toLowerCase()
        );
        
        const user = userInApproved || userInPending;
        
        if (!user || user.resetToken !== resetToken) {
          return { success: false, message: 'Invalid or expired reset token' };
        }
        
        if (user.resetTokenExpiry && new Date() > new Date(user.resetTokenExpiry)) {
          return { success: false, message: 'Reset token has expired' };
        }
        
        const newPasswordHash = await hashPassword(newPassword);
        
        if (userInApproved) {
          set(state => ({
            approvedUsers: state.approvedUsers.map(u =>
              u.email.toLowerCase() === email.toLowerCase()
                ? { ...u, passwordHash: newPasswordHash, resetToken: undefined, resetTokenExpiry: undefined }
                : u
            )
          }));
        } else if (userInPending) {
          set(state => ({
            pendingUsers: state.pendingUsers.map(u =>
              u.email.toLowerCase() === email.toLowerCase()
                ? { ...u, passwordHash: newPasswordHash, resetToken: undefined, resetTokenExpiry: undefined }
                : u
            )
          }));
        }
        
        return { success: true, message: 'Password reset successfully!' };
      },
      
      autoSignIn: async () => {
        const state = get();
        if (!state.savedCredentials || !state.savedCredentials.rememberMe) {
          return false;
        }
        
        const user = state.approvedUsers.find(
          user => user.email.toLowerCase() === state.savedCredentials!.email.toLowerCase()
        );
        
        if (user && user.passwordHash === state.savedCredentials.passwordHash && user.status === 'approved') {
          set({
            currentUser: user,
            isAuthenticated: true
          });
          return true;
        }
        
        return false;
      },
      
      approveUser: (userId: string, adminId: string) => {
        const state = get();
        const userIndex = state.pendingUsers.findIndex(user => user.id === userId);
        
        if (userIndex === -1) return false;
        
        const user = state.pendingUsers[userIndex];
        const approvedUser: User = {
          ...user,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: adminId
        };
        
        set(state => ({
          pendingUsers: state.pendingUsers.filter(user => user.id !== userId),
          approvedUsers: [...state.approvedUsers, approvedUser]
        }));
        
        return true;
      },
      
      rejectUser: (userId: string, adminId: string) => {
        const state = get();
        const userIndex = state.pendingUsers.findIndex(user => user.id === userId);
        
        if (userIndex === -1) return false;
        
        set(state => ({
          pendingUsers: state.pendingUsers.filter(user => user.id !== userId)
        }));
        
        return true;
      },
      
      updateUserRole: (userId: string, role: 'admin' | 'employee') => {
        const state = get();
        const userIndex = state.approvedUsers.findIndex(user => user.id === userId);
        
        if (userIndex === -1) return false;
        
        set(state => ({
          approvedUsers: state.approvedUsers.map(user => 
            user.id === userId ? { ...user, role } : user
          )
        }));
        
        return true;
      },
      
      getAllUsers: () => {
        const state = get();
        return state.approvedUsers.filter(user => user.role === 'employee');
      },
      
      getPendingUsers: () => {
        const state = get();
        return state.pendingUsers;
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        pendingUsers: state.pendingUsers,
        approvedUsers: state.approvedUsers,
        savedCredentials: state.savedCredentials,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure only the demo admin has admin role - reset any others to employee
          state.approvedUsers = state.approvedUsers.map(user => ({
            ...user,
            role: user.id === 'admin-001' ? 'admin' : 'employee'
          }));
        }
      },
    }
  )
);
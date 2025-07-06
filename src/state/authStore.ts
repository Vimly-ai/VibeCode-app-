import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  avatar?: string;
  companyId: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  pendingUsers: User[];
  approvedUsers: User[];
  
  // OAuth simulation (in real app, this would connect to actual OAuth providers)
  signUp: (email: string, name: string, department?: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string) => Promise<{ success: boolean; message: string; user?: User }>;
  signOut: () => void;
  
  // Admin functions
  approveUser: (userId: string, adminId: string) => boolean;
  rejectUser: (userId: string, adminId: string) => boolean;
  updateUserRole: (userId: string, role: 'admin' | 'employee') => boolean;
  getAllUsers: () => User[];
  getPendingUsers: () => User[];
}

// Demo admin account for testing
const demoAdmin: User = {
  id: 'admin-001',
  email: 'admin@demo.com',
  name: 'Admin User',
  role: 'admin',
  department: 'Management',
  status: 'approved',
  createdAt: new Date().toISOString(),
  approvedAt: new Date().toISOString(),
  companyId: 'company-001'
};

// Demo approved users
const demoUsers: User[] = [
  {
    id: 'user-001',
    email: 'sarah.johnson@gmail.com',
    name: 'Sarah Johnson',
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
    role: 'employee',
    department: 'Marketing',
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    approvedBy: 'admin-001',
    companyId: 'company-001'
  }
];

// Demo pending users
const demoPendingUsers: User[] = [
  {
    id: 'pending-001',
    email: 'john.doe@outlook.com',
    name: 'John Doe',
    role: 'employee',
    department: 'Sales',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    companyId: 'company-001'
  },
  {
    id: 'pending-002',
    email: 'jane.smith@hotmail.com',
    name: 'Jane Smith',
    role: 'employee',
    department: 'HR',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    companyId: 'company-001'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      pendingUsers: demoPendingUsers,
      approvedUsers: [demoAdmin, ...demoUsers],
      
      signUp: async (email: string, name: string, department?: string) => {
        // Check if user already exists
        const state = get();
        const existingUser = [...state.approvedUsers, ...state.pendingUsers].find(
          user => user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (existingUser) {
          return { success: false, message: 'An account with this email already exists' };
        }
        
        // Create new pending user
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: email.toLowerCase(),
          name,
          role: 'employee',
          department,
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
      
      signIn: async (email: string) => {
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
            message: 'Account not found. Please sign up first or contact your administrator.' 
          };
        }
        
        if (user.status !== 'approved') {
          return { 
            success: false, 
            message: 'Your account is not approved yet. Please contact your administrator.' 
          };
        }
        
        set({
          currentUser: user,
          isAuthenticated: true
        });
        
        return { success: true, message: 'Successfully signed in!', user };
      },
      
      signOut: () => {
        set({
          currentUser: null,
          isAuthenticated: false
        });
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
      }),
    }
  )
);
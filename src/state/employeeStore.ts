import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, isToday, isSameWeek, startOfWeek, endOfWeek, subDays } from 'date-fns';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  quarterlyPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  checkIns: CheckIn[];
  lastCheckIn?: string;
  rewardsRedeemed: RewardRedemption[];
}

export interface CheckIn {
  id: string;
  timestamp: string;
  pointsEarned: number;
  type: 'ontime' | 'early' | 'late';
  bonusReason?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  icon: string;
  available: boolean;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  redeemedAt: string;
  status: 'pending' | 'approved' | 'completed';
}

interface EmployeeState {
  currentEmployee: Employee | null;
  employees: Employee[];
  rewards: Reward[];
  
  // Actions
  initializeEmployee: (name: string, email: string) => void;
  checkIn: (employeeId: string, qrCode: string) => { success: boolean; message: string; pointsEarned: number };
  redeemReward: (employeeId: string, rewardId: string) => boolean;
  getLeaderboard: () => Employee[];
  getEmployeeStats: (employeeId: string) => {
    todayPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    quarterlyPoints: number;
    currentStreak: number;
    recentCheckIns: CheckIn[];
  };
}

const defaultRewards: Reward[] = [
  // Weekly Wins (5-10 pts)
  { id: 'w1', name: '$5 Maverik Card', description: 'Fuel up with a $5 Maverik gift card', pointsCost: 5, category: 'weekly', icon: 'card', available: true },
  { id: 'w2', name: 'Extra 15min Break', description: 'Take an extra 15-minute break', pointsCost: 8, category: 'weekly', icon: 'time', available: true },
  
  // Monthly Momentum (25-50 pts)
  { id: 'm1', name: '$25 Gift Card', description: 'Choose from popular retailers', pointsCost: 25, category: 'monthly', icon: 'gift', available: true },
  { id: 'm2', name: 'Casual Friday Pass', description: 'Dress casual for a Friday', pointsCost: 30, category: 'monthly', icon: 'shirt', available: true },
  { id: 'm3', name: 'Premium Parking Spot', description: 'Reserve the best parking spot for a week', pointsCost: 40, category: 'monthly', icon: 'car', available: true },
  
  // Quarterly Crushers (75-150 pts)
  { id: 'q1', name: '$100 Gift Card', description: 'High-value gift card of your choice', pointsCost: 75, category: 'quarterly', icon: 'gift', available: true },
  { id: 'q2', name: 'Half Day Off', description: 'Take a half day off with pay', pointsCost: 100, category: 'quarterly', icon: 'calendar', available: true },
  { id: 'q3', name: 'Team Lunch Sponsorship', description: 'We sponsor lunch for you and your team', pointsCost: 125, category: 'quarterly', icon: 'restaurant', available: true },
  
  // Annual Legends (300+ pts)
  { id: 'a1', name: 'Paid Weekend Trip', description: 'Two-day paid trip to a destination of choice', pointsCost: 300, category: 'annual', icon: 'airplane', available: true },
  { id: 'a2', name: 'Extra Vacation Day', description: 'Additional paid vacation day', pointsCost: 250, category: 'annual', icon: 'calendar', available: true },
  { id: 'a3', name: 'VIP Experience', description: 'Premium event or experience package', pointsCost: 400, category: 'annual', icon: 'star', available: true },
];

const defaultBadges: Badge[] = [
  { id: 'early_bird', name: 'Early Bird', description: 'Checked in early 5 times', icon: 'sunrise', color: '#F59E0B' },
  { id: 'streak_master', name: 'Streak Master', description: 'Maintained a 7-day streak', icon: 'flame', color: '#EF4444' },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Perfect attendance for a week', icon: 'trophy', color: '#10B981' },
  { id: 'point_collector', name: 'Point Collector', description: 'Earned 100 total points', icon: 'medal', color: '#8B5CF6' },
  { id: 'consistency_king', name: 'Consistency King', description: 'Checked in on time 20 times', icon: 'clock', color: '#06B6D4' },
];

// Create mock employees for demo purposes
const createMockEmployees = (): Employee[] => {
  const mockEmployees: Employee[] = [
    {
      id: 'mock-1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      totalPoints: 127,
      weeklyPoints: 15,
      monthlyPoints: 45,
      quarterlyPoints: 89,
      currentStreak: 8,
      longestStreak: 12,
      badges: [
        { ...defaultBadges[0], unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { ...defaultBadges[1], unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      checkIns: [],
      rewardsRedeemed: [],
    },
    {
      id: 'mock-2',
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      totalPoints: 95,
      weeklyPoints: 12,
      monthlyPoints: 38,
      quarterlyPoints: 67,
      currentStreak: 5,
      longestStreak: 9,
      badges: [
        { ...defaultBadges[0], unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      checkIns: [],
      rewardsRedeemed: [],
    },
    {
      id: 'mock-3',
      name: 'Emma Davis',
      email: 'emma.davis@company.com',
      totalPoints: 78,
      weeklyPoints: 10,
      monthlyPoints: 28,
      quarterlyPoints: 52,
      currentStreak: 3,
      longestStreak: 7,
      badges: [],
      checkIns: [],
      rewardsRedeemed: [],
    },
  ];
  
  return mockEmployees;
};

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      currentEmployee: null,
      employees: createMockEmployees(),
      rewards: defaultRewards,

      initializeEmployee: (name: string, email: string) => {
        const employee: Employee = {
          id: Date.now().toString(),
          name,
          email,
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          quarterlyPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: [],
          checkIns: [],
          rewardsRedeemed: [],
        };
        
        set((state) => ({
          currentEmployee: employee,
          employees: [...state.employees, employee],
        }));
      },

      checkIn: (employeeId: string, qrCode: string) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        // 8:00 AM = 480 minutes, 7:45 AM = 465 minutes
        const onTimeThreshold = 480; // 8:00 AM
        const earlyBirdThreshold = 465; // 7:45 AM
        
        let pointsEarned = 0;
        let checkInType: 'ontime' | 'early' | 'late' = 'late';
        let bonusReason: string | undefined;
        
        if (currentTime <= earlyBirdThreshold) {
          pointsEarned = 2;
          checkInType = 'early';
        } else if (currentTime <= onTimeThreshold) {
          pointsEarned = 1;
          checkInType = 'ontime';
        } else {
          pointsEarned = 0;
          checkInType = 'late';
        }
        
        const checkIn: CheckIn = {
          id: Date.now().toString(),
          timestamp: now.toISOString(),
          pointsEarned,
          type: checkInType,
          bonusReason,
        };
        
        set((state) => {
          const employees = [...state.employees];
          const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
          
          if (employeeIndex === -1) {
            return { success: false, message: 'Employee not found', pointsEarned: 0 };
          }
          
          const employee = { ...employees[employeeIndex] };
          
          // Check if already checked in today
          const today = format(now, 'yyyy-MM-dd');
          const todayCheckIn = employee.checkIns.find(ci => 
            format(parseISO(ci.timestamp), 'yyyy-MM-dd') === today
          );
          
          if (todayCheckIn) {
            return state; // Already checked in today
          }
          
          // Add check-in
          employee.checkIns.push(checkIn);
          
          // Calculate streak
          const yesterday = subDays(now, 1);
          const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
          const yesterdayCheckIn = employee.checkIns.find(ci => 
            format(parseISO(ci.timestamp), 'yyyy-MM-dd') === yesterdayFormatted
          );
          
          if (yesterdayCheckIn) {
            employee.currentStreak++;
          } else {
            employee.currentStreak = 1;
          }
          
          if (employee.currentStreak > employee.longestStreak) {
            employee.longestStreak = employee.currentStreak;
          }
          
          // Add streak bonuses
          if (employee.currentStreak === 7) {
            pointsEarned += 5;
            bonusReason = 'Perfect Week Bonus';
          } else if (employee.currentStreak === 10) {
            pointsEarned += 10;
            bonusReason = '10-Day Streak Bonus';
          }
          
          // Update points
          employee.totalPoints += pointsEarned;
          employee.weeklyPoints += pointsEarned;
          employee.monthlyPoints += pointsEarned;
          employee.quarterlyPoints += pointsEarned;
          employee.lastCheckIn = now.toISOString();
          
          // Check for new badges
          const newBadges = [];
          if (employee.totalPoints >= 100 && !employee.badges.find(b => b.id === 'point_collector')) {
            newBadges.push(defaultBadges.find(b => b.id === 'point_collector')!);
          }
          if (employee.currentStreak >= 7 && !employee.badges.find(b => b.id === 'streak_master')) {
            newBadges.push(defaultBadges.find(b => b.id === 'streak_master')!);
          }
          
          employee.badges.push(...newBadges.map(badge => ({
            ...badge,
            unlockedAt: now.toISOString(),
          })));
          
          employees[employeeIndex] = employee;
          
          return {
            ...state,
            employees,
            currentEmployee: state.currentEmployee?.id === employeeId ? employee : state.currentEmployee,
          };
        });
        
        const message = checkInType === 'early' ? 'Early Bird! +2 points' : 
                       checkInType === 'ontime' ? 'On Time! +1 point' : 
                       'Better luck tomorrow!';
        
        return { success: true, message, pointsEarned };
      },

      redeemReward: (employeeId: string, rewardId: string) => {
        const state = get();
        const employee = state.employees.find(emp => emp.id === employeeId);
        const reward = state.rewards.find(r => r.id === rewardId);
        
        if (!employee || !reward || employee.totalPoints < reward.pointsCost) {
          return false;
        }
        
        const redemption: RewardRedemption = {
          id: Date.now().toString(),
          rewardId,
          rewardName: reward.name,
          pointsCost: reward.pointsCost,
          redeemedAt: new Date().toISOString(),
          status: 'pending',
        };
        
        set((state) => {
          const employees = [...state.employees];
          const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
          
          if (employeeIndex !== -1) {
            employees[employeeIndex] = {
              ...employees[employeeIndex],
              totalPoints: employees[employeeIndex].totalPoints - reward.pointsCost,
              rewardsRedeemed: [...employees[employeeIndex].rewardsRedeemed, redemption],
            };
          }
          
          return {
            ...state,
            employees,
            currentEmployee: state.currentEmployee?.id === employeeId ? employees[employeeIndex] : state.currentEmployee,
          };
        });
        
        return true;
      },

      getLeaderboard: () => {
        const state = get();
        return [...state.employees].sort((a, b) => b.totalPoints - a.totalPoints);
      },

      getEmployeeStats: (employeeId: string) => {
        const state = get();
        const employee = state.employees.find(emp => emp.id === employeeId);
        
        if (!employee) {
          return {
            todayPoints: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
            quarterlyPoints: 0,
            currentStreak: 0,
            recentCheckIns: [],
          };
        }
        
        const today = new Date();
        const todayCheckIns = employee.checkIns.filter(ci => 
          isToday(parseISO(ci.timestamp))
        );
        
        const recentCheckIns = employee.checkIns
          .slice(-7)
          .reverse();
        
        return {
          todayPoints: todayCheckIns.reduce((sum, ci) => sum + ci.pointsEarned, 0),
          weeklyPoints: employee.weeklyPoints,
          monthlyPoints: employee.monthlyPoints,
          quarterlyPoints: employee.quarterlyPoints,
          currentStreak: employee.currentStreak,
          recentCheckIns,
        };
      },
    }),
    {
      name: 'employee-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentEmployee: state.currentEmployee,
        employees: state.employees,
        rewards: state.rewards,
      }),
    }
  )
);
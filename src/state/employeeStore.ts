import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, isToday, isSameWeek, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { getMotivationalQuote, MotivationalQuote } from '../utils/motivationalQuotes';
import { validateQRCode, isWithinValidTimeWindow } from '../utils/qrCodeConfig';

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
  bonusPoints: BonusPoint[];
  lastCheckIn?: string;
  rewardsRedeemed: RewardRedemption[];
}

export interface CheckIn {
  id: string;
  timestamp: string;
  pointsEarned: number;
  type: 'ontime' | 'early' | 'late';
}

export interface BonusPoint {
  id: string;
  timestamp: string;
  pointsAwarded: number;
  reason: string;
  awardedBy: string; // Admin who awarded the bonus
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
  setCurrentEmployee: (email: string) => void;
  checkIn: (employeeId: string, qrCode: string) => { success: boolean; message: string; pointsEarned: number; quote: MotivationalQuote };
  redeemReward: (employeeId: string, rewardId: string) => boolean;
  approveRewardRedemption: (redemptionId: string) => boolean;
  rejectRewardRedemption: (redemptionId: string) => boolean;
  awardBonusPoints: (employeeId: string, points: number, reason: string) => boolean;
  getLeaderboard: () => Employee[];
  getEmployeeStats: (employeeId: string) => {
    todayPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    quarterlyPoints: number;
    currentStreak: number;
    recentCheckIns: CheckIn[];
    recentBonusPoints: BonusPoint[];
  };
}

const defaultRewards: Reward[] = [
  // Weekly (5-10 pts)
  { id: 'w1', name: '$5 Maverick Card', description: 'Fuel up with a $5 Maverick gift card', pointsCost: 5, category: 'weekly', icon: 'card', available: true },
  { id: 'w2', name: 'Extra Break', description: 'Take an extra break during your shift', pointsCost: 8, category: 'weekly', icon: 'time', available: true },
  
  // Monthly (25-50 pts)
  { id: 'm1', name: '$25 Gift Card', description: 'Choose from popular retailers', pointsCost: 25, category: 'monthly', icon: 'gift', available: true },
  
  // Quarterly (75-150 pts)
  { id: 'q1', name: '$100 Gift Card', description: 'High-value gift card of your choice', pointsCost: 75, category: 'quarterly', icon: 'gift', available: true },
  { id: 'q2', name: 'Half-Day Off', description: 'Take a half day off with pay', pointsCost: 100, category: 'quarterly', icon: 'calendar', available: true },
  
  // Annual (300+ pts)
  { id: 'a1', name: 'Paid Trip', description: 'Paid trip to a destination of your choice', pointsCost: 300, category: 'annual', icon: 'airplane', available: true },
  { id: 'a2', name: 'Vacation Day', description: 'Additional paid vacation day', pointsCost: 350, category: 'annual', icon: 'calendar', available: true },
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
  const now = new Date();
  
  // Create realistic check-in data for the past 2 weeks
  const createMockCheckIns = (employeeId: string, pattern: 'consistent' | 'inconsistent' | 'improving'): CheckIn[] => {
    const checkIns: CheckIn[] = [];
    
    for (let i = 14; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      
      // Skip weekends for most employees
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      let checkInTime: Date;
      let type: 'early' | 'ontime' | 'late';
      let points: number;
      
      if (pattern === 'consistent') {
        // Usually early or on time
        const isEarly = Math.random() > 0.3;
        if (isEarly) {
          checkInTime = new Date(date.setHours(7, 30 + Math.random() * 15, 0, 0));
          type = 'early';
          points = 2;
        } else {
          checkInTime = new Date(date.setHours(7, 45 + Math.random() * 15, 0, 0));
          type = 'ontime';
          points = 1;
        }
      } else if (pattern === 'inconsistent') {
        // Mixed patterns, more late on Mondays
        const isMonday = dayOfWeek === 1;
        const lateProbability = isMonday ? 0.7 : 0.4;
        
        if (Math.random() < lateProbability) {
          checkInTime = new Date(date.setHours(8, Math.random() * 30, 0, 0));
          type = 'late';
          points = 0;
        } else if (Math.random() > 0.5) {
          checkInTime = new Date(date.setHours(7, 30 + Math.random() * 20, 0, 0));
          type = 'early';
          points = 2;
        } else {
          checkInTime = new Date(date.setHours(7, 50 + Math.random() * 10, 0, 0));
          type = 'ontime';
          points = 1;
        }
      } else { // improving
        // Gets better over time
        const improvementFactor = (14 - i) / 14; // 0 to 1
        if (Math.random() < 0.2 + improvementFactor * 0.6) {
          checkInTime = new Date(date.setHours(7, 35 + Math.random() * 15, 0, 0));
          type = 'early';
          points = 2;
        } else if (Math.random() < 0.8) {
          checkInTime = new Date(date.setHours(7, 50 + Math.random() * 10, 0, 0));
          type = 'ontime';
          points = 1;
        } else {
          checkInTime = new Date(date.setHours(8, Math.random() * 20, 0, 0));
          type = 'late';
          points = 0;
        }
      }
      
      checkIns.push({
        id: `${employeeId}-${i}`,
        timestamp: checkInTime.toISOString(),
        pointsEarned: points,
        type,
      });
    }
    
    return checkIns;
  };

  const mockEmployees: Employee[] = [
    {
      id: 'mock-1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@gmail.com',
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
      checkIns: createMockCheckIns('mock-1', 'consistent'),
      bonusPoints: [
        {
          id: 'bonus-1',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          pointsAwarded: 5,
          reason: 'Excellent customer service',
          awardedBy: 'Admin'
        }
      ],
      rewardsRedeemed: [],
    },
    {
      id: 'mock-2',
      name: 'Mike Chen',
      email: 'mike.chen@yahoo.com',
      totalPoints: 95,
      weeklyPoints: 12,
      monthlyPoints: 38,
      quarterlyPoints: 67,
      currentStreak: 5,
      longestStreak: 9,
      badges: [
        { ...defaultBadges[0], unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      checkIns: createMockCheckIns('mock-2', 'inconsistent'),
      bonusPoints: [],
      rewardsRedeemed: [],
    },
    {
      id: 'mock-3',
      name: 'Emma Davis',
      email: 'emma.davis@outlook.com',
      totalPoints: 78,
      weeklyPoints: 10,
      monthlyPoints: 28,
      quarterlyPoints: 52,
      currentStreak: 3,
      longestStreak: 7,
      badges: [],
      checkIns: createMockCheckIns('mock-3', 'improving'),
      bonusPoints: [
        {
          id: 'bonus-2',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          pointsAwarded: 3,
          reason: 'Great improvement in attendance',
          awardedBy: 'Admin'
        }
      ],
      rewardsRedeemed: [],
    },
    {
      id: 'mock-4',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      totalPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      quarterlyPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      checkIns: [],
      bonusPoints: [],
      rewardsRedeemed: [],
    },
  ];
  
  return mockEmployees;
};

// Migration function to ensure all employees have required properties
const migrateEmployeeData = (employees: Employee[]): Employee[] => {
  return employees.map(employee => ({
    ...employee,
    checkIns: employee.checkIns || [],
    bonusPoints: employee.bonusPoints || [],
    rewardsRedeemed: employee.rewardsRedeemed || [],
  }));
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
          bonusPoints: [],
          rewardsRedeemed: [],
        };
        
        set((state) => ({
          currentEmployee: employee,
          employees: [...state.employees, employee],
        }));
      },

      setCurrentEmployee: (email: string) => {
        set((state) => {
          const employee = state.employees.find(emp => emp.email === email);
          return {
            ...state,
            currentEmployee: employee || null,
          };
        });
      },

      checkIn: (employeeId: string, qrCode: string) => {
        // Validate QR code format and authenticity
        const qrValidation = validateQRCode(qrCode);
        if (!qrValidation.isValid) {
          const quote = getMotivationalQuote('late'); // Default quote for failed attempts
          return { 
            success: false, 
            message: qrValidation.reason || 'Invalid QR code', 
            pointsEarned: 0, 
            quote 
          };
        }
        
        // Check if within valid time window (6:00 AM - 9:00 AM MST)
        const timeValidation = isWithinValidTimeWindow();
        if (!timeValidation.isValid) {
          const quote = getMotivationalQuote('late');
          return { 
            success: false, 
            message: timeValidation.reason || 'Check-in outside valid hours', 
            pointsEarned: 0, 
            quote 
          };
        }
        
        const now = new Date();
        
        // Convert to MST for point calculation
        const mstTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Denver"}));
        const currentHour = mstTime.getHours();
        const currentMinute = mstTime.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        // MST Time thresholds: 7:45 AM = 465 minutes, 8:00 AM = 480 minutes, 8:05 AM = 485 minutes
        const earlyBirdThreshold = 465; // 7:45 AM MST
        const onTimeThreshold = 480;    // 8:00 AM MST
        const lateThreshold = 485;      // 8:05 AM MST
        
        let pointsEarned = 0;
        let checkInType: 'ontime' | 'early' | 'late' = 'late';
        let bonusReason: string | undefined;
        
        if (currentTime <= earlyBirdThreshold) {
          pointsEarned = 2;
          checkInType = 'early';
        } else if (currentTime <= onTimeThreshold) {
          pointsEarned = 1;
          checkInType = 'ontime';
        } else if (currentTime <= lateThreshold) {
          pointsEarned = 0; // 8:00-8:05 AM = 0 points
          checkInType = 'late';
        } else {
          pointsEarned = 0; // 8:05-9:00 AM = 0 points
          checkInType = 'late';
        }
        
        const state = get();
        const employees = [...state.employees];
        const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
        
        if (employeeIndex === -1) {
          const quote = getMotivationalQuote('late');
          return { success: false, message: 'Employee not found', pointsEarned: 0, quote };
        }
        
        const employee = { ...employees[employeeIndex] };
        
        // Check if already checked in today
        const today = format(now, 'yyyy-MM-dd');
        const todayCheckIn = employee.checkIns.find(ci => 
          format(parseISO(ci.timestamp), 'yyyy-MM-dd') === today
        );
        
        if (todayCheckIn) {
          const quote = getMotivationalQuote('late');
          return { 
            success: false, 
            message: 'You have already checked in today. One check-in per day allowed.', 
            pointsEarned: 0, 
            quote 
          };
        }
        
        const checkIn: CheckIn = {
          id: Date.now().toString(),
          timestamp: now.toISOString(),
          pointsEarned,
          type: checkInType,
          bonusReason,
        };
        
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
          checkIn.pointsEarned = pointsEarned;
          checkIn.bonusReason = bonusReason;
        } else if (employee.currentStreak === 10) {
          pointsEarned += 10;
          bonusReason = '10-Day Streak Bonus';
          checkIn.pointsEarned = pointsEarned;
          checkIn.bonusReason = bonusReason;
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
        
        set({
          ...state,
          employees,
          currentEmployee: state.currentEmployee?.id === employeeId ? employee : state.currentEmployee,
        });
        
        const message = checkInType === 'early' ? 'Early Bird! +2 points' : 
                       checkInType === 'ontime' ? 'Perfect timing! +1 point' : 
                       'You made it within the window! +0 points';
        
        const quote = getMotivationalQuote(checkInType);
        
        return { success: true, message, pointsEarned, quote };
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

      approveRewardRedemption: (redemptionId: string) => {
        set((state) => {
          const employees = [...state.employees];
          let updated = false;
          
          for (let i = 0; i < employees.length; i++) {
            const redemptionIndex = employees[i].rewardsRedeemed.findIndex(r => r.id === redemptionId);
            if (redemptionIndex !== -1) {
              employees[i] = {
                ...employees[i],
                rewardsRedeemed: employees[i].rewardsRedeemed.map(reward =>
                  reward.id === redemptionId ? { ...reward, status: 'approved' as const } : reward
                )
              };
              updated = true;
              break;
            }
          }
          
          return updated ? { ...state, employees } : state;
        });
        
        return true;
      },

      rejectRewardRedemption: (redemptionId: string) => {
        set((state) => {
          const employees = [...state.employees];
          let updated = false;
          
          for (let i = 0; i < employees.length; i++) {
            const redemptionIndex = employees[i].rewardsRedeemed.findIndex(r => r.id === redemptionId);
            if (redemptionIndex !== -1) {
              const reward = employees[i].rewardsRedeemed[redemptionIndex];
              employees[i] = {
                ...employees[i],
                totalPoints: employees[i].totalPoints + reward.pointsCost, // Refund points
                rewardsRedeemed: employees[i].rewardsRedeemed.map(r =>
                  r.id === redemptionId ? { ...r, status: 'rejected' as const } : r
                )
              };
              updated = true;
              break;
            }
          }
          
          return updated ? { ...state, employees } : state;
        });
        
        return true;
      },

      awardBonusPoints: (employeeId: string, points: number, reason: string) => {
        set((state) => {
          const employees = [...state.employees];
          const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
          
          if (employeeIndex === -1) return state;
          
          const bonusPoint: BonusPoint = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            pointsAwarded: points,
            reason: reason,
            awardedBy: 'Admin',
          };
          
          employees[employeeIndex] = {
            ...employees[employeeIndex],
            totalPoints: employees[employeeIndex].totalPoints + points,
            weeklyPoints: employees[employeeIndex].weeklyPoints + points,
            monthlyPoints: employees[employeeIndex].monthlyPoints + points,
            quarterlyPoints: employees[employeeIndex].quarterlyPoints + points,
            bonusPoints: [...(employees[employeeIndex].bonusPoints || []), bonusPoint],
          };
          
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
            recentBonusPoints: [],
          };
        }
        
        const today = new Date();
        const todayCheckIns = (employee.checkIns || []).filter(ci => 
          isToday(parseISO(ci.timestamp))
        );
        
        const recentCheckIns = (employee.checkIns || [])
          .slice(-7)
          .reverse();
          
        const recentBonusPoints = (employee.bonusPoints || [])
          .slice(-7)
          .reverse();
        
        return {
          todayPoints: todayCheckIns.reduce((sum, ci) => sum + ci.pointsEarned, 0),
          weeklyPoints: employee.weeklyPoints,
          monthlyPoints: employee.monthlyPoints,
          quarterlyPoints: employee.quarterlyPoints,
          currentStreak: employee.currentStreak,
          recentCheckIns,
          recentBonusPoints,
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply data migration to ensure all employees have required properties
          state.employees = migrateEmployeeData(state.employees);
          if (state.currentEmployee) {
            state.currentEmployee = migrateEmployeeData([state.currentEmployee])[0];
          }
        }
      },
    }
  )
);
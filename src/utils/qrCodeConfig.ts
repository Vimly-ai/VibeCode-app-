// QR Code Configuration for Employee Check-in System

export interface QRCodeConfig {
  baseUrl: string;
  validTimeWindow: {
    start: string; // 6:00 AM MST
    end: string;   // 9:00 AM MST
  };
  timezone: string;
  rotationStrategy: 'daily' | 'weekly' | 'monthly' | 'manual';
  expirationDays: number;
}

// QR Code URL Configuration
export const QR_CONFIG: QRCodeConfig = {
  baseUrl: 'https://rewards.company.com/checkin',
  validTimeWindow: {
    start: '06:00',
    end: '09:00'
  },
  timezone: 'America/Denver', // Mountain Standard Time
  rotationStrategy: 'manual', // Admin decides when to rotate codes
  expirationDays: 365 // QR codes valid until manually changed
};

// Manual QR Code Version - Change this number when you want to invalidate old QR codes
export const MANUAL_QR_VERSION = 1; // Increment this (1, 2, 3, etc.) to create new QR codes

// Generate QR code URL based on rotation strategy
export const generateQRCode = (): string => {
  const today = new Date();
  let periodString: string;
  
  switch (QR_CONFIG.rotationStrategy) {
    case 'daily':
      periodString = today.toISOString().split('T')[0]; // YYYY-MM-DD
      break;
    case 'weekly':
      // Get Monday of current week
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      periodString = `week-${monday.toISOString().split('T')[0]}`;
      break;
    case 'monthly':
      periodString = `month-${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      break;
    case 'manual':
      // For manual rotation, use a version that admin can manually update
      periodString = `manual-v${MANUAL_QR_VERSION}`;
      break;
    default:
      periodString = today.toISOString().split('T')[0];
  }
  
  // Generate token based on period
  const token = btoa(`employee-checkin-${periodString}-${QR_CONFIG.baseUrl}`);
  
  // Construct the check-in URL
  const qrUrl = `${QR_CONFIG.baseUrl}?period=${periodString}&token=${token}&strategy=${QR_CONFIG.rotationStrategy}&v=1.0`;
  
  return qrUrl;
};

// Backward compatibility - alias for generateQRCode
export const generateDailyQRCode = generateQRCode;

// Validate QR code format and timing
export const validateQRCode = (scannedData: string): {
  isValid: boolean;
  reason?: string;
  extractedData?: {
    period: string;
    token: string;
    strategy: string;
    version: string;
  };
} => {
  try {
    // Check if it's our check-in URL format
    if (!scannedData.includes(QR_CONFIG.baseUrl)) {
      return {
        isValid: false,
        reason: 'This is not a valid check-in QR code.'
      };
    }
    
    // Parse URL parameters
    const url = new URL(scannedData);
    const period = url.searchParams.get('period');
    const token = url.searchParams.get('token');
    const strategy = url.searchParams.get('strategy');
    const version = url.searchParams.get('v');
    
    // Handle legacy format (date parameter)
    const legacyDate = url.searchParams.get('date');
    if (legacyDate && !period) {
      // Legacy daily format validation
      const today = new Date().toISOString().split('T')[0];
      if (legacyDate !== today) {
        return {
          isValid: false,
          reason: 'QR code is expired. Please use today\'s QR code.'
        };
      }
      const expectedToken = btoa(`employee-checkin-${legacyDate}-${QR_CONFIG.baseUrl}`);
      if (token !== expectedToken) {
        return {
          isValid: false,
          reason: 'Invalid QR code token. Please use the official QR code.'
        };
      }
      return { isValid: true, extractedData: { period: legacyDate, token: token!, strategy: 'daily', version: version! } };
    }
    
    if (!period || !token || !version) {
      return {
        isValid: false,
        reason: 'Missing required parameters in QR code.'
      };
    }
    
    // Validate based on rotation strategy
    const today = new Date();
    let isValidPeriod = false;
    
    switch (strategy || QR_CONFIG.rotationStrategy) {
      case 'daily':
        const todayString = today.toISOString().split('T')[0];
        isValidPeriod = period === todayString;
        break;
      case 'weekly':
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const weekString = `week-${monday.toISOString().split('T')[0]}`;
        isValidPeriod = period === weekString;
        break;
      case 'monthly':
        const monthString = `month-${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        isValidPeriod = period === monthString;
        break;
      case 'manual':
        // Manual codes don't expire automatically - admin controls this
        isValidPeriod = true;
        break;
      default:
        isValidPeriod = false;
    }
    
    if (!isValidPeriod) {
      const strategyName = strategy || QR_CONFIG.rotationStrategy;
      return {
        isValid: false,
        reason: `QR code has expired. Please use the current ${strategyName} QR code.`
      };
    }
    
    // Validate token format
    const expectedToken = btoa(`employee-checkin-${period}-${QR_CONFIG.baseUrl}`);
    if (token !== expectedToken) {
      return {
        isValid: false,
        reason: 'Invalid QR code token. Please use the official QR code.'
      };
    }
    
    return {
      isValid: true,
      extractedData: { period, token, strategy: strategy || QR_CONFIG.rotationStrategy, version }
    };
    
  } catch (error) {
    return {
      isValid: false,
      reason: 'Invalid QR code format.'
    };
  }
};

// Check if current time is within valid check-in window (MST)
export const isWithinValidTimeWindow = (): {
  isValid: boolean;
  reason?: string;
  currentTime?: string;
  windowStart?: string;
  windowEnd?: string;
} => {
  const now = new Date();
  
  // Convert to Mountain Standard Time
  const mstTime = new Date(now.toLocaleString("en-US", {timeZone: QR_CONFIG.timezone}));
  const currentHour = mstTime.getHours();
  const currentMinute = mstTime.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  // Parse valid time window
  const [startHour, startMinute] = QR_CONFIG.validTimeWindow.start.split(':').map(Number);
  const [endHour, endMinute] = QR_CONFIG.validTimeWindow.end.split(':').map(Number);
  
  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  const isWithinWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  
  if (!isWithinWindow) {
    let reason: string;
    if (currentMinutes < startMinutes) {
      reason = `Check-in window hasn't opened yet. Please wait until ${QR_CONFIG.validTimeWindow.start} AM MST.`;
    } else {
      reason = "Check-in Window Missed\nYou didn't catch today's check-in, but no worries, tomorrow is a new opportunity.";
    }
    
    return {
      isValid: false,
      reason,
      currentTime: currentTimeStr,
      windowStart: QR_CONFIG.validTimeWindow.start,
      windowEnd: QR_CONFIG.validTimeWindow.end
    };
  }
  
  return {
    isValid: true,
    currentTime: currentTimeStr,
    windowStart: QR_CONFIG.validTimeWindow.start,
    windowEnd: QR_CONFIG.validTimeWindow.end
  };
};

// Generate QR code data for display (what gets encoded in the QR image)
export const getQRCodeData = (): {
  qrData: string;
  displayInfo: {
    validPeriod: string;
    rotationStrategy: string;
    expirationInfo: string;
    validTimeWindow: string;
    timezone: string;
    instructions: string[];
  };
} => {
  const qrData = generateQRCode();
  const today = new Date();
  
  let validPeriod: string;
  let expirationInfo: string;
  
  switch (QR_CONFIG.rotationStrategy) {
    case 'daily':
      validPeriod = today.toLocaleDateString();
      expirationInfo = 'Expires at end of day';
      break;
    case 'weekly':
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      validPeriod = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
      expirationInfo = 'Expires at end of week (Sunday)';
      break;
    case 'monthly':
      const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      validPeriod = monthName;
      expirationInfo = 'Expires at end of month';
      break;
    case 'manual':
      validPeriod = 'Until manually updated';
      expirationInfo = 'Admin controls expiration';
      break;
    default:
      validPeriod = today.toLocaleDateString();
      expirationInfo = 'Expires at end of day';
  }
  
  return {
    qrData,
    displayInfo: {
      validPeriod,
      rotationStrategy: QR_CONFIG.rotationStrategy,
      expirationInfo,
      validTimeWindow: `${QR_CONFIG.validTimeWindow.start} AM - ${QR_CONFIG.validTimeWindow.end} AM`,
      timezone: 'Mountain Standard Time (MST)',
      instructions: [
        'Open the RewardSpace employee app',
        'Tap the "Check In Now" button on your dashboard',
        'Point your camera at this QR code',
        'Wait for confirmation and earn your points!',
        'One scan per day during valid hours only'
      ]
    }
  };
};

// Demo QR codes for testing
export const DEMO_QR_CODES = {
  valid: generateQRCode(),
  expired: `${QR_CONFIG.baseUrl}?period=2024-01-01&token=expired123&strategy=daily&v=1.0`,
  invalid: 'https://example.com/not-a-checkin-code'
};

// Configuration options for different rotation strategies
export const ROTATION_STRATEGIES = {
  daily: {
    name: 'Daily Rotation',
    description: 'Generate new QR codes every day',
    pros: ['Maximum security', 'Forces daily admin attention', 'Prevents long-term code sharing'],
    cons: ['Requires daily management', 'More work for admins'],
    recommended: 'High-security environments or small teams'
  },
  weekly: {
    name: 'Weekly Rotation', 
    description: 'Generate new QR codes every Monday',
    pros: ['Good security balance', 'Less admin work', 'Easy to remember schedule'],
    cons: ['Codes valid for 7 days', 'Moderate security risk'],
    recommended: 'Most common business environments (RECOMMENDED)'
  },
  monthly: {
    name: 'Monthly Rotation',
    description: 'Generate new QR codes monthly',
    pros: ['Minimal admin work', 'Very convenient', 'Good for stable teams'],
    cons: ['Lower security', 'Codes valid for 30 days'],
    recommended: 'Trusted environments or very small teams'
  },
  manual: {
    name: 'Manual Rotation',
    description: 'Admin decides when to rotate codes',
    pros: ['Complete control', 'Rotate only when needed', 'Can respond to security incidents'],
    cons: ['Requires active management', 'May forget to rotate'],
    recommended: 'Custom security needs or incident-based rotation'
  }
};
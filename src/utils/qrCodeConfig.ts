// QR Code Configuration for Employee Check-in System

export interface QRCodeConfig {
  baseUrl: string;
  validTimeWindow: {
    start: string; // 6:00 AM MST
    end: string;   // 9:00 AM MST
  };
  timezone: string;
  expirationMinutes: number;
}

// QR Code URL Configuration
export const QR_CONFIG: QRCodeConfig = {
  baseUrl: 'https://rewards.company.com/checkin',
  validTimeWindow: {
    start: '06:00',
    end: '09:00'
  },
  timezone: 'America/Denver', // Mountain Standard Time
  expirationMinutes: 15 // Each QR code expires after 15 minutes
};

// Generate daily QR code URL with security token
export const generateDailyQRCode = (): string => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Generate a simple daily token (in production, use proper cryptographic methods)
  const dailyToken = btoa(`employee-checkin-${dateString}-${QR_CONFIG.baseUrl}`);
  
  // Construct the check-in URL
  const qrUrl = `${QR_CONFIG.baseUrl}?date=${dateString}&token=${dailyToken}&v=1.0`;
  
  return qrUrl;
};

// Validate QR code format and timing
export const validateQRCode = (scannedData: string): {
  isValid: boolean;
  reason?: string;
  extractedData?: {
    date: string;
    token: string;
    version: string;
  };
} => {
  try {
    // Check if it's our check-in URL format
    if (!scannedData.includes(QR_CONFIG.baseUrl)) {
      return {
        isValid: false,
        reason: 'Invalid QR code format. Please use the official check-in QR code.'
      };
    }
    
    // Parse URL parameters
    const url = new URL(scannedData);
    const date = url.searchParams.get('date');
    const token = url.searchParams.get('token');
    const version = url.searchParams.get('v');
    
    if (!date || !token || !version) {
      return {
        isValid: false,
        reason: 'Missing required parameters in QR code.'
      };
    }
    
    // Validate date is today
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) {
      return {
        isValid: false,
        reason: 'QR code is expired. Please use today\'s QR code.'
      };
    }
    
    // Validate token format
    const expectedToken = btoa(`employee-checkin-${date}-${QR_CONFIG.baseUrl}`);
    if (token !== expectedToken) {
      return {
        isValid: false,
        reason: 'Invalid QR code token. Please use the official QR code.'
      };
    }
    
    return {
      isValid: true,
      extractedData: { date, token, version }
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
      reason = `Check-in window has closed. Check-in is only available between ${QR_CONFIG.validTimeWindow.start} AM - ${QR_CONFIG.validTimeWindow.end} AM MST.`;
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
    validDate: string;
    validTimeWindow: string;
    timezone: string;
    instructions: string[];
  };
} => {
  const qrData = generateDailyQRCode();
  const today = new Date().toLocaleDateString();
  
  return {
    qrData,
    displayInfo: {
      validDate: today,
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
  valid: generateDailyQRCode(),
  expired: `${QR_CONFIG.baseUrl}?date=2024-01-01&token=expired123&v=1.0`,
  invalid: 'https://example.com/not-a-checkin-code'
};
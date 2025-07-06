export interface MotivationalQuote {
  text: string;
  author: string;
  category: 'early' | 'ontime' | 'late';
}

export const motivationalQuotes: MotivationalQuote[] = [
  // Early Bird Quotes - For those who arrive early
  {
    text: "The early bird catches the worm, but the second mouse gets the cheese. You're getting both today!",
    author: "Success Mindset",
    category: 'early'
  },
  {
    text: "Excellence is not a skill, it's an attitude. Your early arrival shows you've already chosen excellence.",
    author: "Ralph Marston",
    category: 'early'
  },
  {
    text: "Success is where preparation and opportunity meet. You're preparing for greatness!",
    author: "Bobby Unser",
    category: 'early'
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams. Keep dreaming big!",
    author: "Eleanor Roosevelt",
    category: 'early'
  },
  {
    text: "Champions don't become champions in the ring. They become champions in their training.",
    author: "Muhammad Ali",
    category: 'early'
  },
  {
    text: "Your dedication to being early is building the foundation for extraordinary achievements.",
    author: "Growth Mindset",
    category: 'early'
  },
  {
    text: "The way to get started is to quit talking and begin doing. You're already doing it!",
    author: "Walt Disney",
    category: 'early'
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out. You're winning!",
    author: "Robert Collier",
    category: 'early'
  },

  // On Time Quotes - For punctual arrivals
  {
    text: "Punctuality is the soul of business. You're showing your commitment to excellence.",
    author: "Thomas Chandler Haliburton",
    category: 'ontime'
  },
  {
    text: "Being on time is a sign of respect - for others and for yourself. Well done!",
    author: "Success Principles",
    category: 'ontime'
  },
  {
    text: "Consistency is the mother of mastery. Your reliability is building something great.",
    author: "Robin Sharma",
    category: 'ontime'
  },
  {
    text: "Small steps in the right direction can turn out to be the biggest steps of your life.",
    author: "Naeem Callaway",
    category: 'ontime'
  },
  {
    text: "Progress, not perfection. Every on-time arrival is progress toward your goals.",
    author: "Motivational Wisdom",
    category: 'ontime'
  },
  {
    text: "Your commitment to being here on time reflects your commitment to your future.",
    author: "Professional Growth",
    category: 'ontime'
  },
  {
    text: "Discipline is the bridge between goals and accomplishment. You're crossing it daily.",
    author: "Jim Rohn",
    category: 'ontime'
  },
  {
    text: "The difference between ordinary and extraordinary is that little extra. You're showing it!",
    author: "Jimmy Johnson",
    category: 'ontime'
  },

  // Late but Positive Quotes - For late arrivals (still encouraging)
  {
    text: "Every master was once a disaster. Today is a new opportunity to grow!",
    author: "T. Harv Eker",
    category: 'late'
  },
  {
    text: "It's not about perfect timing, it's about never giving up. You're here and that matters!",
    author: "Resilience Mindset",
    category: 'late'
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: 'late'
  },
  {
    text: "Every day is a chance to begin again. Tomorrow is your fresh start!",
    author: "Positive Thinking",
    category: 'late'
  },
  {
    text: "Fall seven times, stand up eight. Your persistence is what makes you extraordinary.",
    author: "Japanese Proverb",
    category: 'late'
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: 'late'
  },
  {
    text: "Life is 10% what happens to you and 90% how you react to it. Choose to grow!",
    author: "Charles R. Swindoll",
    category: 'late'
  },
  {
    text: "Tomorrow is the first day of the rest of your life. Make it count!",
    author: "Abbie Hoffman",
    category: 'late'
  },
  {
    text: "The only impossible journey is the one you never begin. You're on your way!",
    author: "Tony Robbins",
    category: 'late'
  },
  {
    text: "Believe you can and you're halfway there. Your determination will carry you forward.",
    author: "Theodore Roosevelt",
    category: 'late'
  }
];

export const getMotivationalQuote = (checkInType: 'early' | 'ontime' | 'late'): MotivationalQuote => {
  const quotesForType = motivationalQuotes.filter(quote => quote.category === checkInType);
  const randomIndex = Math.floor(Math.random() * quotesForType.length);
  return quotesForType[randomIndex];
};

export const getRandomQuote = (): MotivationalQuote => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};
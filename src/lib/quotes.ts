/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Quote {
  id: string;
  text: string;
  author: string;
  category?: string;
}

export const quotes: Quote[] = [
  {
    id: "1",
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "Work"
  },
  {
    id: "2",
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "Success"
  },
  {
    id: "3",
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "Mindset"
  },
  {
    id: "4",
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: "Life"
  },
  {
    id: "5",
    text: "The best way to predict your future is to create it.",
    author: "Abraham Lincoln",
    category: "Future"
  },
  {
    id: "6",
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
    category: "Fear"
  },
  {
    id: "7",
    text: "Difficulties in life are intended to make us better, not bitter.",
    author: "Dan Reeves",
    category: "Hardship"
  },
  {
    id: "8",
    text: "The hard days are what make you stronger.",
    author: "Aly Raisman",
    category: "Strength"
  },
  {
    id: "9",
    text: "Dream big and dare to fail.",
    author: "Norman Vaughan",
    category: "Ambition"
  },
  {
    id: "10",
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
    category: "Growth"
  },
  {
    id: "11",
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "Persistence"
  },
  {
    id: "12",
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    category: "Persistence"
  },
  {
    id: "13",
    text: "Act as if what you do makes a difference. It does.",
    author: "William James",
    category: "Impact"
  },
  {
    id: "14",
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    category: "Habits"
  },
  {
    id: "15",
    text: "If you want to live a happy life, tie it to a goal, not to people or things.",
    author: "Albert Einstein",
    category: "Happiness"
  }
];

export function getDailyQuote(): Quote {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const index = dayOfYear % quotes.length;
  return quotes[index];
}

export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

import { User } from './types';

export const GENERIC_MESSAGES: string[] = [
    "Keep up the great work! Every step counts.",
    "Consistency is the key to success. You're doing great!",
    "One day at a time, one step at a time. You've got this!",
    "Be proud of yourself for the commitment you've made.",
    "Progress is progress, no matter how small. Keep pushing!",
    "Believe in yourself and all that you are. You are stronger than you think.",
    "The journey of a thousand miles begins with a single step. You're on your way!"
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

export const INITIAL_USERS: User[] = [
  {
    id: 'hussein',
    name: 'Hussein',
    goalWeight: 85,
    weightHistory: [
      { id: 'h_init_1', date: twoDaysAgo.toISOString(), weight: 98 },
      { id: 'h_init_2', date: yesterday.toISOString(), weight: 97.5 },
    ],
  },
  {
    id: 'rola',
    name: 'Rola',
    goalWeight: 65,
    weightHistory: [
        { id: 'r_init_1', date: twoDaysAgo.toISOString(), weight: 75 },
        { id: 'r_init_2', date: yesterday.toISOString(), weight: 74.8 },
    ],
  },
];

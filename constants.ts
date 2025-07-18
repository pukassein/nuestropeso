
import { User } from './types';

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

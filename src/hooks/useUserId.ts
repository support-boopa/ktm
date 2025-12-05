import { useState, useEffect } from 'react';

const USER_ID_KEY = 'ktm_user_id';

const generateUserId = (): string => {
  return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
};

export const getUserId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const useUserId = () => {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  return userId;
};

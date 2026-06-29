import { getToken } from '../main';

export async function getStoredUser() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user ?? null;
  } catch (err) {
    console.error('getStoredUser error:', err);
    return null;
  }
}

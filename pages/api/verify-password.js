// pages/api/verify-password.js
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const passwordHash = process.env.PASSWORD_HASH;

  if (!passwordHash) {
    console.error('PASSWORD_HASH not found in environment variables!');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const isValid = await bcrypt.compare(password, passwordHash);

    if (isValid) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'Nieprawidłowe hasło' });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

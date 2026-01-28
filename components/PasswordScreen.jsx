// components/PasswordScreen.jsx
import { useState } from 'react';

export default function PasswordScreen({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Zapisz w sessionStorage że hasło jest poprawne
        sessionStorage.setItem('auth', 'true');
        onSuccess();
      } else {
        setError(data.error || 'Nieprawidłowe hasło');
        setPassword('');
      }
    } catch (err) {
      setError('Błąd połączenia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-wrapper">
      <div className="password-container">
        <img src="/logo/Logo.png" alt="Logo" className="password-logo" />
        <p className="password-subtitle">Wprowadź hasło dostępu</p>

        <form onSubmit={handleSubmit} className="password-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Hasło"
            className="password-input"
            disabled={loading}
            autoFocus
          />

          {error && (
            <p className="password-error">❌ {error}</p>
          )}

          <button 
            type="submit" 
            className="password-button"
            disabled={loading || !password}
          >
            {loading ? 'Sprawdzanie...' : 'Wejdź'}
          </button>
        </form>
      </div>
    </div>
  );
}

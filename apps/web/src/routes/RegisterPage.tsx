import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.js';
import { ApiRequestError } from '../api/client.js';
import styles from './AuthForm.module.css';

export function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password);
      setSubmittedEmail(email);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.eyebrow}>Deutsch lernen</div>
          <h1 className={styles.title}>Check your email</h1>
          <p>
            We've sent a confirmation link to <strong>{submittedEmail}</strong>. Click it to activate your
            account, then log in.
          </p>
          <div className={styles.switchLine}>
            <Link to="/login">Go to login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.eyebrow}>Deutsch lernen</div>
        <h1 className={styles.title}>Create account</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button className="btn primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className={styles.switchLine}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.js';
import { ApiRequestError } from '../api/client.js';
import { resendVerification } from '../api/auth.api.js';
import styles from './AuthForm.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setResendState('idle');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
      } else {
        setError(err instanceof ApiRequestError ? err.message : 'Login failed.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResendState('sending');
    await resendVerification(email).catch(() => undefined);
    setResendState('sent');
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.eyebrow}>Deutsch lernen</div>
        <h1 className={styles.title}>Log in</h1>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {needsVerification && (
            <div className={styles.error}>
              Please confirm your email before logging in.{' '}
              {resendState === 'sent' ? (
                'A new confirmation link is on its way.'
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === 'sending'}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}
                >
                  {resendState === 'sending' ? 'Sending…' : 'Resend confirmation email'}
                </button>
              )}
            </div>
          )}
          <button className="btn primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <div className={styles.switchLine}>
          No account yet? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

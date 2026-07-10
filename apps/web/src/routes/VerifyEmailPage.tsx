import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.js';
import { verifyEmail } from '../api/auth.api.js';
import { ApiRequestError } from '../api/client.js';
import styles from './AuthForm.module.css';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { applySession } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('This confirmation link is missing its token.');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        applySession(res);
        navigate('/');
      })
      .catch((err) => {
        setStatus('error');
        setError(err instanceof ApiRequestError ? err.message : 'Verification failed.');
      });
  }, [searchParams, applySession, navigate]);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.eyebrow}>Deutsch lernen</div>
        {status === 'verifying' ? (
          <>
            <h1 className={styles.title}>Confirming…</h1>
            <p>Hang on while we confirm your account.</p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Couldn't confirm</h1>
            <p>{error}</p>
            <div className={styles.switchLine}>
              <Link to="/login">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

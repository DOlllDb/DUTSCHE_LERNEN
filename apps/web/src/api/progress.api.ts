import type { Progress } from '@deutsch-lernen/shared';
import { apiRequest } from './client.js';

export function fetchProgress(): Promise<Progress> {
  return apiRequest<Progress>('/api/progress');
}

export function saveProgress(progress: Progress): Promise<Progress> {
  return apiRequest<Progress>('/api/progress', {
    method: 'PUT',
    body: JSON.stringify(progress),
  });
}

export function submitQuizResult(testDay: number, score: number, total: number): Promise<Progress> {
  return apiRequest<Progress>('/api/progress/quiz-result', {
    method: 'POST',
    body: JSON.stringify({ testDay, score, total }),
  });
}

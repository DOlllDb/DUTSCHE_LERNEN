import type { Curriculum } from '@deutsch-lernen/shared';
import { apiRequest } from './client.js';

export function fetchCurriculum(): Promise<Curriculum> {
  return apiRequest<Curriculum>('/api/curriculum');
}

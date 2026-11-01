import { fetchWithAuth } from './api';

export const postNewJob = async (jobData) => {
  return fetchWithAuth('/job/create', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
};

export const getNearbyJobs = async (lat, lng, radiusKm = 10) => {
  return fetchWithAuth(`/job/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
};
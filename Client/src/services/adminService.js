import api from './api';

/**
 * Fetch mentor applications filtered by status.
 * @param {{ status?: 'pending'|'approved'|'rejected', page?: number, limit?: number }} params
 */
export const getMentorApplications = async (params = {}) => {
  try {
    const { data } = await api.get('/api/admin/mentors/pending', { params });
    return { success: true, data };
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to load applications.';
    return { success: false, message };
  }
};

/**
 * Fetch a single mentor application by ID.
 * @param {string} id
 */
export const getMentorApplicationById = async (id) => {
  try {
    const { data } = await api.get(`/api/admin/mentors/${id}`);
    return { success: true, data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, notFound: true, message: 'Application not found.' };
    }
    const message =
      error.response?.data?.message || error.message || 'Failed to load application.';
    return { success: false, message };
  }
};

/**
 * Approve a mentor application.
 * @param {string} id
 */
export const approveMentor = async (id) => {
  try {
    const { data } = await api.patch(`/api/admin/mentor/${id}/approve`);
    return { success: true, data };
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to approve mentor.';
    return { success: false, message };
  }
};

/**
 * Reject a mentor application.
 * @param {string} id
 */
export const rejectMentor = async (id) => {
  try {
    const { data } = await api.patch(`/api/admin/mentor/${id}/reject`);
    return { success: true, data };
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to reject mentor.';
    return { success: false, message };
  }
};

/**
 * Re-trigger AI evaluation for a mentor application.
 * @param {string} id
 */
export const retriggerEvaluation = async (id) => {
  try {
    const { data } = await api.post(`/api/admin/mentor/${id}/re-evaluate`);
    return { success: true, data };
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to re-trigger evaluation.';
    return { success: false, message };
  }
};

import api from './api';

/**
 * Submit a new mentor application.
 * @param {FormData} formData  - multipart/form-data payload including the resume PDF
 * @returns {Promise<object>}
 */
export const submitMentorApplication = async (formData) => {
  try {
    const { data } = await api.post('/mentor-application/apply', formData, {
      headers: { 'Content-Type': undefined }, // let browser set boundary automatically
    });
    return { success: true, data };
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to submit application.';
    return { success: false, message };
  }
};

/**
 * Fetch the authenticated mentor's own application (including AI evaluation).
 * @returns {Promise<object>}
 */
export const getMyApplication = async () => {
  try {
    const { data } = await api.get('/mentor-application/my');
    return { success: true, data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, notFound: true, message: 'No application found.' };
    }
    const message =
      error.response?.data?.message || error.message || 'Failed to load application.';
    return { success: false, message };
  }
};

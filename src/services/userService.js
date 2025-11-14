import api from "./api";

export const fetchProfile = (username) => api.get(`/users/${username}`);

export const followUser = async (username) => {
  // First fetch the user to get their ID
  const profileRes = await api.get(`/users/${username}`);
  const userId = profileRes.data._id || profileRes.data.id;
  // Then send follow request using ID
  return api.post(`/users/${userId}/follow`);
};

export const unfollowUser = (username) =>
  api.post(`/users/${username}/unfollow`);
export const updateProfile = (payload) => api.patch(`/users/me`, payload);

// Fetch suggested users (random users)
export const fetchSuggestions = (limit = 3) =>
  api.get(`/users/suggestions?limit=${limit}`);

import api from "./api";

export const login = (credentials) => api.post("/auth/login", credentials);
export const signup = (data) => api.post("/auth/signup", data);
export const logout = () => Promise.resolve();

export const facebookLogin = async (accessToken) => {
  // avoid logging the full token — show a short preview only
  try {
    console.debug("[authService] facebookLogin called", {
      tokenPreview: accessToken ? accessToken.slice(0, 8) + "..." : null,
    });
    const res = await api.post("/auth/facebook", { accessToken });
    console.debug("[authService] facebookLogin response", res);
    return res;
  } catch (err) {
    console.error("[authService] facebookLogin error", err);
    throw err;
  }
};

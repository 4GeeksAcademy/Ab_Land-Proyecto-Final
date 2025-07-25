// store.js

export const initialStore = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const projects = localStorage.getItem("projects");
  return {
    token: token || null,
    user: user ? JSON.parse(user) : null,
    projects: projects ? JSON.parse(projects) : null,
    error: null,
    success:null,
    profile_colors: [
      "red",
      "brown",
      "orange",
      "yellow",
      "mint",
      "green",
      "aqua",
      "blue",
      "purple",
    ],

  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      return {
        ...store,
        token: action.payload.token,
        user: action.payload.user,
        error: null,
      };

    case "LOGOUT":
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("projects");
      return {
        ...store,
        token: null,
        user: null,
        projects:null,
        error: null,
      };
    case "profile_change":
      localStorage.setItem("user", JSON.stringify(action.payload));
      return {
        ...store,
        user: action.payload,
        error: null,
      } 
    case "projects":
      localStorage.setItem("projects", JSON.stringify(action.payload));
      return {
        ...store,
        projects: action.payload,
        error: null,
      };
    case "reload/delete projects":
      localStorage.removeItem("projects");
      return {
        ...store,
        projects: null,
      };
    case "error":
      return {
        ...store,
        error: action.payload ? action.payload : null,
      };

    case "success":
      return {
        ...store,
        success: action.payload ? action.payload : null,
      };

    default:
      // Instead of throwing an error (which would crash the app), we simply return the existing store.
      // You can log a warning if you want.
      console.warn("Unknown action type:", action.type);
      return store;
  }
}

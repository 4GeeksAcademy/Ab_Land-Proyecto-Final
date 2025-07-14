import { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate, Link } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "error", payload: null }); // clear errors

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        dispatch({ type: "error", payload: data.msg });
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.access_token } });
      navigate("/dashboard");
    } catch (err) {
      dispatch({ type: "error", payload: err?.message || "Error de conexión con el servidor" });
    }
  };

  return (
    <div className="container app">
      <div className="card flex-center flex-column p-5 max-w-md mt-10">
      <h1 className="mb-4">Log in to Your Account</h1>
      <form className="w-25 text-center" onSubmit={handleSubmit} >
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="form-control mb-3"
        />
        <div className="mb-3 position-relative">
              
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                className="form-control"
                onChange={e => setPassword(e.target.value)}
                id="password"
                required
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary top-50 border-0 position-absolute end-0 translate-middle-y me-2"
                style={{ zIndex: 2, }}
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <i className="fa-regular fa-eye-slash"/> : <i className="fa-regular fa-eye"/>}
              </button>
            </div>
        <button
          type="submit"
          className="btn btn-primary"
        >
          Login
        </button>
      </form>
      {store.error && <p className="text-red-500 mt-3">{store.error}</p>}
      <p className="mt-3">
        Don't have an account? <Link to="/register" className="text-blue-600">Register here</Link>
      </p>
      <p className="mt-3">
        Forgot your password? <Link to="/restore-password" className="text-blue-600">Reset here</Link>
      </p>
    </div>
    </div>
  );
}


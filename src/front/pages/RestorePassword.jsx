import React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const RestorePassword = () => {
  const [email, setEmail] = useState("");
  const [passwordOne, setPasswordOne] = useState("");
  const [passwordTwo, setPasswordTwo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();

  const comparePasswords = (passwordOne, passwordTwo) => {
    if (passwordOne !== passwordTwo) {
      dispatch({ type: "error", payload: "Passwords do not match" });
      return false;
    } else {
      
      return true;
    }
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    if (comparePasswords(passwordOne, passwordTwo)) {
      postNewPassword();
    }
  };

  const submitEmail = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/restore-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        dispatch({
          type: "error",
          payload: data.msg || "email not found, use a valid email",
        });
        return;
      }
      dispatch({
        type: "success",
        payload:
          "A reset link has been sent to your email. Please check your inbox.",
      });
    } catch (err) {
      dispatch({
        type: "error",
        payload: err?.message  || "Could not connect to backend.",
      });
    }
  };

  const postNewPassword = async () => {    
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/restore-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: passwordOne }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        dispatch({
          type: "error",
          payload: data.msg || "token not valid or expired",
        });
        return;
      }
      dispatch({
        type: "success",
        payload:
          "Your password has been successfully restored. You can now log in with your new password.",
      });
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      dispatch({
        type: "error",
        payload: err?.message  || "Could not connect to backend.",
      });
    }
  };

  return (
    <div className="container app">
      <div className="card flex-center flex-column p-4 max-w-md mt-10">
        <Link to="/login" className="me-auto">          
          ← Back
        </Link>

        <h1 className="mb-4">EchoBoard Restore</h1>
        <p className="mb-4">
          Please fill in the details below to restore your password.
        </p>
        
        {!token && (
          <form className="w-50 text-center">
            <input
              type="email"
              className="form-control mb-3"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
              onClick={submitEmail}
            >
              Reset Password
            </button>
          </form>
        )}

        {token && (
          <form className="w-50 text-center">
            <div className="mb-3">
              <label htmlFor="new-password" className="form-label">
                New Password
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordOne}
                  className="form-control"
                  placeholder="New Password"
                  onChange={(e) => setPasswordOne(e.target.value)}
                  id="new-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary border-0 position-absolute top-50 end-0 translate-middle-y me-2"
                  style={{ zIndex: 2 }}
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <i className="fa-regular fa-eye-slash" />
                  ) : (
                    <i className="fa-regular fa-eye" />
                  )}
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="confirm-password" className="form-label">
                Confirm New Password
              </label>
              <div className="position-relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={passwordTwo}
                  className="form-control"
                  placeholder="Re-enter Password"
                  onChange={(e) => setPasswordTwo(e.target.value)}
                  id="confirm-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary border-0 position-absolute top-50 end-0 translate-middle-y me-2"
                  style={{ zIndex: 2 }}
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? (
                    <i className="fa-regular fa-eye-slash" />
                  ) : (
                    <i className="fa-regular fa-eye" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary on mt-4"
              onClick={handleSaveNewPassword}
            >
              Save new Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

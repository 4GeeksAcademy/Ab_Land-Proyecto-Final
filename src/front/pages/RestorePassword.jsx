import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

export const RestorePassword = () => {
  const [email, setEmail] = useState("");
  const [mailSent, setMailSent] = useState(false);
  const [passwordRestored, setPasswordRestored] = useState(false);
  const [passwordOne, setPasswordOne] = useState("");
  const [passwordTwo, setPasswordTwo] = useState("");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { token } = useParams(); // Get token from URL if needed
  const navigate = useNavigate();

  const comparePasswords = (passwordOne, passwordTwo) => {
    if (passwordOne !== passwordTwo) {
      setError("Passwords do not match")
      return false;
    } else {
      setError("");
      setNewPassword(passwordOne);
      return true;
    }
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    if (comparePasswords(passwordOne, passwordTwo)) {
      postNewPassword(e);
    }
  };

  const submitEmail = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/restore-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "email not found, use a valid email");
        // Handle error
        return;
      }
      setMailSent(true);
      
    } catch (err) {
      
    }
  };

  const postNewPassword = async () => {
        
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/restore-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "token not valid or expired");
        return;
      }
      
      setPasswordRestored(true);
    } catch (err) {
      
      setError(err || "Connection error");
    }
  }

  return (
    <div className="px-5 container-fluid">
      <div className="card flex-center flex-column p-5 max-w-md mx-auto mt-10">

        <h1 className="mb-4">EchoBoard Restore</h1>
        <p className="mb-4">
          Please fill in the details below to restore your password.
        </p>

        <div className="divider"></div>
        {!mailSent && !token && (
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
        {mailSent && (
          <div
            className="alert alert-success alert-dismissible fade show mt-3"
            role="alert"
          >
            A reset link has been sent to your email. Please check your inbox.
            <button
              className="btn-close"
              onClick={() => navigate("/login")}
            ></button>
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError("")}></button>
          </div>
        )}
        {token && (
          <form className="w-50 text-center">
            <div className="mb-3">
              <label htmlFor="new-password" className="form-label">
                New Password
              </label>
              <input
                type="password"
                value={passwordOne}
                className="form-control"
                onChange={(e) => setPasswordOne(e.target.value)}
                id="new-password"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="confirm-password" className="form-label">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordTwo}
                className="form-control"
                onChange={(e) => {
                  setPasswordTwo(e.target.value);                  
                }}
                id="confirm-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary on"
              onClick={handleSaveNewPassword}
            >
              Save new Password
            </button>
          </form>
        )}
        {passwordRestored && token && (
          <div
            className="alert alert-success alert-dismissible fade show mt-3"
            role="alert"
          >
            Your password has been successfully restored. You can now log in
            with your new password.
            <button
              className="btn-close"
              onClick={() => navigate("/login")}
            ></button>
          </div>
        )}
      </div>
    </div>

  );
};

import React, { useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

import logo from "../assets/img/SVG/logo_v5.svg";

export const Navbar = () => {
  const { store, dispatch } = useGlobalReducer();

  const tokenVerification = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/jwtcheck`, {
        headers: {
          Authorization: "Bearer " + store.token,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.status === 401 || res.status === 422) {
        console.error("Token expired or invalid:", data);
        dispatch({ type: "LOGOUT" });
        return;
      }
      if (res.status === 200) {
        return;
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      dispatch({ type: "LOGOUT" });
    }
  };

  useEffect(() => {
    if (store.token) {
      tokenVerification();
    }
  }, [store.token, dispatch]);

  const navigate = useNavigate();

  let profileColor =
    store.user && store.user.random_profile_color
      ? store.profile_colors[store.user.random_profile_color]
      : "green";

  const handleLogOut = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  const location = useLocation();
  const path = location.pathname;

  const goTo = (id) => {
    document.getElementById(id).scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="navbar navbar-expand-lg mb-1 p-0 shadow"
      style={{
        background: "var(--gray-900)",
        borderBottom: "1.5px solid var(--green-400)",
        zIndex: 20,
      }}
    >
      <div className="container-fluid mx-md-5 py-1">
        <a
          className="navbar-brand d-flex align-items-center text-white"
          href="/"
          style={{ gap: "1rem" }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: "4.2rem", height: "4.2rem" }}
            className="d-inline-block mx-2"
          />
          <strong
            style={{
              fontWeight: "bold",
              letterSpacing: ".05em",
              fontSize: "2.1rem",
              color: "var(--green-400)",
              textShadow: "1px 2px 3px rgba(0,0,0,.13)",
            }}
          >
            EchoBoard
          </strong>
        </a>

        <button
          className="navbar-toggler navbar-dark"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {path === "/" && (
            <ul className="nav mx-auto" style={{ gap: "1.3rem" }}>
              {store.token && (
                <li className="nav-item">
                  <button
                    className="nav-link text-white fw-semibold"
                    style={{ fontSize: "1.09rem" }}
                    onClick={() => {
                      navigate("/dashboard");
                    }}
                  >
                    Dashboard
                  </button>
                </li>
              )}
              <li className="nav-item">
                <button
                  className="nav-link text-white fw-semibold"
                  style={{ fontSize: "1.09rem" }}
                  onClick={() => {
                    goTo("home");
                  }}
                >
                  Home
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link text-white fw-semibold"
                  style={{ fontSize: "1.09rem" }}
                  onClick={() => {
                    goTo("howitworks");
                  }}
                >
                  How it Works
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link text-white fw-semibold"
                  style={{ fontSize: "1.09rem" }}
                  onClick={() => {
                    goTo("ourteam");
                  }}
                >
                  Our Team
                </button>
              </li>
            </ul>
          )}

          {!store.token && (
            <Link to="login" className="shadow-lg ms-auto">
              <button
                className="btn text-white"
                style={{
                  background: "var(--green-500)",
                  fontWeight: "bold",
                  letterSpacing: ".03em",
                  fontSize: "1.12rem",
                  borderRadius: "26px",
                  padding: "7px 25px",
                  boxShadow: "0 3px 8px rgba(0,80,60,.08)",
                }}
              >
                Log In
              </button>
            </Link>
          )}

          {store.token && (
            <div className="dropdown-center ms-auto me-2 d-lg-block d-none">
              <button
                className="ms-auto text-white rounded-circle portrait flex-center shadow-sm"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{
                  height: "48px",
                  width: "48px",
                  position: "relative",
                  backgroundColor: `var(--${profileColor}-500)`,
                  padding: 0,
                  overflow: "hidden",
                  border: "2.5px solid var(--green-400)",
                  boxShadow: "0 2px 8px rgba(0,60,45,.07)",
                  cursor: "pointer",
                  transition: "border 0.1s",
                }}
                onDoubleClick={() =>
                  navigate(`/profile/${store.user && store.user.id}`)
                }
                title="Go to profile"
              >
                <img
                  src={store.user.profile_picture_url}
                  alt="Profile"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(store.user.full_name)}&background=random`;
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />

              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ minWidth: 155 }}>
                <li>
                  <Link
                    className="dropdown-item text-end"
                    to={`/profile/${store.user.id}`}
                  >
                    <span role="img" aria-label="Profile" className="me-2">👤</span>
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item text-end"
                    to="/dashboard"
                  >
                    <span role="img" aria-label="Dashboard" className="me-2">📊</span>
                    Dashboard
                  </Link>
                </li>
                <div className="dropdown-divider"></div>
                <li>
                  <button
                    className="dropdown-item text-danger text-end"
                    onClick={handleLogOut}
                  >
                    <span role="img" aria-label="Logout" className="me-2">🚪</span>
                    Log Out
                  </button>
                </li>
              </ul>
            </div>
          )}
          {store.token && <ul className="navbar-nav navbar-dark d-lg-none ">
            <li className="nav-link">
              <Link
                className="dropdown-item text-end"
                to={`/profile/${store.user.id}`}
              >
                <span role="img" aria-label="Profile" className="me-2">👤</span>
                Profile
              </Link>
            </li>
            <li className="nav-link">
              <Link
                className="dropdown-item text-end"
                to="/dashboard"
              >
                <span role="img" aria-label="Dashboard" className="me-2">📊</span>
                Dashboard
              </Link>
            </li>
            <div className="dropdown-divider bg-white "></div>
            <li className="nav-link">
              <button
                className="dropdown-item text-danger text-end"
                onClick={handleLogOut}
              >
                <span role="img" aria-label="Logout" className="me-2">🚪</span>
                Log Out
              </button>
            </li>
          </ul>}
        </div>
      </div>
    </nav>
  );
};


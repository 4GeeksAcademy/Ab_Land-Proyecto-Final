import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useEffect } from "react";

import logo from "../assets/img/SVG/logo_v5.svg";

export const Navbar = () => {
  const { store, dispatch } = useGlobalReducer();

  const tokenVerification = async () => {
    // verificar si tiene token de acceso
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/jwtcheck`, {
        headers: {
          Authorization: "Bearer " + store.token,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      // Token expirado/inválido: 401 o 422 => fuerza logout
      if (res.status === 401 || res.status === 422) {
        console.error("Token expired or invalid:", data);
        dispatch({ type: "LOGOUT" });
        return;
      }
      // Token válido: 200 => no hacer nada
      if (res.status === 200) {
        return;
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      dispatch({ type: "LOGOUT" });
    }
  };
  // Verificar token al cargar el componente
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
    <nav className="navbar navbar-expand-lg mb-1 p-0">
      <div className="container-fluid mx-5 py-1">
        <a
          className="navbar-brand d-flex align-items-center text-white"
          href="/"
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: "5rem", height: "5rem" }}
            className="d-inline-block mx-2 "
          />
          <strong>EchoBoard</strong>
        </a>

        <button
          className="navbar-toggler"
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
            <ul className="nav mx-auto ">
              {store.token && (
                <li className="nav-item">
                  <button
                    className="nav-link text-white"
                    onClick={() => {
                      navigate("/dashboard");
                    }}
                  >
                    {" "}
                    Dashboard
                  </button>
                </li>
              )}
              <li className="nav-item">
                <button
                  className="nav-link text-white"
                  onClick={() => {
                    goTo("home");
                  }}
                >
                  {" "}
                  Home
                </button>
              </li>
              <li className="nav-item ">
                <button
                  className="nav-link text-white"
                  onClick={() => {
                    goTo("howitworks");
                  }}
                >
                  {" "}
                  How it Works
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link text-white"
                  onClick={() => {
                    goTo("ourteam");
                  }}
                >
                  {" "}
                  Our Team
                </button>
              </li>
            </ul>
          )}

          {!store.token && (
            <Link to="login" className="shadow-lg ms-auto ">
              <button
                className="btn text-white"
                style={{ background: "var(--green-500)" }}
              >
                LogIn
              </button>
            </Link>
          )}

          {store.token && (
            <div className="dropdown-center ms-auto me-2">
              <button
                className="ms-auto text-white rounded-circle portrait flex-center"
                type="button"
                data-bs-toggle="dropdown"
                style={{
                  height: "48px",
                  width: "48px",
                  position: "relative",
                  backgroundColor: `var(--${profileColor}-500)`,
                  padding: 0,
                  overflow: "hidden",
                  border: "2px solid var(--green-500)"
                }}
              >
                {store.user && store.user.profile_picture_url ? (
                  <img
                    src={store.user.profile_picture_url}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%"
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "1.4rem",
                      color: "white"
                    }}
                  >
                    {store.user.full_name ? store.user.full_name[0] : "?"}
                  </span>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link
                    className="dropdown-item text-end"
                    to={`/profile/${store.user.id}`}
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item text-end"
                    to="/dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
                <div className="dropdown-divider"></div>
                <li>
                  <button
                    className="dropdown-item text-danger text-end "
                    onClick={() => {
                      handleLogOut();
                    }}
                  >
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};


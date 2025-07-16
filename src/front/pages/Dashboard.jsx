import React, { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { Link, useNavigate } from "react-router-dom";
import { ProjectCard } from "../components/ProjectCard";
import { WelcomeModal } from "../components/WelcomeModal";

export default function Dashboard() {
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState(null);

  // Start false, don't show modal until we know for sure
  const [showModal, setShowModal] = useState(false);
  const [projectEmpty, setProjectEmpty] = useState(false);
  const [tab, setTab] = useState("admin");

  // Only show welcome alert if not previously closed
  const [welcomeMsg, setWelcomeMsg] = useState(() => {
    return localStorage.getItem("hideWelcomeMsg") !== "true";
  });

  // AI Standup states
  const [standupLoading, setStandupLoading] = useState(false);
  const [standupText, setStandupText] = useState("");
  const [standupError, setStandupError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!store.token) {
      navigate("/login");
      return;
    }
    if (!store.projects) {
      fetchProjects();
    } else {
      setProjects(store.projects);
    }
  }, [store.token]);

  useEffect(() => {
    // Wait until we have finished loading and have a value for projects
    if (!loading && projects) {
      if (
        projects.admin && projects.admin.length === 0 &&
        projects.member && projects.member.length === 0
      ) {
        setShowModal(true);
        setProjectEmpty(true);
      } else {
        setProjectEmpty(false);
        setShowModal(false);
      }
    }
  }, [loading, projects]);

  const fetchProjects = async () => {
    setLoading(true);
    dispatch({ type: "error", payload: null });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/projects`,
        {
          headers: {
            Authorization: "Bearer " + store.token,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await res.json();

      if (res.status === 401 || res.status === 422) {
        dispatch({ type: "LOGOUT" });
        dispatch({ type: "error", payload: "Session expired. Please log in again." });
        navigate("/login");
        return;
      }

      if (!res.ok) {
        dispatch({ type: "error", payload: data.msg || "Error fetching projects." });
        setProjects(null);
      } else {
        setProjects(data.user_projects);
        dispatch({ type: "projects", payload: data.user_projects });
      }
    } catch (err) {
      dispatch({ type: "error", payload: err?.message || "Could not connect to backend." });
    } finally {
      setLoading(false);
    }
  };

  // AI Standup function
  const fetchStandup = async () => {
    setStandupLoading(true);
    setStandupText("");
    setStandupError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/standup`, {
        method: "POST",  
        headers: {
          Authorization: "Bearer " + store.token,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setStandupError(data.msg || "Could not generate AI Standup.");
      } else {
        setStandupText(data.standup || data.summary || "No summary generated.");
      }
    } catch (err) {
      setStandupError(err.message || "Could not connect to backend.");
    } finally {
      setStandupLoading(false);
    }
  };

  // Only hide welcomeMsg if user clicks the X button
  const handleWelcomeClose = () => {
    setWelcomeMsg(false);
    localStorage.setItem("hideWelcomeMsg", "true");
  };

  if (!store.token) {
    return <p>Redirecting to login...</p>;
  }

  return (
    <div className="container app ">
      {/* Welcome message with profile picture */}
      {store.user && welcomeMsg && (
        <div className="alert alert-info alert-dismissible mb-4 d-flex align-items-center " role="alert">
          <img
            src={store.user.profile_picture_url}
            alt="Profile"
            onError={e => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(store.user.full_name)}&background=random`;
            }}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              marginRight: "1rem",
              border: "2px solid var(--green-500)"
            }}
          />
          Welcome,&nbsp;<strong className="text-capitalize">{` ${store.user.full_name || store.user.email}`}</strong>! 👋
          <button type="button" className="btn-close mt-2" aria-label="Close" onClick={handleWelcomeClose}></button>
        </div>
      )}

      <div className="mb-4 bg-white text-dark rounded p-2 pt-3 ">
        <h1 className="fw-bold d-flex align-items-center ms-2">
          <img
            src={store.user.profile_picture_url}
            alt="Profile"
            onError={e => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(store.user.full_name)}&background=random`;
            }}
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid var(--blue-500)",
              marginRight: "1.5rem",
            }}
          />
          <span className="text-dark">
            {store.user.full_name}{" "}
            <span title="Verified" className="text-primary" style={{ fontSize: 28 }}>
              <i className="fa-solid fa-circle-check"></i>
            </span>
          </span>
        </h1>
        <div className="d-flex gap-3 mt-3 pt-1 border-top align-items-center">
          <button
            className={`btn px-2 dashboard-switch-btn ${tab === "admin" ? "border-bottom border-2 border-primary" : ""}`}
            style={{ fontWeight: "bold" }}
            onClick={() => setTab("admin")}
          >
            Admin
          </button>
          <button
            className={`btn px-2 dashboard-switch-btn ${tab === "member" ? "border-bottom border-2 border-primary" : ""}`}
            style={{ fontWeight: "bold" }}
            onClick={() => setTab("member")}
          >
            Member
          </button>

          {/* Create New Project button */}
          <Link
            to="/newProject"
            className="btn btn-primary ms-auto dashboard-main-action"
            style={{ fontWeight: 600 }}
          >
            Create New Project
          </Link>

          {/* AI Standup button */}
          <button
            className="btn-ai-standup dashboard-main-action ms-3"
            onClick={fetchStandup}
            disabled={standupLoading}
            style={{ fontWeight: 600 }}
          >
            <span className="ai-sparkle">✨</span>
            {standupLoading ? "Generating..." : "AI Standup"}
          </button>
        </div>
      </div>

      {/* Standup spinner */}
      {standupLoading && (
        <div style={{ maxWidth: 980, margin: "0 auto 1.5rem auto" }}>
          <div className="standup-spinner mt-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <span role="status" className="ms-2">Generating AI Standup...</span>
          </div>
        </div>
      )}
      {standupError && (
        <div className="alert alert-danger" style={{ maxWidth: 980, margin: "0 auto 1.5rem auto" }}>
          {standupError}
        </div>
      )}
      {standupText && (
        <div
          className="ai-standup-card"
          style={{
            maxWidth: 980,
            width: "100%",
            margin: "2rem auto",
            background: "#e3f3fd",
            borderRadius: "1.2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            padding: "2rem 2.2rem",
            color: "#203040"
          }}
        >
          <h4 style={{ fontWeight: 700, fontSize: "1.45rem", marginBottom: "0.7rem" }}>
            <span className="ai-sparkle">✨</span>AI Standup
          </h4>
          <div style={{ whiteSpace: "pre-line" }}>{standupText}</div>
        </div>
      )}

      {loading && <div className="flex-center mb-4" >
        <span className="spinner-border spinner-border me-4" aria-hidden="true"></span>
        <span role="status">Loading...</span>
      </div>}

      {!projectEmpty && projects ? (
        <>
          {tab === "admin" && <>{(projects.admin && projects.admin.length > 0)
            ? projects.admin.map(proj => (
              <Link to={`/project/${proj.id}`} key={proj.id}>
                <ProjectCard
                  project={proj}
                />
              </Link>
            ))
            : <>{!loading && <h4 className="text-center">You are not an admin of any project.</h4>}</>
          }</>}
          {tab === "member" && <> {(projects.member && projects.member.length > 0)
            ? projects.member.map(proj => (
              <Link to={`/project/${proj.id}`} key={proj.id}>
                <ProjectCard
                  project={proj}
                />
              </Link>
            ))
            : <>{!loading && <h4 className="text-center">You are not a member of any project.</h4>}</>
          }</>}
        </>
      ) : !loading && projectEmpty && <div className="text-center"><h3>No projects found.</h3></div>}
      

      {/* Only render WelcomeModal if we know user has NO projects */}
      {showModal && (
        <WelcomeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
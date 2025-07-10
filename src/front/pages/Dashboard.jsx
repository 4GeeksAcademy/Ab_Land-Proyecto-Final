import React, { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { Link, useNavigate } from "react-router-dom";
import { ProjectCard } from "../components/ProjectCard";
import { WelcomeModal } from "../components/WelcomeModal";

export default function Dashboard() {
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [projectEmpty, setProjectEmpty] = useState(false)
  const [tab, setTab] = useState("admin")

  const navigate = useNavigate();

  useEffect(() => {
    if (!store.token) {
      navigate("/login");
      return;
    }
    if (!store.projects) {
      fetchProjects()
    }
    setProjects(store.projects)
    setTimeout(() => {
      setLoading(false)
    }, 1000);
    handleWelcomeModal()

  }, [store.token, projects]);

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

  const handleWelcomeModal = () => {
    if (projects &&
      projects.admin && projects.admin.length == 0 &&
      projects.member && projects.member.length == 0
    ) {
      setShowModal(true);
      setProjectEmpty(true)
    }
  };

  if (!store.token) {
    return <p>Redirecting to login...</p>;
  }

  return (
    <div className="container app ">
      {/* Welcome message with profile picture */}
      {store.user && (
        <div className="alert alert-info alert-dismissible mb-4 d-flex align-items-center " role="alert">
          {store.user.profile_picture_url ? (
            <img
              src={store.user.profile_picture_url}
              alt="Profile"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                marginRight: "1rem",
                border: "2px solid var(--green-500)"
              }}
            />
          ) : (
            <span
              className="d-inline-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#eee",
                marginRight: "1rem",
                fontSize: "1.5rem",
                fontWeight: "bold",
                border: "2px solid var(--green-500)"
              }}
            >
              {store.user.full_name ? store.user.full_name[0] : "?"}
            </span>
          )}
          Welcome,&nbsp;<strong className="text-capitalize">{` ${store.user.full_name || store.user.email}`}</strong>! 👋
          <button type="button" className="btn-close mt-2" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      <div className="mb-4 bg-white text-dark rounded p-2 pt-3 ">

        <h1 className="fw-bold d-flex align-items-center ms-2">
          <img
            src={store.user.profile_picture_url}
            alt="Profile"
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
            className={`btn px-2 ${tab === "admin" ? "border-bottom border-2 border-primary" : ""}`}
            style={{ color: tab === "admin" ? "#0D8ABC" : "#555", fontWeight: "bold" }}
            onClick={() => setTab("admin")}
          >
            Admin
          </button>
          <button
            className={`btn px-2 ${tab === "member" ? "border-bottom border-2 border-primary" : ""}`}
            style={{ color: tab === "member" ? "#0D8ABC" : "#555", fontWeight: "bold" }}
            onClick={() => setTab("member")}
          >
            Member
          </button>

          <Link to="/newProject" className="btn btn-primary ms-auto">Create New Project</Link>

        </div>
      </div>

      {loading && <div class="flex-center mb-4" >
        <span class="spinner-border spinner-border me-4" aria-hidden="true"></span>
        <span role="status">Loading...</span>
      </div>}

      {!projectEmpty && projects ? (
        <>
          {tab == "admin" && <>{(projects.admin && projects.admin.length > 0)
            ? projects.admin.map(proj => (
              <Link to={`/project/${proj.id}`} key={proj.id}>
                <ProjectCard
                  project={proj}
                />
              </Link>
            ))
            : <>{!loading && <h4 className="text-center">You are not a admin of any project.</h4>}</>
          }</>}
          {tab == "member" && <> {(projects.member && projects.member.length > 0)
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

      ) : !loading && projectEmpty && <div>No projects found.</div>}

      {/* Modal no project wellcome */}
      <WelcomeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}

      />
    </div>
  );
}
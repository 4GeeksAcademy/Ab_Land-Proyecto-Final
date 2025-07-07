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
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!store.token) {
      navigate("/login");
      return;
    }
    if (!store.user_projects){
      fetchProjects()
    }
    setProjects(store.user_projects)    
    handleWelcomeModal(projects)
    
  }, [store.token]);

  const fetchProjects = async () => {
      setLoading(true);
      dispatch({ type: "error", payload: null });

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/projects`,
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
        dispatch({ type: "error", payload: "Could not connect to backend." });
      } finally {
        setLoading(false);
      }
    };

  const handleWelcomeModal = (projectsData) => {
  if (projectsData && projectsData.admin && projectsData.admin.length == 0) {
    setShowModal(true);
  } else {
    setShowModal(false);
  }
};

  if (!store.token) {
    return <p>Redirecting to login...</p>;
  }

  return (
    <div className="container app ">
      <h2>User Dashboard: Your Projects</h2>
      <Link to="/newProject" className="btn btn-primary mb-3">Create New Project</Link>

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
          Welcome, <strong>{store.user.full_name || store.user.email}</strong>! 👋
          <button type="button" className="btn-close mt-2" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {loading && <p>Loading projects...</p>}

      {projects ? (
        <div>
          <h4>As admin:</h4>
          <ul>
            {(projects.admin && projects.admin.length > 0)
              ? projects.admin.map(proj => (
                <Link to={`/project/${proj.id}`} key={proj.id}>
                  <ProjectCard
                    project={proj}
                  />
                </Link>
              ))
              : <li>You are not an admin of any project.</li>
            }
          </ul>
          <h4>As member:</h4>
          <ul>
            {(projects.member && projects.member.length > 0)
              ? projects.member.map(proj => (
                <Link to={`/project/${proj.id}`} key={proj.id}>
                  <ProjectCard
                    project={proj}
                  />
                </Link>
              ))
              : <li>You are not a member of any project.</li>
            }
          </ul>
        </div>
      ) : !loading && <div>No projects found.</div>}
      
      {/* Modal no project wellcome */}
                  <WelcomeModal                     
                      isOpen={showModal}
                      onClose={() => setShowModal(false)}
                      
                  />
    </div>
  );
}







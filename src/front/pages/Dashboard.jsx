import React, { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "../components/ProjectCard";
import { EditProject } from "../components/EditProject";

export default function Dashboard() {
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!store.token) {
      navigate("/login");
      return;
    }

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
        }
      } catch (err) {
        dispatch({ type: "error", payload: "Could not connect to backend." });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [store.token, dispatch, navigate]);

  // Función para abrir el modal de edición
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  // Función para actualizar la lista después de editar
  const handleUpdateProject = (updatedProject) => {
    setProjects(prevProjects => {
      if (!prevProjects) return prevProjects;

      return {
        admin: prevProjects.admin.map(proj =>
          proj.id === updatedProject.id ? updatedProject : proj
        ),
        member: prevProjects.member.map(proj =>
          proj.id === updatedProject.id ? updatedProject : proj
        )
      };
    });
    setShowEditModal(false);
  };

  if (!store.token) {
    return <p>Redirecting to login...</p>;
  }

  return (
    <div className="container py-5">
      <h2>User Dashboard: Your Projects</h2>

      {/* Welcome message with profile picture */}
      {store.user && (
        <div className="alert alert-info mb-4 d-flex align-items-center">
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
        </div>
      )}

      {loading && <p>Loading projects...</p>}

      {projects ? (
        <div>
          <h4>As admin:</h4>
          <ul>
            {(projects.admin && projects.admin.length > 0)
              ? projects.admin.map(proj => (
                <ProjectCard key={proj.id} project={proj} onEdit={handleEditProject} />
              ))
              : <li>You are not an admin of any project.</li>
            }
          </ul>
          <h4>As member:</h4>
          <ul>
            {(projects.member && projects.member.length > 0)
              ? projects.member.map(proj => (
                <ProjectCard key={proj.id} project={proj} onEdit={handleEditProject} />
              ))
              : <li>You are not a member of any project.</li>
            }
          </ul>
        </div>
      ) : !loading && <div>No projects found.</div>}

      {/* Modal de edición */}
      <EditProject
        project={selectedProject}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdateProject}
      />
    </div>
  );
}







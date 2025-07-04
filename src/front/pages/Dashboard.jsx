import React, { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "../components/ProjectCard";
import { EditProject } from "../components/EditProject";
import { AddMembersModal } from "../components/AddMembersModal";

export default function Dashboard() {
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
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

  // Función para abrir el modal de añadir miembros
  const handleAddMembers = (project) => {
    setSelectedProject(project);
    setShowAddMembersModal(true);
  };

  // Función para actualizar la lista después de editar
  const handleUpdateProject = (closeModal = true) => {
    // Refrescar todos los proyectos para obtener los datos más actualizados
    const fetchProjects = async () => {
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
        if (res.ok) {
          setProjects(data.user_projects);
          // Actualizar también el proyecto seleccionado si está abierto el modal de añadir miembros
          if (selectedProject && !closeModal) {
            const updatedProject = data.user_projects.find(p => p.id === selectedProject.id);
            if (updatedProject) {
              setSelectedProject(updatedProject);
            }
          }
        }
      } catch (err) {
        console.error("Error refreshing projects:", err);
      }
    };

    fetchProjects();
    if (closeModal) {
      setShowEditModal(false);
      setShowAddMembersModal(false);
    }
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
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  onEdit={handleEditProject}
                  onAddMembers={handleAddMembers}
                />
              ))
              : <li>You are not an admin of any project.</li>
            }
          </ul>
          <h4>As member:</h4>
          <ul>
            {(projects.member && projects.member.length > 0)
              ? projects.member.map(proj => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  onEdit={handleEditProject}
                  onAddMembers={handleAddMembers}
                />
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

      {/* Modal de añadir miembros */}
      <AddMembersModal
        project={selectedProject}
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        onUpdate={() => handleUpdateProject(false)}
      />
    </div>
  );
}







import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TaskCard } from '../components/TaskCard'
import { ProjectCardXL } from '../components/ProjectCardXL'
import useGlobalReducer from "../hooks/useGlobalReducer"
import { EditProject } from "../components/EditProject";
import { AddMembersModal } from "../components/AddMembersModal";

export const ProjectFullView = () => {
    const { store } = useGlobalReducer();
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);

    // Determinar el rol del usuario en el proyecto
    const getUserRole = () => {
        if (!project || !store.user) return 'member';

        // Si el usuario es el admin del proyecto
        if (project.admin_id === store.user.id) {
            return 'admin';
        }

        // Si el usuario es miembro del proyecto
        return 'member';
    };

    useEffect(() => {
        const fetchProjectAndTasks = async () => {
            await getProject();
            await getTasks();
        };
        fetchProjectAndTasks();
    }, [id]);

    const getProject = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + (store.token || localStorage.getItem("token")),
                },
            });
            const data = await res.json();
            if (!res.ok) {
                console.error("Error fetching project:", data.msg || "Unknown error");
                return;
            }
            console.log("Project data:", data.project);

            setProject(data.project);
        } catch (error) {
            console.error("Error fetching project:", error);
        }
    };

    const getTasks = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}/tasks`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + (store.token || localStorage.getItem("token")),
                },
            });
            const data = await res.json();
            if (!res.ok) {
                console.error("Error fetching tasks:", data.msg || "Unknown error");
                return;
            }
            console.log("Tasks data:", data.tasks);
            setTasks(data.tasks || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

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

    if (!project) {
        return <p className='text-center'>Loading project...</p>;
    }

    return (
        <div className="px-5 container app">
            <div className=" p-4 ">
                <ProjectCardXL project={project} onEdit={handleEditProject}
                    onAddMembers={handleAddMembers}/>

                {tasks && tasks.length > 0 ? (
                    <div className="mt-3 d-flex align-items-center justify-content-between">
                        <div></div>
                        <h3 className="mb-2 p-2">Tasks</h3>
                        <Link to={`/projects/${project.id}/tasks/new`} className="btn btn-primary">
                            +
                        </Link>
                    </div>
                ) : (
                    <div className="my-3 d-flex align-items-center justify-content-between">
                        <div></div>
                        <h3>No tasks available</h3>
                        <Link to={`/projects/${project.id}/tasks/new`} className="btn btn-primary ">
                            +
                        </Link>
                    </div>
                )}
                {tasks && tasks.length > 0 && (
                    <div className="mt-3">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                userRole={getUserRole()}
                            />
                        ))}
                    </div>
                )}
            </div>

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
    )
}

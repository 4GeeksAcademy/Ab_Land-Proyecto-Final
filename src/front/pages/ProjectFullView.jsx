import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TaskCard } from '../components/TaskCard'
import { ProjectCardXL } from '../components/ProjectCardXL'
import useGlobalReducer from "../hooks/useGlobalReducer"
import { EditProject } from "../components/EditProject";
import { AddMembersModal } from "../components/AddMembersModal";
import { AddEditTask } from '../components/Add-Edit-Task'

export const ProjectFullView = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [taskOnEdit, setTaskOnEdit] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState(null)

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

    const filterProjectById = (projectId) => {
        const roles = Object.keys(store.projects); 

        for (const role of roles) {
            const project = store.projects[role].find(project => project.id === projectId);
            if (project) return project;
        }

        return null;
    };



    useEffect(() => {
        const fetchData = async () => {
            if (store.projects) {
                const foundProject = filterProjectById(id);
                if (foundProject) {
                    setProject(foundProject);
                } else {
                    await getProject();
                    await getTasks();
                }
            } else {
                await getProject();
                await getTasks();
            }
        };

        fetchData();
    }, [id, store.projects]);

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
                dispatch({ type: "error", payload: data.msg || "Something went wrong" });
                return;
            }
            console.log("Project data:", data.project);

            setProject(data.project);
        } catch (error) {
            dispatch({ type: "error", payload: "Could not connect to backend." });
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
                dispatch({ type: "error", payload: data.msg || "Something went wrong when getting tasks" });
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

        getProject();
        if (closeModal) {
            setShowEditModal(false);
            setShowAddMembersModal(false);
        }
    };

    const handleUpdateTasks = (closeModal = true) => {
        getTasks();
        if (closeModal) {
            setShowTaskModal(false);
            setTaskOnEdit(false);
            setTaskToEdit(null)
        }
    }
    const handleEditTask = (task) => {
        setTaskToEdit(task);
        setTaskOnEdit(true);
        setTimeout(() => {
            setShowTaskModal(true);
        }, 0);
    };

    if (!project) {
        return <p className='text-center'>Loading project...</p>;
    }



    return (
        <div className="px-5 container app">
            <div className=" p-4 ">
                <ProjectCardXL project={project} onEdit={handleEditProject}
                    onAddMembers={handleAddMembers} />

                <div className="my-3 d-flex align-items-center justify-content-between">
                    <div></div>
                    {tasks && tasks.length > 0 ? (<h3 className="mb-2 p-2">Tasks</h3>) : (<h3>No tasks available</h3>)}
                    <button className='btn btn-warning text-white' onClick={() => { setShowTaskModal(true) }}> add task </button>
                </div>

                {tasks && tasks.length > 0 && (
                    <div className="mt-3">
                        {tasks.map((task) =>
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={() => handleEditTask(task)}
                                userRole={getUserRole()}
                            />


                        )}
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
            {/* Modal de añadir task */}
            <AddEditTask
                project={project}
                isOpen={showTaskModal}
                onEdit={taskOnEdit}
                task={taskToEdit || null}
                onClose={() => setShowTaskModal(false)}
                onUpdate={handleUpdateTasks}
            />

        </div>
    )
}

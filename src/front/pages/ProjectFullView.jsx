import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TaskCard } from '../components/TaskCard'
import { ProjectCardXL } from '../components/ProjectCardXL'
import useGlobalReducer from "../hooks/useGlobalReducer"
import { EditProject } from "../components/EditProject";
import { AddMembersModal } from "../components/AddMembersModal";
import { AddEditTask } from '../components/Add-Edit-Task'
import { MemberCard } from '../components/MemberCard'

export const ProjectFullView = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskOnEdit, setTaskOnEdit] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [projectVersion, setProjectVersion] = useState(0);
    const [tab, setTab] = useState("overview");
    const [userRole, setUserRole] = useState("member")


    
    const filterProjectById = (projectId) => {
        const roles = Object.keys(store.projects);

        for (const role of roles) {
            const project = store.projects[role].find(project => project.id === projectId);
            if (project) return project;
        }

        return null;
    };

    useEffect(() => {
        if (!project || !store.user) {
            setUserRole('member');
        } else if (project.admin_id === store.user.id) {
            setUserRole('admin');
        } else {
            setUserRole('member');
        }
    }, [project, store.user]);

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

    // useEffect para refrescar el proyecto cuando se actualiza
    useEffect(() => {
        if (projectVersion > 0) {
            getProject();
        }
    }, [projectVersion]);

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

    // Función para actualizar el proyecto después de editar
    const handleUpdateProject = () => {
        setProjectVersion(prev => prev + 1); // Incrementar para disparar useEffect
        setShowEditModal(false);
        setShowAddMembersModal(false);
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
                <div className="mb-4 bg-white rounded p-2 pt-3">

                    <ProjectCardXL project={project} onEdit={handleEditProject}
                        onAddMembers={handleAddMembers} />
                    <div className="d-flex gap-3 mt-3 pt-1 border-top align-items-center">
                        <button
                            className={`btn px-2 ${tab === "overview" ? "border-bottom border-2 border-primary" : ""}`}
                            style={{ color: tab === "overview" ? "#0D8ABC" : "#555", fontWeight: "bold" }}
                            onClick={() => setTab("overview")}
                        >
                            Overview
                        </button>
                        <button
                            className={`btn px-2 ${tab === "members" ? "border-bottom border-2 border-primary" : ""}`}
                            style={{ color: tab === "members" ? "#0D8ABC" : "#555", fontWeight: "bold" }}
                            onClick={() => setTab("members")}
                        >
                            Members
                        </button>
                    </div>
                </div>
                {tab == "overview" && (<>
                    <div className="my-3 d-flex align-items-center justify-content-between">
                        <div></div>
                        {tasks && tasks.length > 0 ? (<h3 className="mb-2 p-2">Tasks</h3>) : (<h3>No tasks available</h3>)}
                        <button className='btn btn-warning text-white' onClick={() => { setShowTaskModal(true) }}> Add </button>
                    </div>
                    {tasks && tasks.length > 0 && (
                        <div className="mt-3">
                            {[...tasks].reverse().map((task) =>
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onEdit={() => handleEditTask(task)}
                                    userRole={userRole}
                                    onUpdate={handleUpdateTasks}
                                />
                            )}
                        </div>
                    )}</>)}
                {tab == "members" && (<>
                    <div className="my-3 d-flex align-items-center justify-content-between">
                        <div></div>
                        {project.members && project.members.length > 0 ? (<h3 className="mb-2 p-2">Team Members</h3>) : (<h3>No Member found</h3>)}
                        {userRole == "admin" ?
                            (<button className='btn btn-warning text-white' 
                                onClick={() => { handleAddMembers(project) }}> Add </button>)
                            : (<div></div>)}
                    </div>
                    {project.members && project.members.length > 0 && (
                        <div className="mt-3">
                            {project.members.map((member) =>
                                <MemberCard
                                    member={member}
                                    memberRole={member.id == project.admin_id ? "admin" : "member"}
                                    userRole={userRole}
                                    onUpdate={handleUpdateProject}
                                />
                            )}
                        </div>
                    )}
                </>)}
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
                onUpdate={handleUpdateProject}
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

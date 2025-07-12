import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TaskCard } from '../components/TaskCard'
import { ProjectCardXL } from '../components/ProjectCardXL'
import useGlobalReducer from "../hooks/useGlobalReducer"
import { EditProject } from "../components/EditProject";
import { AddMembersModal } from "../components/AddMembersModal";
import { AddEditTask } from '../components/Add-Edit-Task'
import { MemberCard } from '../components/MemberCard'
import { AlertModal } from '../components/AlertModal'

export const ProjectFullView = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const navigate = useNavigate();
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
    const [showAlertModal, setShowAlertModal] = useState(false)
    

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

    // Refetch project after updates
    useEffect(() => {
        if (projectVersion > 0) {
            getProject();
        }
    }, [projectVersion]);

    const getProject = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${id}`, {
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
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${id}/tasks`, {
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

    // Edit modal
    const handleEditProject = (project) => {
        setSelectedProject(project);
        setShowEditModal(true);
    };

    // Add members modal
    const handleAddMembers = (project) => {
        setSelectedProject(project);
        setShowAddMembersModal(true);
    };

    // Refresh after edit/add
    const handleUpdateProject = () => {
        setProjectVersion(prev => prev + 1);
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

    const fetchProjects = async () => {

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
                //setProjects(null);
            } else {
                //setProjects(data.user_projects);        
                dispatch({ type: "projects", payload: data.user_projects });
                navigate("/dashboard");

            }
        } catch (err) {
            dispatch({ type: "error", payload: err?.message || "Could not connect to backend." });
        } finally {

        }
    };

    // --- Delete Project Handler ---
    const handleDeleteProject = () => {
        setShowAlertModal(true);
        setWhatToDelete("project")
    };
    // Confirm the delete logic here:
    const handleAlertResponse = (res) => {
        setShowAlertModal(false);
        if (res === true) {
            deleteProject();            
        };        
    };
    const deleteProject = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + (store.token || localStorage.getItem("token")),
                },
            });
            const data = await res.json();
            if (!res.ok) {
                dispatch({ type: "error", payload: data.msg || "Could not delete project." });
                return;
            }
            dispatch({ type: "success", payload: "Project deleted successfully!" });
            fetchProjects()
            // Redirect to home or projects list
        } catch (error) {
            dispatch({ type: "error", payload: "Could not connect to backend." });
        }

    }

    if (!project) {
        return (<div className="flex-center my-4" >
        <span className="spinner-border spinner-border me-4" aria-hidden="true"></span>
        <span role="status">Loading...</span>
      </div>)
    }

    return (
        <div className="container app">
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
                    {userRole === "admin" && (
                        <button
                            className="btn btn-outline-danger ms-auto"
                            onClick={handleDeleteProject}
                        >
                            <i className="fa-regular fa-trash-can me-2"></i> Delete Project
                        </button>
                    )}
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
                                key={member.id}
                                member={member}
                                memberRole={member.id == project.admin_id ? "admin" : "member"}
                                userRole={userRole}
                                projectId={project.id}
                                onUpdate={handleUpdateProject}
                                                              
                            />
                        )}
                    </div>
                )}
            </>)}


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
            <AlertModal
                isOpen={showAlertModal}
                onClose={() => setShowAlertModal(false)}
                response={handleAlertResponse}
            />

        </div>
    )
}


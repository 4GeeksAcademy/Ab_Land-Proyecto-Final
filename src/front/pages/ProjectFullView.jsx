import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TaskCard } from '../components/TaskCard'
import { ProjectCardXL } from '../components/ProjectCardXL'
import useGlobalReducer from "../hooks/useGlobalReducer"

export const ProjectFullView = () => {
    const { store } = useGlobalReducer();
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);

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
    if (!project) {
        return <p className='text-center'>Loading project...</p>;
    }

    return (
        <div className="px-5 container-fluid">
            <div className="app bg-light p-4 text-black">
                <ProjectCardXL project={project} />

                {tasks && tasks.length > 0 ? (
                    <div className="mt-3 d-flex align-items-center justify-content-around">
                        <h3 className="mb-2 p-2">Tasks</h3>
                        <Link to={`/projects/${project.id}/tasks/new`} className="btn btn-primary">
                            Add Task
                        </Link>
                    </div>
                ) : (
                    <div className="my-3 d-flex align-items-center justify-content-around">
                        <div></div>
                        <h3>No tasks available</h3>
                        <Link to={`/projects/${project.id}/tasks/new`} className="btn btn-primary ">
                            Add Task
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
        </div>
    )
}

import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TaskCard } from '../components/TaskCard'
import { ProjectCardXL } from '../components/ProjectCardXL'

export const ProjectFullView = () => {

    const { id } = useParams();
    const [project, setProject] = useState(null);

    useEffect(() => {
        const fetchProject = async () => {
            getProject();

        };
        fetchProject();
    }, [id]);

    const getProject = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
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
    if (!project) {
        return <p className='text-center'>Loading project...</p>;
    }
    return (
        <div className="px-5 container-fluid">
            <div className="app bg-light p-4 text-black">
                <ProjectCardXL project={project} />

                {project.tasks && project.tasks.length > 0 ? (
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
                {project.tasks && project.tasks.length > 0 && (
                    <div className="mt-3">
                        {project.tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

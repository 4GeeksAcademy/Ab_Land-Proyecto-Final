import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const ProjectCardS = ({ project, role }) => {
    const [statusColor, setStatusColor] = useState('');
    const navigate = useNavigate();
    console.log(project);

    useEffect(() => {
        if (project.status === 'in progress') {
            setStatusColor('inProgress');
        } else if (project.status === 'yet to start') {
            setStatusColor('yetToStart');
        } else {
            setStatusColor(project.status);
        }
    }, [project]);


    return (
        <div className="card shadow rounded-3 p-3 mb-4 border-0 ">
            <div className="d-flex align-items-center ">
                {/* Project Icon */}
                <img
                    src={
                        project.project_picture_url ||
                        'https://placehold.co/50x50/png?text=No+Image'
                    }
                    alt="Project icon"
                    className="rounded cover me-4"
                    style={{ width: 50, height: 50 }}
                />
                
                    <h5 className="me-2 text-capitalize" style={{width:"20%"}}>{project.title}</h5>
                    <h6 className='me-2'><strong>Role:</strong> {role}</h6>
                    <span className={`badge badge-${statusColor} ms-auto text-capitalize flex-center`}>
                        {project.status}
                    </span>
                </div>

            
        </div>
    )
}

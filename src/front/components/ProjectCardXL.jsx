import React from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';


export const ProjectCardXL = ({ project, onEdit, onAddMembers }) => {

    const { store, dispatch } = useGlobalReducer();
    const [statusColor, setStatusColor] = useState('');
    const navigate = useNavigate();

    const {
        id,
        title,
        description,
        due_date,
        status,
        project_picture_url,
        admin_full_name,
        admin_id,
        members,
        budget
    } = project;

    useEffect(() => {
        if (status === 'in progress') {
            setStatusColor('inProgress');
        } else if (status === 'yet to start') {
            setStatusColor('yetToStart');
        } else {
            setStatusColor(status);
        }
    }, [status]);

    const formattedDate = new Date(due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });


    const isAdmin = store.user.id === admin_id;


    return (
        <div className="card shadow rounded-3 p-3 mb-4 border-0 ">
            <div className="d-flex align-items-start">
                {/* Project Icon */}
                <img
                    src={project_picture_url || "https://placehold.co/150x150/png?text=No+Image"}                    
                    alt="Project icon"
                    className="rounded cover me-2"
                    style={{ width: 150, height: 150 }}
                />
                <div className="mx-2 pt-2 w-auto">
                    <div className="d-flex align-items-center mb-2">
                        <h5 className="mb-1 me-2 fw-bold text-capitalize">{title}</h5>
                        <span className={`badge badge-${statusColor} text-capitalize flex-center`}>
                            {status}
                        </span>

                    </div>
                    <p className="text-muted mb-3" >
                        {description || 'No description provided.'}
                    </p>
                    <div className="row align-items-center mb-2 ps-3">
                        <div className="col me-3 mb-3 p-1 rounded border-dashed text-center"
                            style={{ minWidth: "70px" }}>
                            <small className="mb-0 text-muted">
                                <strong>{formattedDate}</strong>
                            </small> <br />
                            <small className="mb-0 text-muted">Due Date</small>

                        </div>
                        {/* <div className="me-3 p-1 rounded border-dashed text-center">
                            <small className="mb-0 text-muted">
                                <strong>{budget || 'No budget set'}</strong>
                            </small> <br />
                            <small className="mb-0 text-muted">Budget</small>

                        </div> */}
                        <div className="col d-flex ">
                            <div className="mx-2">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        admin_full_name
                                    )}&background=random`}
                                    alt={admin_full_name}
                                    className="rounded-circle"
                                    width="32"
                                    height="32"
                                />
                            </div>
                            {members.length > 0 &&
                                members.slice(0, 8).map((member, idx) => (
                                    <div className="me-2" key={idx}>

                                        <img
                                            src={member.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || `M${idx + 1}`)}&background=random`}
                                            alt={member.full_name || `Member ${idx + 1}`}
                                            className="rounded-circle"
                                            width="32"
                                            height="32"
                                        />
                                    </div>
                                ))}
                            {members.length > 8 && (
                                <span className="badge bg-secondary">+{members.length - 8}</span>
                            )}
                        </div>
                    </div>



                </div>
                <div className='d-flex align-items-center ms-auto'>
                    {/* Edit Button for Admin */}
                    {isAdmin && (
                        <button
                            className="btn btn-sm btn-outline-secondary mb-2"
                            onClick={() => onEdit && onEdit(project)}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

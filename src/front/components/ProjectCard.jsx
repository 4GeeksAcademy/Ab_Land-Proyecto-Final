import React from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';


export const ProjectCard = ({ project, onEdit, onAddMembers }) => {


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
    admin_profile_picture_url,
    admin_full_name,
    admin_id,
    members,
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
    <div className="card shadow-sm rounded-3 p-3 mb-4">
      <div className="d-flex">
        <div>
          {/* Project Icon */}
          <img
            src={
              project_picture_url ||
              'https://placehold.co/40x40/png?text=No+Image'
            }
            alt="Project icon"
            className="rounded"
            style={{ width: 40, height: 40 }}
          />


          {/* Title & Description */}
          <h5 className="mt-3 mb-1 fw-bold text-capitalize">{title}</h5>
          <p className="text-muted mb-3" >
            {description || 'No description provided.'}
          </p>

          {/* Due Date & Budget */}
          <div className="d-flex gap-4 mb-3">
            <div>
              <small className="text-muted">Due Date</small>
              <div className="fw-semibold">{formattedDate}</div>
            </div>

          </div>

          {/* Admin & Members */}
          <div className="d-flex align-items-center">
            <div className="me-2">
              <img
                src={admin_profile_picture_url||`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  admin_full_name
                )}&background=random`}
                alt={admin_full_name}
                className="rounded-circle"
                width="32"
                height="32"
              />
            </div>
            {members.length > 0 &&
              members.slice(0, 2).map((member, idx) => (
                <div className="me-2" key={idx}>

                  <img
                    src={member.profile_picture_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || `M${idx + 1}`)}&background=random`}
                    alt={member.full_name || `Member ${idx + 1}`}
                    className="rounded-circle"
                    width="32"
                    height="32"
                  />
                </div>
              ))}
            {members.length > 2 && (
              <span className="badge bg-secondary me-2">+{members.length - 2}</span>
            )}


          </div>
        </div>
        {/* <div className="text-center mx-auto"> div to ad a summay with ai (optional)</div> */}
        <div className="d-flex flex-column align-items-end ms-auto">
          {/* Status Badge */}
          <span className={`badge badge-${statusColor} text-capitalize mb-2`}>
            {status}
          </span>


        </div>
      </div>
    </div>
  );
};

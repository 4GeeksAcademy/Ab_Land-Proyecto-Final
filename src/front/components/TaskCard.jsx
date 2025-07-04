import React from 'react'
import { useState, useEffect } from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export const TaskCard = ({ task }) => {
  const { id = '',
    title = '',
    description = '',
    created_at = '',
    status = '',
    author_id = '',
    task_author = '',
    project_id = '',
    project = '',
    comments = [],
    tags = [] } = task;

  const [statusColor, setStatusColor] = useState('');
  const [timeAgo, setTimeAgo] = useState('');

  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();


  const timeSinceCreation = () => {
    const now = new Date();
    const createdDate = new Date(created_at);
    const diff = now - createdDate; // difference in milliseconds
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    if (status === 'in progress') {
      setStatusColor('inProgress');
    } else { setStatusColor(status) }
    setTimeAgo(timeSinceCreation());
  }, [status, created_at]);

  return (
    <div className={`card task-${statusColor} p-3 shadow-sm`} >
      <div className='d-flex align-items-center mb-2'>
        <span className={`badge badge-${statusColor} text-capitalize `}>
          {status}
        </span>
        {tags.length > 0 && (
          <div className="tags ms-2">
            {tags.map(tag => (
              <span key={tag} className="badge bg-secondary text-capitalize me-1">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="ms-auto">
          {store.user_id === author_id && <button className="btn btn-sm btn-outline-secondary" onClick={() => console.log(`Edit task ${id}`)}>
            Edit
          </button>}
        </div>
      </div>


      <h5 className='text-capitalize text-black'>{title}</h5>
      <p>{description}</p>
      <div className="d-flex align-items-center">
        <div className="me-2">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              task_author
            )}&background=random`}
            alt={task_author}
            className="rounded-circle"
            width="32"
            height="32"
          />
        </div>
        <small className='text-muted ms-auto'> {timeAgo}</small>
      </div>
      

    </div>
  )
}

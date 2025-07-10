import React from 'react'
import { useState, useEffect } from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export const TaskCard = ({ task, userRole, onEdit, onUpdate }) => {
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
    tags = [],
    assigned_to = null,
    assigned_to_id = null,
    is_unassigned = true,
    user_relation = null } = task;

  const [statusColor, setStatusColor] = useState('');
  const [timeAgo, setTimeAgo] = useState('');
  const [canEdit, setCanEdit] = useState(false)

  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  const editAble = () => {
    if (userRole === "admin" || store.user.id === author_id) {
      setCanEdit(true)
    }
    else { setCanEdit(false) }
  }

  const timeSinceCreation = () => {
    const now = new Date();
    let createdDate = created_at;
    if (typeof created_at === "string" && !created_at.endsWith("Z")) {
      createdDate = created_at + "Z";
    }
    const created = new Date(createdDate);
    const diff = now - created; // difference in milliseconds
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
    return `${seconds > 1 ? seconds : 1} second${seconds > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    if (status === 'in progress') {
      setStatusColor('inProgress');
    } else { setStatusColor(status) }
    setTimeAgo(timeSinceCreation());
    editAble()
  }, [status, created_at]);

  const deleteTask = () => {        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${project_id}/task/${id}`, {
            method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + store.token,
      }
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          dispatch({ type: "error", payload: data.msg || "There was an error deleting the task" });
          return;
        }
        onUpdate(data); // Callback para actualizar la lista?
        dispatch({type:"success",payload:data.msg|| "Task Deleted"})
      })
      .catch((err) => {
        dispatch({ type: "error", payload: err?.message || "Connection error with the server." });
      });
  }

  return (
    <div className={`card task-${statusColor} p-3 m-1 shadow-sm`} >
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
          {canEdit &&
            <button className="btn btn-sm btn-outline-secondary me-2" onClick={onEdit}>
              Edit
            </button>}
          {canEdit &&
            <button className="btn btn-outline-danger btn-sm"
              onClick={() => { deleteTask() }}>
              <i className="fa-regular fa-trash-can"></i>
            </button>}
        </div>
      </div>


      <h5 className='text-capitalize text-black'>{title}</h5>
      <p>{description}</p>
      <div className="d-flex align-items-center">

        {assigned_to && assigned_to.full_name === task_author ? (
          <div className="d-flex align-items-center me-3">
            <div className="me-2">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  task_author
                )}&background=random`}
                alt={task_author}
                className="rounded-circle"
                width="32"
                height="32"
                title={`Creado y asignado: ${task_author}`}
              />
            </div>
            <small className="text-muted">
              <strong>Creado y asignado:</strong> {task_author}
            </small>
          </div>
        ) : (
          <>

            <div className="d-flex align-items-center me-3">
              <div className="me-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    task_author
                  )}&background=random`}
                  alt={task_author}
                  className="rounded-circle"
                  width="32"
                  height="32"
                  title={`Creado por: ${task_author}`}
                />
              </div>
              <small className="text-muted">
                <strong>Creador:</strong> {task_author}
              </small>
            </div>

            <div className="d-flex align-items-center me-3">
              {assigned_to && assigned_to.full_name ? (
                <>
                  <div className="me-2">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        assigned_to.full_name
                      )}&background=random`}
                      alt={assigned_to.full_name}
                      className="rounded-circle"
                      width="32"
                      height="32"
                      title={`Asignado a: ${assigned_to.full_name}`}
                    />
                  </div>
                  <small className="text-muted">
                    <strong>Asignado a:</strong> {assigned_to.full_name}
                  </small>
                </>
              ) : (
                <small className="text-muted">
                  <strong>Asignado a:</strong> <em>Sin asignar</em>
                </small>
              )}
            </div>
          </>
        )}

        <small className='text-muted ms-auto'> {timeAgo}</small>
      </div>


    </div>
  )
}

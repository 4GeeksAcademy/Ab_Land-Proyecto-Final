import React, { useState, useEffect } from 'react'

export const TaskCardXS = ({ task, onTaskClick }) => {
   
    const [statusColor, setStatusColor] = useState("inProgress")

    useEffect(() => {
        if (task.status === 'in progress') {
            setStatusColor('inProgress');
        } else {
            setStatusColor(task.status);
        }
    }, [task])  

    return (
        <div
            className={`card p-2 d-flex flex-row align-items-center gap-2 cursor-pointer task-${statusColor} mb-1`}
            onClick={() => onTaskClick?.(task)}
            style={{ minWidth: "250px", cursor: "pointer" }}
        >
            <span
                className={`rounded status-${statusColor}`}
                style={{ width: "10px", height: "10px" }}
            ></span>
            <span className="flex-grow-1 text-truncate text-capitalize">{task.title}</span>
            {task.task_author && (
                <div className="rounded-circle bg-light text-dark d-flex justify-content-center align-items-center" style={{ width: "24px", height: "24px", fontSize: "0.75rem", fontWeight: "bold" }}>
                    <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    task.task_author
                  )}&background=random`}
                  alt="author"
                  className="rounded-circle"
                  width="24"
                  height="24"
                  title={`Creado por: ${task.task_author}`}
                />
                </div>
            )}
        </div>
    );
}
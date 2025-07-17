import { useState } from "react";
import React from "react";
import { TaskCardXS } from "./TaskCardXS";

function TimelineView({ tasks, onTaskClick }) {
    const groupedByDay = groupTasksByDate(tasks);


    function groupTasksByDate(tasks) {
        return tasks.reduce((acc, task) => {
            const date = new Date(task.created_at).toISOString().split("T")[0];
            acc[date] = acc[date] || [];
            acc[date].push(task);
            return acc;
        }, {});
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    }



    function getInitials(name) {
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase();
    }

    return (
        <div className="overflow-auto">
            <div className="d-flex flex-row gap-3 px-2 pb-4">
                {Object.entries(groupedByDay)
                    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB)) // Sort by date ascending
                    .map(([date, dayTasks]) => (
                        <div key={date} className="card p-2 "
                            style={{ minHeight: "30vh", minWidth: "340px" }}>
                            <h6 className="text-muted mb-2">{formatDate(date)}</h6>
                            <div className="d-flex flex-column gap-2">
                                {dayTasks.map((task) => (
                                    <TaskCardXS
                                        key={task.id || task.created_at}
                                        task={task}
                                        onTaskClick={onTaskClick}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default TimelineView;

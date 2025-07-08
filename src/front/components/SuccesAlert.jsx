import React from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const SuccessAlert = () => {
  const { store, dispatch } = useGlobalReducer();

  if (!store.success) return null;

  return (
    <div
      className="alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow"
      style={{ zIndex: 9999, minWidth: "350px", maxWidth: "95vw" }}
      role="alert"
    >
      <div
        className="d-flex align-items-center justify-content-between flex-wrap"
        style={{ width: "100%" }}
      >
        <span className="me-3" style={{ wordBreak: "break-word", flex: 1 }}>
          {store.success}
        </span>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={() => dispatch({ type: "success", payload: null })}
        />
      </div>
    </div>
  );
};

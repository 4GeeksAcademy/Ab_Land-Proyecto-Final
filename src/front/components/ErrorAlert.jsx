import React from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export const ErrorAlert = () => {
  const { store, dispatch } = useGlobalReducer();

  if (!store.error) return null;
  if (store.error == "Token has expired"){
    dispatch({type: "LOGOUT"})
    useNavigate("/login")
  }

  return (
    <div
      className="alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow"
      style={{ zIndex: 9999, minWidth: "350px", maxWidth: "95vw" }}
      role="alert"
    >
      <div
        className="d-flex align-items-center justify-content-between flex-wrap"
        style={{ width: "100%" }}
      >
        <span className="me-3" style={{ wordBreak: "break-word", flex: 1 }}>
          {store.error}
        </span>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={() => dispatch({ type: "error", payload: null })}
        />
      </div>
    </div>
  );
};

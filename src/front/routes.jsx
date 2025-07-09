import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate
} from "react-router-dom";

import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import ColorPalettePreview from "./pages/ColorPalettePreview";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { NewProject } from "./pages/NewProject";
import Dashboard from "./pages/Dashboard";
import { RestorePassword } from "./pages/RestorePassword";
import { ProjectFullView } from "./pages/ProjectFullView";
import { Profile } from "./pages/Profile"; 

// Import global reducer/context hook
import useGlobalReducer from "./hooks/useGlobalReducer";

// 🔒 Protects private routes
function PrivateRoute({ children }) {
  const { store } = useGlobalReducer();
  return store.token ? children : <Navigate to="/login" />;
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<NotFound />}>
      {/* Public routes */}
      <Route index element={<Home />} />
      <Route path="/api/cpp" element={<ColorPalettePreview />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/restore-password" element={<RestorePassword />} />
      <Route path="/restore-password/:token" element={<RestorePassword />} />
      

      {/* Private routes */}
      <Route
        path="/dashboard"
        element={<PrivateRoute><Dashboard /></PrivateRoute>}
      />
      <Route 
        path="/newproject"
        element={<PrivateRoute><NewProject /></PrivateRoute>} 
      />
      <Route
        path="/project/:id"
        element={<PrivateRoute><ProjectFullView /></PrivateRoute> }
      />
      <Route
        path="/profile/:id"
        element={<PrivateRoute><Profile/></PrivateRoute>}
      />
    </Route>
  )
);






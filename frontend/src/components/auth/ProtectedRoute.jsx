import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";


function ProtectedRoute({
  allowedRoles = [],
}) {

  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  const location =
    useLocation();


  // ==========================================
  // WAIT UNTIL USER PROFILE IS LOADED
  // ==========================================

  if (loading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );

  }


  // ==========================================
  // USER NOT AUTHENTICATED
  // ==========================================

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );

  }


  // ==========================================
  // USER PROFILE NOT AVAILABLE
  // ==========================================

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // ==========================================
  // ROLE NOT ALLOWED
  // ==========================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {

    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );

  }


  // ==========================================
  // ACCESS GRANTED
  // ==========================================

  return <Outlet />;

}


export default ProtectedRoute;
import {
  Search,
  ChevronDown,
  Menu,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import NotificationBell from "../notifications/NotificationBell";


function Navbar({
  onMenuClick,
}) {

  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();


  // ========================================================
  // DISPLAY NAME
  // ========================================================

  const displayName =
    user?.first_name
      ? `${user.first_name} ${
          user.last_name || ""
        }`.trim()
      : user?.username ||
        "User";


  // ========================================================
  // ROLE LABEL
  // ========================================================

  const roleLabels = {
    ADMIN: "Administrator",
    DOCTOR: "Doctor",
    PATIENT: "Patient",
    RECEPTIONIST:
      "Receptionist",
  };


  const roleLabel =
    roleLabels[user?.role] ||
    "User";


  // ========================================================
  // AVATAR
  // ========================================================

  const avatarLetter =
    user?.first_name
      ?.charAt(0)
      ?.toUpperCase() ||
    user?.username
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  // ========================================================
  // PROFILE NAVIGATION
  // ========================================================

  const handleProfileClick = () => {

    switch (user?.role) {

      case "ADMIN":
        navigate(
          "/admin/settings"
        );
        break;

      case "DOCTOR":
        navigate(
          "/doctor/profile"
        );
        break;

      case "RECEPTIONIST":
        navigate(
          "/receptionist/profile"
        );
        break;

      case "PATIENT":
      default:
        navigate(
          "/patient/profile"
        );
        break;

    }

  };


  return (

    <header className="navbar">

      {/* ====================================================
          LEFT
      ===================================================== */}

      <div className="navbar-left">

        {onMenuClick && (

          <button
            type="button"
            className="navbar-menu-btn"
            onClick={
              onMenuClick
            }
            aria-label="Open sidebar"
          >

            <Menu
              size={21}
            />

          </button>

        )}


        <div className="navbar-search">

          <Search
            size={19}
          />

          <input
            type="text"
            placeholder="Search SmartCare..."
          />

        </div>

      </div>


      {/* ====================================================
          RIGHT
      ===================================================== */}

      <div className="navbar-actions">

        {/* ==================================================
            REAL NOTIFICATION CENTER
        =================================================== */}

        <NotificationBell />


        {/* ==================================================
            USER PROFILE
        =================================================== */}

        <button
          type="button"
          className="user-profile"
          onClick={
            handleProfileClick
          }
        >

          <div className="user-avatar">

            {avatarLetter}

          </div>


          <div className="user-info">

            <h4>
              {displayName}
            </h4>

            <span>
              {roleLabel}
            </span>

          </div>


          <ChevronDown
            size={18}
          />

        </button>

      </div>

    </header>

  );

}


export default Navbar;
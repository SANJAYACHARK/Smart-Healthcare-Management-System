import {
  LayoutDashboard,
  CalendarDays,
  FileHeart,
  Pill,
  TestTube,
  MessageSquare,
  UserRound,
  Settings,
  LogOut,
  X,
  Users,
  Stethoscope,
  UserCog,
  Building2,
  ClipboardList,
  Activity,
  HeartPulse,
  Clock3,
  CreditCard,
  TicketCheck,
  ShieldCheck,
  SlidersHorizontal,
  FileBarChart,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";


function Sidebar({
  isOpen = true,
  onClose,
}) {

  const navigate =
    useNavigate();


  const {
    user,
    logout,
  } = useAuth();


  // ========================================================
  // LOGOUT
  // ========================================================

  const handleLogout =
    () => {

      logout();


      if (onClose) {

        onClose();

      }


      navigate(
        "/login",
        {
          replace: true,
        }
      );

    };


  // ========================================================
  // CLOSE MOBILE SIDEBAR
  // ========================================================

  const handleNavigation =
    () => {

      if (onClose) {

        onClose();

      }

    };


  // ========================================================
  // ADMIN NAVIGATION
  // ========================================================

  const adminNavigation = [

    {
      label:
        "Dashboard",

      path:
        "/admin/dashboard",

      icon:
        LayoutDashboard,
    },

    {
      label:
        "Doctors",

      path:
        "/admin/doctors",

      icon:
        Stethoscope,
    },

    {
      label:
        "Receptionists",

      path:
        "/admin/receptionists",

      icon:
        UserCog,
    },

    {
      label:
        "Patients",

      path:
        "/admin/patients",

      icon:
        Users,
    },

    {
      label:
        "Departments",

      path:
        "/admin/departments",

      icon:
        Building2,
    },

    {
      label:
        "Audit Logs",

      path:
        "/admin/audit-logs",

      icon:
        ShieldCheck,
  SlidersHorizontal,
    },

    {
      label:
        "Reports",

      path:
        "/admin/reports",

      icon:
        FileBarChart,
    },

    {
      label:
        "Profile",

      path:
        "/admin/profile",

      icon:
        UserRound,
    },

    {
      label:
        "Settings",

      path:
        "/admin/settings",

      icon:
        Settings,
    },

  ];


  // ========================================================
  // DOCTOR NAVIGATION
  // ========================================================

  const doctorNavigation = [

    {
      label:
        "Dashboard",

      path:
        "/doctor/dashboard",

      icon:
        LayoutDashboard,
    },

    {
      label:
        "Appointments",

      path:
        "/doctor/appointments",

      icon:
        CalendarDays,
    },


    {
      label:
        "Live Queue",

      path:
        "/doctor/queue",

      icon:
        TicketCheck,
    },

    {
      label:
        "My Patients",

      path:
        "/doctor/patients",

      icon:
        Users,
    },

    {
      label:
        "Medical Records",

      path:
        "/doctor/medical-records",

      icon:
        FileHeart,
    },

    {
      label:
        "Prescriptions",

      path:
        "/doctor/prescriptions",

      icon:
        Pill,
    },

    {
      label:
        "Lab Reports",

      path:
        "/doctor/lab-reports",

      icon:
        TestTube,
    },

    {
      label:
        "Messages",

      path:
        "/doctor/messages",

      icon:
        MessageSquare,
    },

    {
      label:
        "Availability",

      path:
        "/doctor/availability",

      icon:
        Clock3,
    },

    {
      label:
        "Profile",

      path:
        "/doctor/profile",

      icon:
        UserRound,
    },

    {
      label:
        "Settings",

      path:
        "/doctor/settings",

      icon:
        Settings,
    },

  ];


  // ========================================================
  // PATIENT NAVIGATION
  // ========================================================

  const patientNavigation = [

    {
      label:
        "Dashboard",

      path:
        "/patient/dashboard",

      icon:
        LayoutDashboard,
    },

    {
      label:
        "Appointments",

      path:
        "/patient/appointments",

      icon:
        CalendarDays,
    },


    {
      label:
        "My Queue",

      path:
        "/patient/queue",

      icon:
        TicketCheck,
    },

    {
      label:
        "Medical Records",

      path:
        "/patient/medical-records",

      icon:
        FileHeart,
    },

    {
      label:
        "Prescriptions",

      path:
        "/patient/prescriptions",

      icon:
        Pill,
    },

    {
      label:
        "Lab Reports",

      path:
        "/patient/lab-reports",

      icon:
        TestTube,
    },

    {
      label:
        "Billing",

      path:
        "/patient/billing",

      icon:
        CreditCard,
    },

    {
      label:
        "Messages",

      path:
        "/patient/messages",

      icon:
        MessageSquare,
    },

    {
      label:
        "Feedback",

      path:
        "/patient/feedback",

      icon:
        ClipboardList,
    },

    {
      label:
        "Profile",

      path:
        "/patient/profile",

      icon:
        UserRound,
    },

    {
      label:
        "Settings",

      path:
        "/patient/settings",

      icon:
        Settings,
    },

  ];


  // ========================================================
  // RECEPTIONIST NAVIGATION
  // ========================================================

  const receptionistNavigation = [

    {
      label:
        "Dashboard",

      path:
        "/receptionist/dashboard",

      icon:
        LayoutDashboard,
    },

    {
      label:
        "Appointments",

      path:
        "/receptionist/appointments",

      icon:
        CalendarDays,
    },


    {
      label:
        "Live Queue",

      path:
        "/receptionist/queue",

      icon:
        TicketCheck,
    },

    {
      label:
        "Patients",

      path:
        "/receptionist/patients",

      icon:
        Users,
    },

    {
      label:
        "Medical Files",

      path:
        "/receptionist/medical-files",

      icon:
        FileHeart,
    },

    {
      label:
        "Doctors",

      path:
        "/receptionist/doctors",

      icon:
        Stethoscope,
    },

    {
      label:
        "Doctor Status",

      path:
        "/receptionist/doctor-status",

      icon:
        Activity,
    },

    {
      label:
        "Laboratory",

      path:
        "/receptionist/laboratory",

      icon:
        TestTube,
    },

    {
      label:
        "Billing",

      path:
        "/receptionist/billing",

      icon:
        CreditCard,
    },

    {
      label:
        "Patient Feedback",

      path:
        "/receptionist/feedback",

      icon:
        ClipboardList,
    },

    {
      label:
        "Profile",

      path:
        "/receptionist/profile",

      icon:
        UserRound,
    },

    {
      label:
        "Settings",

      path:
        "/receptionist/settings",

      icon:
        Settings,
    },

  ];


  // ========================================================
  // SELECT NAVIGATION BASED ON ROLE
  // ========================================================

  let navigationItems =
    patientNavigation;


  let roleLabel =
    "Patient";


  switch (
    user?.role
  ) {

    case "ADMIN":

      navigationItems =
        adminNavigation;


      roleLabel =
        "Administrator";


      break;


    case "DOCTOR":

      navigationItems =
        doctorNavigation;


      roleLabel =
        "Doctor";


      break;


    case "RECEPTIONIST":

      navigationItems =
        receptionistNavigation;


      roleLabel =
        "Receptionist";


      break;


    case "PATIENT":

    default:

      navigationItems =
        patientNavigation;


      roleLabel =
        "Patient";


      break;

  }


  // ========================================================
  // USER DISPLAY
  // ========================================================

  const displayName =
    user?.first_name
      ? `${user.first_name} ${
          user.last_name ||
          ""
        }`.trim()
      : user?.username ||
        "User";


  const avatarLetter =
    user?.first_name
      ?.charAt(
        0
      )
      ?.toUpperCase() ||
    user?.username
      ?.charAt(
        0
      )
      ?.toUpperCase() ||
    "U";


  // ========================================================
  // RENDER
  // ========================================================

  return (

    <aside
      className={
        `sidebar ${
          isOpen
            ? "sidebar-open"
            : "sidebar-closed"
        }`
      }
    >


      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="sidebar-header">

        <div className="sidebar-brand">

          <div className="sidebar-logo">

            <HeartPulse
              size={22}
            />

          </div>


          <div className="sidebar-brand-text">

            <span className="sidebar-brand-name">
              SmartCare
            </span>


            <span className="sidebar-brand-subtitle">
              Healthcare
            </span>

          </div>

        </div>


        {
          onClose && (

            <button
              type="button"
              className="sidebar-close"
              onClick={
                onClose
              }
              aria-label="Close sidebar"
            >

              <X
                size={20}
              />

            </button>

          )
        }

      </div>


      {/* ====================================================
          USER
      ===================================================== */}

      <div className="sidebar-user">

        <div className="sidebar-avatar">

          {
            avatarLetter
          }

        </div>


        <div className="sidebar-user-info">

          <strong>

            {
              displayName
            }

          </strong>


          <span>

            {
              roleLabel
            }

          </span>

        </div>

      </div>


      {/* ====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="sidebar-nav">

        <div className="sidebar-section-title">
          MAIN MENU
        </div>


        {
          navigationItems.map(
            (
              item
            ) => {

              const Icon =
                item.icon;


              return (

                <NavLink
                  key={
                    item.path
                  }
                  to={
                    item.path
                  }
                  onClick={
                    handleNavigation
                  }
                  className={({
                    isActive,
                  }) =>
                    `nav-item ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                >

                  <Icon
                    size={19}
                    strokeWidth={2}
                  />


                  <span>

                    {
                      item.label
                    }

                  </span>

                </NavLink>

              );

            }
          )
        }

      </nav>


      {/* ====================================================
          FOOTER
      ===================================================== */}

      <div className="sidebar-footer">

        <button
          type="button"
          className="nav-item logout-btn"
          onClick={
            handleLogout
          }
        >

          <LogOut
            size={19}
            strokeWidth={2}
          />


          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>

  );

}


export default Sidebar;

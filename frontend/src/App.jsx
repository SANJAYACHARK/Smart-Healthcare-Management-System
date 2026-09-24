import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import ProtectedRoute
  from "./components/auth/ProtectedRoute";


// =========================================================
// SHARED PAGES
// =========================================================

import Profile
  from "./pages/shared/Profile";

import Settings
  from "./pages/shared/Settings";


// =========================================================
// AUTH PAGES
// =========================================================

import Login
  from "./pages/auth/Login";

import Register
  from "./pages/auth/Register";


// =========================================================
// PATIENT PAGES
// =========================================================

import PatientDashboard
  from "./pages/patient/PatientDashboard";

import PatientAppointments
  from "./pages/patient/Appointments";

import PatientMedicalRecords
  from "./pages/patient/MedicalRecords";

import PatientPrescriptions
  from "./pages/patient/Prescriptions";

import PatientLabReports
  from "./pages/patient/LabReports";

import PatientBilling
  from "./pages/patient/Billing";

import PatientFeedback
  from "./pages/patient/Feedback";

import PatientMessages
  from "./pages/patient/Messages";

import PatientQueue
  from "./pages/patient/PatientQueue";


// =========================================================
// ADMIN PAGES
// =========================================================

import AdminDashboard
  from "./pages/admin/AdminDashboard";

import Doctors
  from "./pages/admin/Doctors";

import Receptionists
  from "./pages/admin/Receptionists";

import Patients
  from "./pages/admin/Patients";

import Departments
  from "./pages/admin/Departments";

import AuditLogs
  from "./pages/admin/AuditLogs";

import SystemSettings
  from "./pages/admin/SystemSettings";

import Reports
  from "./pages/admin/Reports";


// =========================================================
// DOCTOR PAGES
// =========================================================

import DoctorDashboard
  from "./pages/doctor/DoctorDashboard";

import DoctorAppointments
  from "./pages/doctor/Appointments";

import Consultation
  from "./pages/doctor/Consultation";

import MyPatients
  from "./pages/doctor/MyPatients";

import PatientDetails
  from "./pages/doctor/PatientDetails";

import DoctorMedicalRecords
  from "./pages/doctor/MedicalRecords";

import DoctorPrescriptions
  from "./pages/doctor/Prescriptions";

import DoctorLabReports
  from "./pages/doctor/LabReports";

import DoctorMessages
  from "./pages/doctor/DoctorMessages";

import DoctorAvailability
  from "./pages/doctor/DoctorAvailability";

import DoctorQueue
  from "./pages/doctor/DoctorQueue";


// =========================================================
// RECEPTIONIST PAGES
// =========================================================

import ReceptionistDashboard
  from "./pages/receptionist/ReceptionistDashboard";

import ReceptionistAppointments
  from "./pages/receptionist/ReceptionistAppointments";

import ReceptionistPatients
  from "./pages/receptionist/ReceptionistPatients";

import ReceptionistDoctors
  from "./pages/receptionist/ReceptionistDoctors";

import DoctorStatus
  from "./pages/receptionist/DoctorStatus";

import Laboratory
  from "./pages/receptionist/Laboratory";

import ReceptionistBilling
  from "./pages/receptionist/Billing";

import ReceptionistFeedback
  from "./pages/receptionist/ReceptionistFeedback";

import ReceptionistQueue
  from "./pages/receptionist/ReceptionistQueue";


import ReceptionistMedicalFiles
  from "./pages/receptionist/ReceptionistMedicalFiles";

// =========================================================
// UNAUTHORIZED PAGE
// =========================================================

function Unauthorized() {

  return (

    <div className="loading-screen">

      You are not authorized to access this page.

    </div>

  );

}


// =========================================================
// APP
// =========================================================

function App() {

  return (

    <BrowserRouter>

      <AuthProvider>

        <Routes>


          {/* =================================================
              PUBLIC ROUTES
          ================================================= */}

          <Route
            path="/login"
            element={
              <Login />
            }
          />


          <Route
            path="/register"
            element={
              <Register />
            }
          />


          <Route
            path="/unauthorized"
            element={
              <Unauthorized />
            }
          />


          {/* =================================================
              PATIENT ROUTES
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "PATIENT",
                ]}
              />
            }
          >

            <Route
              path="/patient/dashboard"
              element={
                <PatientDashboard />
              }
            />


            <Route
              path="/patient/appointments"
              element={
                <PatientAppointments />
              }
            />


            <Route
              path="/patient/queue"
              element={
                <PatientQueue />
              }
            />


            <Route
              path="/patient/medical-records"
              element={
                <PatientMedicalRecords />
              }
            />


            <Route
              path="/patient/prescriptions"
              element={
                <PatientPrescriptions />
              }
            />


            <Route
              path="/patient/lab-reports"
              element={
                <PatientLabReports />
              }
            />


            <Route
              path="/patient/billing"
              element={
                <PatientBilling />
              }
            />


            <Route
              path="/patient/messages"
              element={
                <PatientMessages />
              }
            />


            <Route
              path="/patient/feedback"
              element={
                <PatientFeedback />
              }
            />


            <Route
              path="/patient/profile"
              element={
                <Profile />
              }
            />


            <Route
              path="/patient/settings"
              element={
                <Settings />
              }
            />

          </Route>


          {/* =================================================
              ADMIN ROUTES
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                ]}
              />
            }
          >

            <Route
              path="/admin/dashboard"
              element={
                <AdminDashboard />
              }
            />


            <Route
              path="/admin/doctors"
              element={
                <Doctors />
              }
            />


            <Route
              path="/admin/receptionists"
              element={
                <Receptionists />
              }
            />


            <Route
              path="/admin/patients"
              element={
                <Patients />
              }
            />


            <Route
              path="/admin/departments"
              element={
                <Departments />
              }
            />


            <Route
              path="/admin/audit-logs"
              element={
                <AuditLogs />
              }
            />


            <Route
              path="/admin/system-settings"
              element={
                <SystemSettings />
              }
            />


            <Route
              path="/admin/reports"
              element={
                <Reports />
              }
            />


            <Route
              path="/admin/profile"
              element={
                <Profile />
              }
            />


            <Route
              path="/admin/settings"
              element={
                <Settings />
              }
            />

          </Route>


          {/* =================================================
              DOCTOR ROUTES
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "DOCTOR",
                ]}
              />
            }
          >

            <Route
              path="/doctor/dashboard"
              element={
                <DoctorDashboard />
              }
            />


            <Route
              path="/doctor/appointments"
              element={
                <DoctorAppointments />
              }
            />


            <Route
              path="/doctor/queue"
              element={
                <DoctorQueue />
              }
            />


            <Route
              path="/doctor/consultation/:appointmentId"
              element={
                <Consultation />
              }
            />


            <Route
              path="/doctor/patients"
              element={
                <MyPatients />
              }
            />


            <Route
              path="/doctor/patients/:patientId"
              element={
                <PatientDetails />
              }
            />


            <Route
              path="/doctor/medical-records"
              element={
                <DoctorMedicalRecords />
              }
            />


            <Route
              path="/doctor/prescriptions"
              element={
                <DoctorPrescriptions />
              }
            />


            <Route
              path="/doctor/lab-reports"
              element={
                <DoctorLabReports />
              }
            />


            <Route
              path="/doctor/messages"
              element={
                <DoctorMessages />
              }
            />


            <Route
              path="/doctor/availability"
              element={
                <DoctorAvailability />
              }
            />


            <Route
              path="/doctor/profile"
              element={
                <Profile />
              }
            />


            <Route
              path="/doctor/settings"
              element={
                <Settings />
              }
            />

          </Route>


          {/* =================================================
              RECEPTIONIST ROUTES
          ================================================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "RECEPTIONIST",
                ]}
              />
            }
          >

            <Route
              path="/receptionist/dashboard"
              element={
                <ReceptionistDashboard />
              }
            />


            <Route
              path="/receptionist/appointments"
              element={
                <ReceptionistAppointments />
              }
            />


            <Route
              path="/receptionist/queue"
              element={
                <ReceptionistQueue />
              }
            />


            <Route
              path="/receptionist/patients"
              element={
                <ReceptionistPatients />
              }
            />


            <Route
              path="/receptionist/doctors"
              element={
                <ReceptionistDoctors />
              }
            />


            <Route
              path="/receptionist/medical-files"
              element={
                <ReceptionistMedicalFiles />
              }
            />


            <Route
              path="/receptionist/doctor-status"
              element={
                <DoctorStatus />
              }
            />


            <Route
              path="/receptionist/laboratory"
              element={
                <Laboratory />
              }
            />


            <Route
              path="/receptionist/billing"
              element={
                <ReceptionistBilling />
              }
            />


            <Route
              path="/receptionist/feedback"
              element={
                <ReceptionistFeedback />
              }
            />


            <Route
              path="/receptionist/profile"
              element={
                <Profile />
              }
            />


            <Route
              path="/receptionist/settings"
              element={
                <Settings />
              }
            />

          </Route>


          {/* =================================================
              DEFAULT ROUTES
          ================================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


        </Routes>

      </AuthProvider>

    </BrowserRouter>

  );

}


export default App;

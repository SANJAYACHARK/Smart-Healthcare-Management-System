import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileHeart,
  FlaskConical,
  Loader2,
  MessageSquare,
  Pill,
  Play,
  RefreshCw,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function DoctorDashboard() {

  const navigate =
    useNavigate();


  // =========================================================
  // STATE
  // =========================================================

  const [
    appointments,
    setAppointments,
  ] = useState([]);


  const [
    patients,
    setPatients,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    startingConsultation,
    setStartingConsultation,
  ] = useState(null);


  // =========================================================
  // HELPERS
  // =========================================================

  const getResults =
    (
      response
    ) => {

      const data =
        response?.data;


      if (
        Array.isArray(data)
      ) {

        return data;

      }


      if (
        Array.isArray(
          data?.results
        )
      ) {

        return data.results;

      }


      return [];

    };


  const getTodayString =
    () => {

      const today =
        new Date();


      const year =
        today.getFullYear();


      const month =
        String(
          today.getMonth() + 1
        ).padStart(
          2,
          "0"
        );


      const day =
        String(
          today.getDate()
        ).padStart(
          2,
          "0"
        );


      return (
        `${year}-${month}-${day}`
      );

    };


  const formatTime =
    (
      time
    ) => {

      if (!time) {

        return "-";

      }


      const [
        hours,
        minutes,
      ] = time.split(":");


      const date =
        new Date();


      date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
      );


      return date
        .toLocaleTimeString(
          "en-IN",
          {
            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        );

    };


  const formatDate =
    (
      date
    ) => {

      if (!date) {

        return "-";

      }


      const parsedDate =
        new Date(
          `${date}T00:00:00`
        );


      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        return date;

      }


      return parsedDate
        .toLocaleDateString(
          "en-IN",
          {
            day:
              "2-digit",

            month:
              "short",

            year:
              "numeric",
          }
        );

    };


  const formatStatus =
    (
      status
    ) => {

      if (!status) {

        return "-";

      }


      return status
        .replaceAll(
          "_",
          " "
        )
        .toLowerCase()
        .replace(
          /\b\w/g,
          (
            letter
          ) =>
            letter.toUpperCase()
        );

    };


  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard =
    async (
      showRefreshing = false
    ) => {

      try {

        if (showRefreshing) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        setError("");


        const [
          appointmentResponse,
          patientResponse,
        ] = await Promise.all([

          api.get(
            "/appointments/doctor/"
          ),

          api.get(
            "/medical-records/doctor/patients/"
          ),

        ]);


        setAppointments(
          getResults(
            appointmentResponse
          )
        );


        setPatients(
          getResults(
            patientResponse
          )
        );

      } catch (err) {

        console.error(
          "Doctor dashboard error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load doctor dashboard."
        );

      } finally {

        setLoading(
          false
        );

        setRefreshing(
          false
        );

      }

    };


  useEffect(() => {

    loadDashboard();

  }, []);


  // =========================================================
  // TODAY
  // =========================================================

  const today =
    getTodayString();


  const todayAppointments =
    useMemo(
      () => {

        return appointments
          .filter(
            (
              appointment
            ) =>
              appointment
                .appointment_date ===
              today
          )
          .sort(
            (
              first,
              second
            ) => {

              return String(
                first.appointment_time ||
                ""
              )
                .localeCompare(
                  String(
                    second.appointment_time ||
                    ""
                  )
                );

            }
          );

      },
      [
        appointments,
        today,
      ]
    );


  // =========================================================
  // UPCOMING
  // =========================================================

  const upcomingAppointments =
    useMemo(
      () => {

        return appointments
          .filter(
            (
              appointment
            ) => {

              if (
                appointment.status ===
                "CANCELLED"
              ) {

                return false;

              }


              if (
                appointment.status ===
                "COMPLETED"
              ) {

                return false;

              }


              return (
                appointment
                  .appointment_date >=
                today
              );

            }
          )
          .sort(
            (
              first,
              second
            ) => {

              const firstDate =
                `${first.appointment_date || ""}T${first.appointment_time || "00:00"}`;


              const secondDate =
                `${second.appointment_date || ""}T${second.appointment_time || "00:00"}`;


              return firstDate
                .localeCompare(
                  secondDate
                );

            }
          );

      },
      [
        appointments,
        today,
      ]
    );


  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const completedToday =
    useMemo(
      () => {

        return todayAppointments
          .filter(
            (
              appointment
            ) =>
              appointment.status ===
              "COMPLETED"
          )
          .length;

      },
      [
        todayAppointments,
      ]
    );


  const patientsToday =
    useMemo(
      () => {

        const ids =
          new Set();


        todayAppointments
          .forEach(
            (
              appointment
            ) => {

              const id =
                appointment.patient_id ||
                appointment.patient;


              if (id) {

                ids.add(
                  String(
                    id
                  )
                );

              }

            }
          );


        return ids.size;

      },
      [
        todayAppointments,
      ]
    );


  const waitingPatients =
    useMemo(
      () => {

        return todayAppointments
          .filter(
            (
              appointment
            ) =>
              appointment.status ===
              "CHECKED_IN"
          )
          .length;

      },
      [
        todayAppointments,
      ]
    );


  const confirmedToday =
    useMemo(
      () => {

        return todayAppointments
          .filter(
            (
              appointment
            ) =>
              appointment.status ===
              "CONFIRMED"
          )
          .length;

      },
      [
        todayAppointments,
      ]
    );


  const currentConsultation =
    useMemo(
      () => {

        return (
          todayAppointments.find(
            (
              appointment
            ) =>
              appointment.status ===
              "IN_CONSULTATION"
          ) ||
          null
        );

      },
      [
        todayAppointments,
      ]
    );


  const totalCompletedAppointments =
    useMemo(
      () => {

        return appointments
          .filter(
            (
              appointment
            ) =>
              appointment.status ===
              "COMPLETED"
          )
          .length;

      },
      [
        appointments,
      ]
    );


  // =========================================================
  // START CONSULTATION
  // =========================================================

  const startConsultation =
    async (
      appointment
    ) => {

      if (
        !appointment?.id
      ) {

        return;

      }


      if (
        appointment.status !==
        "CHECKED_IN"
      ) {

        setError(
          "Only checked-in patients can start a consultation."
        );

        return;

      }


      try {

        setStartingConsultation(
          appointment.id
        );


        setError("");


        await api.patch(
          `/appointments/doctor/${appointment.id}/status/`,
          {
            status:
              "IN_CONSULTATION",
          }
        );


        navigate(
          `/doctor/consultation/${appointment.id}`
        );

      } catch (err) {

        console.error(
          "Start consultation error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to start consultation."
        );

      } finally {

        setStartingConsultation(
          null
        );

      }

    };


  // =========================================================
  // APPOINTMENT ACTION
  // =========================================================

  const renderAppointmentAction =
    (
      appointment
    ) => {

      switch (
        appointment.status
      ) {

        case "CHECKED_IN":

          return (

            <button
              type="button"
              className="doctor-action-btn primary"
              disabled={
                startingConsultation ===
                appointment.id
              }
              onClick={
                () =>
                  startConsultation(
                    appointment
                  )
              }
            >

              {
                startingConsultation ===
                appointment.id ? (

                  <Loader2
                    size={14}
                    className="spin"
                  />

                ) : (

                  <Play
                    size={14}
                  />

                )
              }


              {
                startingConsultation ===
                appointment.id
                  ? "Starting..."
                  : "Start"
              }

            </button>

          );


        case "IN_CONSULTATION":

          return (

            <button
              type="button"
              className="doctor-action-btn primary"
              onClick={
                () =>
                  navigate(
                    `/doctor/consultation/${appointment.id}`
                  )
              }
            >

              <Stethoscope
                size={14}
              />

              Continue

            </button>

          );


        case "COMPLETED":

          return (

            <button
              type="button"
              className="doctor-action-btn"
              onClick={
                () =>
                  navigate(
                    `/doctor/patients/${
                      appointment.patient_id ||
                      appointment.patient
                    }`
                  )
              }
            >

              Patient History

              <ChevronRight
                size={14}
              />

            </button>

          );


        default:

          return (

            <button
              type="button"
              className="doctor-action-btn"
              onClick={
                () =>
                  navigate(
                    "/doctor/appointments"
                  )
              }
            >

              View

              <ChevronRight
                size={14}
              />

            </button>

          );

      }

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <Layout>

        <div className="loading-screen">

          <Loader2
            size={24}
            className="spin"
          />

          Loading doctor dashboard...

        </div>

      </Layout>

    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <Layout>

      <div className="doctor-dashboard">


        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="doctor-dashboard-header">

          <div className="doctor-dashboard-heading">

            <p className="page-eyebrow">
              DOCTOR
            </p>


            <h1>
              Doctor Dashboard
            </h1>


            <p>

              Review today's appointments,
              monitor the clinical queue and
              access your patient care tools.

            </p>

          </div>


          <div className="doctor-dashboard-actions">

            <button
              type="button"
              className="doctor-action-btn"
              disabled={
                refreshing
              }
              onClick={
                () =>
                  loadDashboard(
                    true
                  )
              }
            >

              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              {
                refreshing
                  ? "Refreshing..."
                  : "Refresh"
              }

            </button>


            <button
              type="button"
              className="doctor-action-btn primary"
              onClick={
                () =>
                  navigate(
                    "/doctor/appointments"
                  )
              }
            >

              <CalendarDays
                size={15}
              />

              Appointments

            </button>

          </div>

        </div>


        {/* ====================================================
            ERROR
        ===================================================== */}

        {
          error && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        {/* ====================================================
            CURRENT CONSULTATION
        ===================================================== */}

        {
          currentConsultation && (

            <div className="doctor-current-consultation">

              <div className="doctor-current-label">

                <Stethoscope
                  size={14}
                />

                Consultation in Progress

              </div>


              <div className="doctor-current-patient-info">

                <div className="doctor-current-avatar">

                  <UserRound
                    size={20}
                  />

                </div>


                <div>

                  <strong>

                    {
                      currentConsultation
                        .patient_name ||
                      "Patient"
                    }

                  </strong>


                  <span>

                    {
                      currentConsultation
                        .reason ||
                      "General consultation"
                    }

                  </span>

                </div>


                <button
                  type="button"
                  className="doctor-action-btn primary"
                  style={{
                    marginLeft:
                      "auto",
                  }}
                  onClick={
                    () =>
                      navigate(
                        `/doctor/consultation/${currentConsultation.id}`
                      )
                  }
                >

                  Continue

                  <ChevronRight
                    size={14}
                  />

                </button>

              </div>

            </div>

          )
        }


        {/* ====================================================
            MAIN KPI CARDS
        ===================================================== */}

        <div className="doctor-stats-grid">


          <div className="doctor-stat-card">

            <div className="doctor-stat-top">

              <div className="doctor-stat-icon">

                <CalendarDays
                  size={21}
                />

              </div>

            </div>


            <p className="doctor-stat-label">

              Today's Appointments

            </p>


            <h2 className="doctor-stat-value">

              {
                todayAppointments.length
              }

            </h2>


            <p className="doctor-stat-description">

              Scheduled for today

            </p>

          </div>


          <div className="doctor-stat-card">

            <div className="doctor-stat-top">

              <div className="doctor-stat-icon">

                <Users
                  size={21}
                />

              </div>

            </div>


            <p className="doctor-stat-label">

              Total Patients

            </p>


            <h2 className="doctor-stat-value">

              {
                patients.length
              }

            </h2>


            <p className="doctor-stat-description">

              Patients under your care

            </p>

          </div>


          <div className="doctor-stat-card">

            <div className="doctor-stat-top">

              <div className="doctor-stat-icon">

                <Clock3
                  size={21}
                />

              </div>

            </div>


            <p className="doctor-stat-label">

              Waiting

            </p>


            <h2 className="doctor-stat-value">

              {
                waitingPatients
              }

            </h2>


            <p className="doctor-stat-description">

              Checked-in patients

            </p>

          </div>


          <div className="doctor-stat-card">

            <div className="doctor-stat-top">

              <div className="doctor-stat-icon">

                <CheckCircle2
                  size={21}
                />

              </div>

            </div>


            <p className="doctor-stat-label">

              Completed Today

            </p>


            <h2 className="doctor-stat-value">

              {
                completedToday
              }

            </h2>


            <p className="doctor-stat-description">

              Finished consultations

            </p>

          </div>

        </div>


        {/* ====================================================
            SECONDARY SUMMARY
        ===================================================== */}

        <div className="doctor-dashboard-summary-grid">

          <button
            type="button"
            className="doctor-summary-card"
            onClick={
              () =>
                navigate(
                  "/doctor/appointments"
                )
            }
          >

            <Clock3
              size={19}
            />

            <div>

              <strong>
                {
                  upcomingAppointments.length
                }
              </strong>

              <span>
                Upcoming Appointments
              </span>

            </div>

          </button>


          <button
            type="button"
            className="doctor-summary-card"
            onClick={
              () =>
                navigate(
                  "/doctor/patients"
                )
            }
          >

            <Users
              size={19}
            />

            <div>

              <strong>
                {
                  patientsToday
                }
              </strong>

              <span>
                Patients Today
              </span>

            </div>

          </button>


          <button
            type="button"
            className="doctor-summary-card"
            onClick={
              () =>
                navigate(
                  "/doctor/appointments"
                )
            }
          >

            <CalendarDays
              size={19}
            />

            <div>

              <strong>
                {
                  confirmedToday
                }
              </strong>

              <span>
                Confirmed Today
              </span>

            </div>

          </button>


          <button
            type="button"
            className="doctor-summary-card"
            onClick={
              () =>
                navigate(
                  "/doctor/medical-records"
                )
            }
          >

            <FileHeart
              size={19}
            />

            <div>

              <strong>
                {
                  totalCompletedAppointments
                }
              </strong>

              <span>
                Completed Visits
              </span>

            </div>

          </button>

        </div>


        {/* ====================================================
            DASHBOARD GRID
        ===================================================== */}

        <div className="doctor-dashboard-grid">


          {/* ==================================================
              TODAY'S SCHEDULE
          =================================================== */}

          <div className="doctor-dashboard-card">

            <div className="doctor-dashboard-card-header">

              <div className="doctor-dashboard-card-title">

                <div className="doctor-dashboard-card-title-icon">

                  <CalendarDays
                    size={18}
                  />

                </div>


                <div>

                  <h3>
                    Today's Schedule
                  </h3>


                  <p>

                    {
                      todayAppointments.length
                    }

                    {" "}

                    appointment(s) scheduled.

                  </p>

                </div>

              </div>


              <button
                type="button"
                className="view-all-btn"
                onClick={
                  () =>
                    navigate(
                      "/doctor/appointments"
                    )
                }
              >

                View all

                <ChevronRight
                  size={14}
                />

              </button>

            </div>


            {
              todayAppointments.length ===
              0 ? (

                <div className="doctor-empty-state">

                  <div className="doctor-empty-state-icon">

                    <CalendarDays
                      size={23}
                    />

                  </div>


                  <strong>

                    No appointments today

                  </strong>


                  <p>

                    Today's scheduled appointments
                    will appear here.

                  </p>

                </div>

              ) : (

                <div className="doctor-appointments-list">

                  {
                    todayAppointments.map(
                      (
                        appointment
                      ) => (

                        <div
                          className="doctor-appointment-item"
                          key={
                            appointment.id
                          }
                        >

                          <div className="doctor-appointment-time">

                            <strong>

                              {
                                formatTime(
                                  appointment
                                    .appointment_time
                                )
                              }

                            </strong>

                          </div>


                          <div className="doctor-patient-info">

                            <div className="doctor-patient-name">

                              <UserRound
                                size={15}
                              />


                              <strong>

                                {
                                  appointment
                                    .patient_name ||
                                  "Patient"
                                }

                              </strong>

                            </div>


                            <p>

                              {
                                appointment
                                  .reason ||
                                "General consultation"
                              }

                            </p>


                            <div className="doctor-patient-meta">

                              <span>

                                <CalendarDays
                                  size={12}
                                />

                                {
                                  formatDate(
                                    appointment
                                      .appointment_date
                                  )
                                }

                              </span>


                              <span>

                                <Clock3
                                  size={12}
                                />

                                {
                                  formatTime(
                                    appointment
                                      .appointment_time
                                  )
                                }

                              </span>

                            </div>

                          </div>


                          <div className="doctor-appointment-actions">

                            <span
                              className={
                                `status-badge appointment-status-${
                                  appointment.status
                                    ?.toLowerCase()
                                }`
                              }
                            >

                              {
                                formatStatus(
                                  appointment.status
                                )
                              }

                            </span>


                            {
                              renderAppointmentAction(
                                appointment
                              )
                            }

                          </div>

                        </div>

                      )
                    )
                  }

                </div>

              )
            }

          </div>


          {/* ==================================================
              RIGHT COLUMN
          =================================================== */}

          <div>


            {/* ================================================
                TODAY OVERVIEW
            ================================================= */}

            <div className="doctor-dashboard-card">

              <div className="doctor-dashboard-card-header">

                <div className="doctor-dashboard-card-title">

                  <div className="doctor-dashboard-card-title-icon">

                    <Stethoscope
                      size={18}
                    />

                  </div>


                  <div>

                    <h3>
                      Today's Overview
                    </h3>


                    <p>
                      Current clinical queue.
                    </p>

                  </div>

                </div>

              </div>


              <div className="doctor-schedule-list">


                <div className="doctor-schedule-item">

                  <div className="doctor-schedule-day">

                    <div className="doctor-schedule-icon">

                      <CalendarDays
                        size={16}
                      />

                    </div>


                    <div>

                      <strong>
                        Confirmed
                      </strong>

                      <span>
                        Awaiting check-in
                      </span>

                    </div>

                  </div>


                  <strong className="doctor-schedule-time">

                    {
                      confirmedToday
                    }

                  </strong>

                </div>


                <div className="doctor-schedule-item">

                  <div className="doctor-schedule-day">

                    <div className="doctor-schedule-icon">

                      <Users
                        size={16}
                      />

                    </div>


                    <div>

                      <strong>
                        Waiting
                      </strong>

                      <span>
                        Checked-in patients
                      </span>

                    </div>

                  </div>


                  <strong className="doctor-schedule-time">

                    {
                      waitingPatients
                    }

                  </strong>

                </div>


                <div className="doctor-schedule-item">

                  <div className="doctor-schedule-day">

                    <div className="doctor-schedule-icon">

                      <Stethoscope
                        size={16}
                      />

                    </div>


                    <div>

                      <strong>
                        In Consultation
                      </strong>

                      <span>
                        Active consultation
                      </span>

                    </div>

                  </div>


                  <strong className="doctor-schedule-time">

                    {
                      currentConsultation
                        ? 1
                        : 0
                    }

                  </strong>

                </div>


                <div className="doctor-schedule-item">

                  <div className="doctor-schedule-day">

                    <div className="doctor-schedule-icon">

                      <CheckCircle2
                        size={16}
                      />

                    </div>


                    <div>

                      <strong>
                        Completed
                      </strong>

                      <span>
                        Finished today
                      </span>

                    </div>

                  </div>


                  <strong className="doctor-schedule-time">

                    {
                      completedToday
                    }

                  </strong>

                </div>

              </div>

            </div>


            {/* ================================================
                QUICK ACTIONS
            ================================================= */}

            <div
              className="doctor-dashboard-card"
              style={{
                marginTop:
                  "22px",
              }}
            >

              <div className="doctor-dashboard-card-header">

                <div className="doctor-dashboard-card-title">

                  <div className="doctor-dashboard-card-title-icon">

                    <Stethoscope
                      size={18}
                    />

                  </div>


                  <div>

                    <h3>
                      Quick Actions
                    </h3>


                    <p>
                      Clinical tools and records.
                    </p>

                  </div>

                </div>

              </div>


              <div className="doctor-quick-actions">


                <button
                  type="button"
                  className="doctor-quick-action"
                  onClick={
                    () =>
                      navigate(
                        "/doctor/patients"
                      )
                  }
                >

                  <div className="doctor-quick-action-icon">

                    <Users
                      size={18}
                    />

                  </div>


                  <strong>
                    My Patients
                  </strong>


                  <span>
                    View patient profiles
                  </span>

                </button>


                <button
                  type="button"
                  className="doctor-quick-action"
                  onClick={
                    () =>
                      navigate(
                        "/doctor/medical-records"
                      )
                  }
                >

                  <div className="doctor-quick-action-icon">

                    <FileHeart
                      size={18}
                    />

                  </div>


                  <strong>
                    Medical Records
                  </strong>


                  <span>
                    Clinical history
                  </span>

                </button>


                <button
                  type="button"
                  className="doctor-quick-action"
                  onClick={
                    () =>
                      navigate(
                        "/doctor/prescriptions"
                      )
                  }
                >

                  <div className="doctor-quick-action-icon">

                    <Pill
                      size={18}
                    />

                  </div>


                  <strong>
                    Prescriptions
                  </strong>


                  <span>
                    Patient medications
                  </span>

                </button>


                <button
                  type="button"
                  className="doctor-quick-action"
                  onClick={
                    () =>
                      navigate(
                        "/doctor/lab-reports"
                      )
                  }
                >

                  <div className="doctor-quick-action-icon">

                    <FlaskConical
                      size={18}
                    />

                  </div>


                  <strong>
                    Laboratory
                  </strong>


                  <span>
                    Tests and reports
                  </span>

                </button>


                <button
                  type="button"
                  className="doctor-quick-action"
                  onClick={
                    () =>
                      navigate(
                        "/doctor/availability"
                      )
                  }
                >

                  <div className="doctor-quick-action-icon">

                    <Clock3
                      size={18}
                    />

                  </div>


                  <strong>
                    Availability
                  </strong>


                  <span>
                    Manage schedule
                  </span>

                </button>


                <button
                  type="button"
                  className="doctor-quick-action"
                  onClick={
                    () =>
                      navigate(
                        "/doctor/messages"
                      )
                  }
                >

                  <div className="doctor-quick-action-icon">

                    <MessageSquare
                      size={18}
                    />

                  </div>


                  <strong>
                    Messages
                  </strong>


                  <span>
                    Patient conversations
                  </span>

                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </Layout>

  );

}


export default DoctorDashboard;

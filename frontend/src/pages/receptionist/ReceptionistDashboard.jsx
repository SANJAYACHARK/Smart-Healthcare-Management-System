import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FlaskConical,
  Loader2,
  RefreshCw,
  Stethoscope,
  UserCheck,
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


function ReceptionistDashboard() {

  const navigate =
    useNavigate();


  const [
    appointments,
    setAppointments,
  ] = useState([]);


  const [
    patients,
    setPatients,
  ] = useState([]);


  const [
    doctors,
    setDoctors,
  ] = useState([]);


  const [
    doctorStatus,
    setDoctorStatus,
  ] = useState([]);


  const [
    labRequests,
    setLabRequests,
  ] = useState([]);


  const [
    bills,
    setBills,
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
    actionLoading,
    setActionLoading,
  ] = useState(null);


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


  const formatDate =
    (
      date
    ) => {

      if (!date) {

        return "-";

      }


      const value =
        new Date(
          `${date}T00:00:00`
        );


      if (
        Number.isNaN(
          value.getTime()
        )
      ) {

        return date;

      }


      return value
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


  const formatTime =
    (
      time
    ) => {

      if (!time) {

        return "-";

      }


      const [
        hour,
        minute,
      ] = String(
        time
      ).split(":");


      const value =
        new Date();


      value.setHours(
        Number(hour),
        Number(minute),
        0,
        0
      );


      return value
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


  const formatStatus =
    (
      status
    ) => {

      if (!status) {

        return "-";

      }


      return String(
        status
      )
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


  const loadDashboard =
    async (
      showRefresh = false
    ) => {

      try {

        if (showRefresh) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        setError("");


        const results =
          await Promise.allSettled([

            api.get(
              "/appointments/receptionist/"
            ),

            api.get(
              "/accounts/receptionist/patients/"
            ),

            api.get(
              "/accounts/receptionist/doctors/"
            ),

            api.get(
              "/appointments/receptionist/doctor-status/"
            ),

            api.get(
              "/laboratory/receptionist/"
            ),

            api.get(
              "/billing/receptionist/"
            ),

          ]);


        const [
          appointmentResult,
          patientResult,
          doctorResult,
          doctorStatusResult,
          labResult,
          billResult,
        ] = results;


        if (
          appointmentResult.status ===
          "fulfilled"
        ) {

          setAppointments(
            getResults(
              appointmentResult.value
            )
          );

        }


        if (
          patientResult.status ===
          "fulfilled"
        ) {

          setPatients(
            getResults(
              patientResult.value
            )
          );

        }


        if (
          doctorResult.status ===
          "fulfilled"
        ) {

          setDoctors(
            getResults(
              doctorResult.value
            )
          );

        }


        if (
          doctorStatusResult.status ===
          "fulfilled"
        ) {

          setDoctorStatus(
            getResults(
              doctorStatusResult.value
            )
          );

        }


        if (
          labResult.status ===
          "fulfilled"
        ) {

          setLabRequests(
            getResults(
              labResult.value
            )
          );

        }


        if (
          billResult.status ===
          "fulfilled"
        ) {

          setBills(
            getResults(
              billResult.value
            )
          );

        }


        const failedCount =
          results.filter(
            (
              result
            ) =>
              result.status ===
              "rejected"
          ).length;


        if (
          failedCount > 0
        ) {

          setError(
            `${failedCount} dashboard section${
              failedCount > 1
                ? "s"
                : ""
            } could not be loaded. Other available data is shown below.`
          );

        }

      } catch (err) {

        console.error(
          "Receptionist dashboard error:",
          err
        );


        setError(
          "Unable to load receptionist dashboard."
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
            ) =>
              String(
                first.appointment_time ||
                ""
              ).localeCompare(
                String(
                  second.appointment_time ||
                  ""
                )
              )
          );

      },
      [
        appointments,
        today,
      ]
    );


  const pendingToday =
    useMemo(
      () =>
        todayAppointments.filter(
          (
            appointment
          ) =>
            appointment.status ===
            "PENDING"
        ).length,
      [
        todayAppointments,
      ]
    );


  const confirmedToday =
    useMemo(
      () =>
        todayAppointments.filter(
          (
            appointment
          ) =>
            appointment.status ===
            "CONFIRMED"
        ).length,
      [
        todayAppointments,
      ]
    );


  const checkedInToday =
    useMemo(
      () =>
        todayAppointments.filter(
          (
            appointment
          ) =>
            appointment.status ===
            "CHECKED_IN"
        ).length,
      [
        todayAppointments,
      ]
    );


  const inConsultationToday =
    useMemo(
      () =>
        todayAppointments.filter(
          (
            appointment
          ) =>
            appointment.status ===
            "IN_CONSULTATION"
        ).length,
      [
        todayAppointments,
      ]
    );


  const completedToday =
    useMemo(
      () =>
        todayAppointments.filter(
          (
            appointment
          ) =>
            appointment.status ===
            "COMPLETED"
        ).length,
      [
        todayAppointments,
      ]
    );


  const activePatients =
    useMemo(
      () =>
        patients.filter(
          (
            patient
          ) =>
            patient.is_active !==
            false
        ).length,
      [
        patients,
      ]
    );


  const availableDoctors =
    useMemo(
      () => {

        if (
          doctorStatus.length > 0
        ) {

          return doctorStatus.filter(
            (
              doctor
            ) =>
              doctor.status ===
              "AVAILABLE"
          ).length;

        }


        return doctors.filter(
          (
            doctor
          ) =>
            doctor.is_active &&
            doctor.is_available
        ).length;

      },
      [
        doctors,
        doctorStatus,
      ]
    );


  const pendingLabRequests =
    useMemo(
      () =>
        labRequests.filter(
          (
            item
          ) =>
            [
              "REQUESTED",
              "PROCESSING",
            ].includes(
              item.status
            )
        ).length,
      [
        labRequests,
      ]
    );


  const unpaidBills =
    useMemo(
      () =>
        bills.filter(
          (
            bill
          ) =>
            bill.payment_status !==
            "PAID"
        ).length,
      [
        bills,
      ]
    );


  const updateAppointmentStatus =
    async (
      appointment,
      status
    ) => {

      try {

        setActionLoading(
          `${appointment.id}-${status}`
        );


        setError("");


        await api.patch(
          `/appointments/receptionist/${appointment.id}/status/`,
          {
            status,
          }
        );


        await loadDashboard();

      } catch (err) {

        console.error(
          "Receptionist dashboard appointment action error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to update appointment."
        );

      } finally {

        setActionLoading(
          null
        );

      }

    };


  const renderAppointmentAction =
    (
      appointment
    ) => {

      if (
        appointment.status ===
        "PENDING"
      ) {

        return (

          <span className="waiting-label">

            <Clock3
              size={14}
            />

            Awaiting Doctor

          </span>

        );

      }


      if (
        appointment.status ===
        "CONFIRMED"
      ) {

        const key =
          `${appointment.id}-CHECKED_IN`;


        return (

          <button
            type="button"
            className="btn-small"
            disabled={
              actionLoading ===
              key
            }
            onClick={
              () =>
                updateAppointmentStatus(
                  appointment,
                  "CHECKED_IN"
                )
            }
          >

            {
              actionLoading ===
              key ? (

                <Loader2
                  size={14}
                  className="spin"
                />

              ) : (

                <UserCheck
                  size={14}
                />

              )
            }

            Check In

          </button>

        );

      }


      if (
        appointment.status ===
        "CHECKED_IN"
      ) {

        return (

          <span className="waiting-label">

            <Clock3
              size={14}
            />

            Waiting

          </span>

        );

      }


      if (
        appointment.status ===
        "IN_CONSULTATION"
      ) {

        return (

          <span className="consulting-label">

            Consulting

          </span>

        );

      }


      return (

        <span className="table-secondary">

          {
            formatStatus(
              appointment.status
            )
          }

        </span>

      );

    };


  if (loading) {

    return (

      <Layout>

        <div className="loading-screen">

          <Loader2
            size={24}
            className="spin"
          />

          Loading receptionist dashboard...

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      <div className="receptionist-dashboard page-content">


        <div className="receptionist-dashboard-header">

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST
            </p>


            <h1>
              Receptionist Dashboard
            </h1>


            <p>

              Manage front-desk operations,
              appointments, patient check-ins,
              doctors, laboratory work and billing.

            </p>

          </div>


          <div className="receptionist-dashboard-actions">

            <button
              type="button"
              className="btn-secondary"
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
                size={16}
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
              className="btn-primary"
              onClick={
                () =>
                  navigate(
                    "/receptionist/appointments"
                  )
              }
            >

              <CalendarDays
                size={16}
              />

              Appointments

            </button>

          </div>

        </div>


        {
          error && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        <div className="receptionist-kpi-grid">


          <button
            type="button"
            className="receptionist-kpi-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/appointments"
                )
            }
          >

            <div className="receptionist-kpi-icon">

              <CalendarDays
                size={21}
              />

            </div>


            <div>

              <span>
                Today's Appointments
              </span>

              <strong>

                {
                  todayAppointments.length
                }

              </strong>

              <small>
                Scheduled today
              </small>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-kpi-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/patients"
                )
            }
          >

            <div className="receptionist-kpi-icon">

              <Users
                size={21}
              />

            </div>


            <div>

              <span>
                Registered Patients
              </span>

              <strong>

                {
                  activePatients
                }

              </strong>

              <small>
                Active patient accounts
              </small>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-kpi-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/doctor-status"
                )
            }
          >

            <div className="receptionist-kpi-icon">

              <Stethoscope
                size={21}
              />

            </div>


            <div>

              <span>
                Available Doctors
              </span>

              <strong>

                {
                  availableDoctors
                }

              </strong>

              <small>
                Ready for patients
              </small>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-kpi-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/laboratory"
                )
            }
          >

            <div className="receptionist-kpi-icon">

              <FlaskConical
                size={21}
              />

            </div>


            <div>

              <span>
                Pending Lab Work
              </span>

              <strong>

                {
                  pendingLabRequests
                }

              </strong>

              <small>
                Requested / processing
              </small>

            </div>

          </button>


        </div>


        <div className="receptionist-summary-grid">


          <button
            type="button"
            className="receptionist-summary-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/appointments"
                )
            }
          >

            <Clock3
              size={18}
            />

            <div>

              <strong>
                {
                  pendingToday
                }
              </strong>

              <span>
                Pending
              </span>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-summary-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/appointments"
                )
            }
          >

            <CheckCircle2
              size={18}
            />

            <div>

              <strong>
                {
                  confirmedToday
                }
              </strong>

              <span>
                Confirmed
              </span>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-summary-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/appointments"
                )
            }
          >

            <UserCheck
              size={18}
            />

            <div>

              <strong>
                {
                  checkedInToday
                }
              </strong>

              <span>
                Waiting
              </span>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-summary-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/doctor-status"
                )
            }
          >

            <Activity
              size={18}
            />

            <div>

              <strong>
                {
                  inConsultationToday
                }
              </strong>

              <span>
                Consulting
              </span>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-summary-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/appointments"
                )
            }
          >

            <CheckCircle2
              size={18}
            />

            <div>

              <strong>
                {
                  completedToday
                }
              </strong>

              <span>
                Completed
              </span>

            </div>

          </button>


          <button
            type="button"
            className="receptionist-summary-card"
            onClick={
              () =>
                navigate(
                  "/receptionist/billing"
                )
            }
          >

            <CreditCard
              size={18}
            />

            <div>

              <strong>
                {
                  unpaidBills
                }
              </strong>

              <span>
                Unpaid Bills
              </span>

            </div>

          </button>


        </div>


        <div className="receptionist-dashboard-grid">


          <section className="card receptionist-schedule-card">

            <div className="card-header">

              <div>

                <h3>

                  <CalendarDays
                    size={18}
                  />

                  Today's Appointments

                </h3>


                <p>

                  Confirm appointments,
                  check in arriving patients
                  and monitor consultation flow.

                </p>

              </div>


              <button
                type="button"
                className="view-all-btn"
                onClick={
                  () =>
                    navigate(
                      "/receptionist/appointments"
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

                <div className="empty-state">

                  <CalendarDays
                    size={30}
                  />

                  <h3>
                    No appointments today
                  </h3>

                  <p>

                    Today's appointments
                    will appear here.

                  </p>

                </div>

              ) : (

                <div className="receptionist-appointment-list">

                  {
                    todayAppointments
                      .slice(
                        0,
                        8
                      )
                      .map(
                        (
                          appointment
                        ) => (

                          <div
                            className="receptionist-appointment-item"
                            key={
                              appointment.id
                            }
                          >

                            <div className="receptionist-appointment-time">

                              <Clock3
                                size={14}
                              />

                              <strong>

                                {
                                  formatTime(
                                    appointment
                                      .appointment_time
                                  )
                                }

                              </strong>

                            </div>


                            <div className="receptionist-appointment-patient">

                              <div className="table-user">

                                <div className="table-avatar">

                                  <UserRound
                                    size={17}
                                  />

                                </div>


                                <div>

                                  <strong>

                                    {
                                      appointment
                                        .patient_name ||
                                      "Patient"
                                    }

                                  </strong>


                                  <span>

                                    {
                                      appointment
                                        .reason ||
                                      "Consultation"
                                    }

                                  </span>

                                </div>

                              </div>

                            </div>


                            <div className="receptionist-appointment-doctor">

                              <Stethoscope
                                size={14}
                              />

                              Dr. {
                                appointment
                                  .doctor_name ||
                                "-"
                              }

                            </div>


                            <div className="receptionist-appointment-status">

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

                            </div>


                            <div className="receptionist-appointment-action">

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

          </section>


          <div className="receptionist-dashboard-side">


            <section className="card">

              <div className="card-header">

                <div>

                  <h3>

                    <Stethoscope
                      size={18}
                    />

                    Doctor Status

                  </h3>

                  <p>
                    Live consultation queue.
                  </p>

                </div>


                <button
                  type="button"
                  className="view-all-btn"
                  onClick={
                    () =>
                      navigate(
                        "/receptionist/doctor-status"
                      )
                  }
                >

                  View

                  <ChevronRight
                    size={14}
                  />

                </button>

              </div>


              <div className="receptionist-doctor-status-list">

                {
                  doctorStatus.length ===
                  0 ? (

                    <div className="empty-state compact">

                      No doctor status data.

                    </div>

                  ) : (

                    doctorStatus
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          doctor
                        ) => (

                          <div
                            className="receptionist-doctor-status-item"
                            key={
                              doctor.id
                            }
                          >

                            <div>

                              <strong>

                                Dr. {
                                  doctor.name
                                }

                              </strong>

                              <span>

                                {
                                  doctor.department ||
                                  doctor.specialization ||
                                  "General"
                                }

                              </span>

                            </div>


                            <span
                              className={
                                doctor.status ===
                                "AVAILABLE"
                                  ? "status-badge status-active"
                                  : doctor.status ===
                                    "BUSY"
                                  ? "status-badge appointment-status-in_consultation"
                                  : "status-badge status-inactive"
                              }
                            >

                              {
                                formatStatus(
                                  doctor.status
                                )
                              }

                            </span>

                          </div>

                        )
                      )

                  )
                }

              </div>

            </section>


            <section className="card receptionist-quick-card">

              <div className="card-header">

                <div>

                  <h3>
                    Quick Actions
                  </h3>

                  <p>
                    Front-desk shortcuts.
                  </p>

                </div>

              </div>


              <div className="receptionist-quick-grid">


                <button
                  type="button"
                  onClick={
                    () =>
                      navigate(
                        "/receptionist/patients"
                      )
                  }
                >

                  <Users
                    size={18}
                  />

                  <span>
                    Patients
                  </span>

                </button>


                <button
                  type="button"
                  onClick={
                    () =>
                      navigate(
                        "/receptionist/doctors"
                      )
                  }
                >

                  <Stethoscope
                    size={18}
                  />

                  <span>
                    Doctors
                  </span>

                </button>


                <button
                  type="button"
                  onClick={
                    () =>
                      navigate(
                        "/receptionist/laboratory"
                      )
                  }
                >

                  <FlaskConical
                    size={18}
                  />

                  <span>
                    Laboratory
                  </span>

                </button>


                <button
                  type="button"
                  onClick={
                    () =>
                      navigate(
                        "/receptionist/billing"
                      )
                  }
                >

                  <CreditCard
                    size={18}
                  />

                  <span>
                    Billing
                  </span>

                </button>


              </div>

            </section>


          </div>

        </div>

      </div>

    </Layout>

  );

}


export default ReceptionistDashboard;

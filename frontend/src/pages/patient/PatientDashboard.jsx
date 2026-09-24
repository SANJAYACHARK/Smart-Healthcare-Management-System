import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileHeart,
  Loader2,
  Pill,
  RefreshCw,
  Stethoscope,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import Layout
  from "../../components/layout/Layout";

import KpiCard
  from "../../components/dashboard/KpiCard";

import api
  from "../../api/axios";

import {
  useAuth,
} from "../../context/AuthContext";


function PatientDashboard() {

  const navigate =
    useNavigate();


  const {
    user,
  } = useAuth();


  const [
    appointments,
    setAppointments,
  ] = useState([]);


  const [
    medicalRecords,
    setMedicalRecords,
  ] = useState([]);


  const [
    prescriptions,
    setPrescriptions,
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


  const getResults = (
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


  const getErrorMessage = (
    err,
    fallback
  ) => {

    const data =
      err?.response?.data;


    if (
      typeof data?.detail ===
      "string"
    ) {

      return data.detail;

    }


    if (
      typeof data?.message ===
      "string"
    ) {

      return data.message;

    }


    return fallback;

  };


  const getLocalDateString =
    (
      date = new Date()
    ) => {

      const year =
        date.getFullYear();


      const month =
        String(
          date.getMonth() + 1
        ).padStart(
          2,
          "0"
        );


      const day =
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        );


      return `${year}-${month}-${day}`;

    };


  const loadDashboard =
    async (
      showRefresh = false
    ) => {

      try {

        if (
          showRefresh
        ) {

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
              "/appointments/my/"
            ),

            api.get(
              "/medical-records/patient/"
            ),

            api.get(
              "/medical-records/patient/prescriptions/"
            ),
          ]);


        const [
          appointmentResult,
          medicalRecordResult,
          prescriptionResult,
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

        } else {

          setAppointments([]);

        }


        if (
          medicalRecordResult.status ===
          "fulfilled"
        ) {

          setMedicalRecords(
            getResults(
              medicalRecordResult.value
            )
          );

        } else {

          setMedicalRecords([]);

        }


        if (
          prescriptionResult.status ===
          "fulfilled"
        ) {

          setPrescriptions(
            getResults(
              prescriptionResult.value
            )
          );

        } else {

          setPrescriptions([]);

        }


        const failed =
          results.filter(
            (
              result
            ) =>
              result.status ===
              "rejected"
          );


        if (
          failed.length > 0
        ) {

          const firstFailure =
            failed[0];


          setError(
            getErrorMessage(
              firstFailure.reason,
              failed.length ===
              results.length
                ? "Unable to load your dashboard."
                : "Some dashboard information could not be loaded."
            )
          );

        }

      } catch (err) {

        console.error(
          "Patient dashboard error:",
          err
        );


        setError(
          getErrorMessage(
            err,
            "Unable to load your dashboard."
          )
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
    getLocalDateString();


  const upcomingAppointments =
    useMemo(
      () => {

        const validStatuses =
          new Set([
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
            "IN_CONSULTATION",
          ]);


        return appointments
          .filter(
            (
              appointment
            ) => {

              const date =
                appointment
                  .appointment_date;


              return (
                date &&
                date >= today &&
                validStatuses.has(
                  appointment.status
                )
              );

            }
          )
          .sort(
            (
              first,
              second
            ) => {

              const firstDate =
                `${first.appointment_date || ""}T${first.appointment_time || "00:00:00"}`;


              const secondDate =
                `${second.appointment_date || ""}T${second.appointment_time || "00:00:00"}`;


              return (
                firstDate.localeCompare(
                  secondDate
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


  const uniqueDoctors =
    useMemo(
      () => {

        const doctors =
          new Set();


        appointments.forEach(
          (
            appointment
          ) => {

            const doctorId =
              appointment.doctor ??
              appointment.doctor_id;


            const doctorName =
              appointment.doctor_name;


            if (
              doctorId !==
              undefined &&
              doctorId !==
              null
            ) {

              doctors.add(
                `id:${doctorId}`
              );

            } else if (
              doctorName
            ) {

              doctors.add(
                `name:${doctorName}`
              );

            }

          }
        );


        return doctors.size;

      },
      [
        appointments,
      ]
    );


  const patientName =
    useMemo(
      () => {

        const firstName =
          user?.first_name
            ?.trim();


        if (
          firstName
        ) {

          return firstName;

        }


        const fullName =
          `${user?.first_name || ""} ${
            user?.last_name || ""
          }`.trim();


        if (
          fullName
        ) {

          return fullName;

        }


        return (
          user?.username ||
          "Patient"
        );

      },
      [
        user,
      ]
    );


  const getGreeting =
    () => {

      const hour =
        new Date()
          .getHours();


      if (
        hour < 12
      ) {

        return "Good Morning";

      }


      if (
        hour < 17
      ) {

        return "Good Afternoon";

      }


      return "Good Evening";

    };


  const formatDateParts = (
    value
  ) => {

    if (
      !value
    ) {

      return {
        day: "--",
        month: "---",
      };

    }


    const date =
      new Date(
        `${value}T00:00:00`
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return {
        day: "--",
        month: "---",
      };

    }


    return {
      day:
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        ),

      month:
        date
          .toLocaleDateString(
            "en-IN",
            {
              month:
                "short",
            }
          )
          .toUpperCase(),
    };

  };


  const formatTime = (
    value
  ) => {

    if (
      !value
    ) {

      return "-";

    }


    const [
      hours,
      minutes,
    ] =
      String(value)
        .split(":");


    const date =
      new Date();


    date.setHours(
      Number(hours),
      Number(minutes || 0),
      0,
      0
    );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date.toLocaleTimeString(
      "en-IN",
      {
        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );

  };


  const formatStatus = (
    value
  ) => {

    if (
      !value
    ) {

      return "-";

    }


    return String(value)
      .toLowerCase()
      .split("_")
      .map(
        (
          word
        ) =>
          word.charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");

  };


  const getSpecialization = (
    appointment
  ) => {

    return (
      appointment
        .doctor_specialization ||
      appointment
        .specialization ||
      appointment
        .doctor?.specialization ||
      "Doctor"
    );

  };


  const nextAppointment =
    upcomingAppointments[0] ||
    null;


  if (
    loading
  ) {

    return (

      <Layout>

        <div className="page-content">

          <div className="loading-screen patient-dashboard-loading">

            <Loader2
              size={28}
              className="spin"
            />

            <p>
              Loading your dashboard...
            </p>

          </div>

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      <div className="page-content patient-dashboard-page">


        <section className="patient-dashboard-header">

          <div className="patient-dashboard-header-content">

            <p className="page-eyebrow">
              PATIENT PORTAL
            </p>


            <h1>

              {getGreeting()}, {patientName} 👋

            </h1>


            <p className="page-description">

              Stay updated with your
              appointments, medical records
              and prescriptions.

            </p>


            {
              nextAppointment && (

                <div className="patient-next-appointment-note">

                  <CalendarCheck
                    size={16}
                  />

                  <span>

                    Next appointment:

                    {" "}

                    <strong>

                      Dr. {
                        nextAppointment
                          .doctor_name ||
                        "Doctor"
                      }

                    </strong>

                    {" · "}

                    {
                      nextAppointment
                        .appointment_date
                    }

                    {" · "}

                    {
                      formatTime(
                        nextAppointment
                          .appointment_time
                      )
                    }

                  </span>

                </div>

              )
            }

          </div>


          <div className="patient-dashboard-header-actions">

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
                size={17}
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
                    "/patient/appointments"
                  )
              }
            >

              <CalendarCheck
                size={18}
              />

              Book Appointment

            </button>

          </div>

        </section>


        {
          error && (

            <div className="error-message">
              {error}
            </div>

          )
        }


        <section className="dashboard-grid patient-dashboard-kpis">


          <KpiCard
            title="Upcoming Appointments"
            value={
              String(
                upcomingAppointments.length
              )
            }
            icon={
              CalendarCheck
            }
            description={
              nextAppointment
                ? "Your scheduled consultations"
                : "No upcoming appointments"
            }
          />


          <KpiCard
            title="My Doctors"
            value={
              String(
                uniqueDoctors
              )
            }
            icon={
              Stethoscope
            }
            description="Doctors connected through your appointments"
          />


          <KpiCard
            title="Medical Records"
            value={
              String(
                medicalRecords.length
              )
            }
            icon={
              FileHeart
            }
            description="Consultation records available"
          />


          <KpiCard
            title="Prescriptions"
            value={
              String(
                prescriptions.length
              )
            }
            icon={
              Pill
            }
            description="Prescriptions available in your account"
          />


        </section>


        <section className="card patient-dashboard-appointments">


          <div className="section-header">

            <div>

              <p className="page-eyebrow">
                SCHEDULE
              </p>


              <h2>
                Upcoming Appointments
              </h2>


              <p>
                Your next scheduled
                consultations.
              </p>

            </div>


            <button
              type="button"
              className="view-all-btn"
              onClick={
                () =>
                  navigate(
                    "/patient/appointments"
                  )
              }
            >

              View All

              <ArrowRight
                size={18}
              />

            </button>

          </div>


          {
            upcomingAppointments.length ===
            0 ? (

              <div className="patient-dashboard-empty">

                <CalendarDays
                  size={38}
                />


                <h3>
                  No upcoming appointments
                </h3>


                <p>

                  When you book an
                  appointment, it will appear
                  here.

                </p>


                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    () =>
                      navigate(
                        "/patient/appointments"
                      )
                  }
                >

                  <CalendarCheck
                    size={17}
                  />

                  Book Appointment

                </button>

              </div>

            ) : (

              <div className="patient-dashboard-appointment-list">

                {
                  upcomingAppointments
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (
                        appointment
                      ) => {

                        const date =
                          formatDateParts(
                            appointment
                              .appointment_date
                          );


                        return (

                          <article
                            className="patient-dashboard-appointment-card"
                            key={
                              appointment.id
                            }
                          >

                            <div className="patient-dashboard-appointment-date">

                              <strong>
                                {date.day}
                              </strong>

                              <span>
                                {date.month}
                              </span>

                            </div>


                            <div className="patient-dashboard-appointment-main">

                              <div className="patient-dashboard-doctor-icon">

                                <Stethoscope
                                  size={19}
                                />

                              </div>


                              <div>

                                <h3>

                                  Dr. {
                                    appointment
                                      .doctor_name ||
                                    "Doctor"
                                  }

                                </h3>


                                <p>

                                  {
                                    getSpecialization(
                                      appointment
                                    )
                                  }

                                </p>


                                <span>

                                  <Clock3
                                    size={14}
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


                            <div className="patient-dashboard-appointment-meta">

                              <span
                                className={`status-badge appointment-status-${String(
                                  appointment.status ||
                                  ""
                                ).toLowerCase()}`}
                              >

                                {
                                  formatStatus(
                                    appointment.status
                                  )
                                }

                              </span>


                              {
                                appointment.reason && (

                                  <small>

                                    {
                                      appointment.reason
                                    }

                                  </small>

                                )
                              }

                            </div>

                          </article>

                        );

                      }
                    )
                }

              </div>

            )
          }

        </section>


        <section className="patient-dashboard-shortcuts">


          <button
            type="button"
            className="patient-dashboard-shortcut"
            onClick={
              () =>
                navigate(
                  "/patient/medical-records"
                )
            }
          >

            <FileHeart
              size={21}
            />

            <div>

              <strong>
                Medical Records
              </strong>

              <span>
                Review consultation history
              </span>

            </div>

            <ArrowRight
              size={17}
            />

          </button>


          <button
            type="button"
            className="patient-dashboard-shortcut"
            onClick={
              () =>
                navigate(
                  "/patient/prescriptions"
                )
            }
          >

            <Pill
              size={21}
            />

            <div>

              <strong>
                Prescriptions
              </strong>

              <span>
                View medicines and instructions
              </span>

            </div>

            <ArrowRight
              size={17}
            />

          </button>


        </section>


      </div>

    </Layout>

  );

}


export default PatientDashboard;

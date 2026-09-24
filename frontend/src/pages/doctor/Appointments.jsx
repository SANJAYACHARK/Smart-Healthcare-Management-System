import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function Appointments() {

  const navigate =
    useNavigate();


  const [
    appointments,
    setAppointments,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(null);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    error,
    setError,
  ] = useState("");


  /* ========================================================
     LOAD APPOINTMENTS
  ======================================================== */

  const loadAppointments =
    async () => {

      try {

        setLoading(true);
        setError("");


        const response =
          await api.get(
            "/appointments/doctor/"
          );


        const data =
          response.data?.results ||
          response.data ||
          [];


        setAppointments(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          "Doctor appointments error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load appointments."
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    loadAppointments();

  }, []);


  /* ========================================================
     ACCEPT / REJECT APPOINTMENT
  ======================================================== */

  const updatePendingAppointment =
    async (
      appointment,
      nextStatus
    ) => {

      if (
        appointment.status !==
        "PENDING"
      ) {

        setError(
          "Only pending appointments can be accepted or rejected."
        );

        return;

      }


      const actionText =
        nextStatus ===
        "CONFIRMED"
          ? "accept"
          : "reject";


      if (
        nextStatus ===
        "CANCELLED" &&
        !window.confirm(
          "Reject this appointment request?"
        )
      ) {

        return;

      }


      try {

        setActionLoading(
          appointment.id
        );

        setError("");


        await api.patch(
          `/appointments/doctor/${appointment.id}/status/`,
          {
            status:
              nextStatus,
          }
        );


        await loadAppointments();

      } catch (err) {

        console.error(
          `Unable to ${actionText} appointment:`,
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          `Unable to ${actionText} appointment.`
        );

      } finally {

        setActionLoading(
          null
        );

      }

    };


  /* ========================================================
     START CONSULTATION
  ======================================================== */

  const startConsultation =
    async (
      appointment
    ) => {

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

        setActionLoading(
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

        setActionLoading(
          null
        );

      }

    };


  /* ========================================================
     OPEN ACTIVE CONSULTATION
  ======================================================== */

  const continueConsultation =
    (
      appointment
    ) => {

      navigate(
        `/doctor/consultation/${appointment.id}`
      );

    };


  /* ========================================================
     FILTER
  ======================================================== */

  const filteredAppointments =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return appointments.filter(
          (
            appointment
          ) => {

            const patientName =
              (
                appointment
                  .patient_name ||
                ""
              ).toLowerCase();


            const reason =
              (
                appointment
                  .reason ||
                ""
              ).toLowerCase();


            const matchesSearch =
              !query ||
              patientName.includes(
                query
              ) ||
              reason.includes(
                query
              );


            const matchesStatus =
              statusFilter ===
              "ALL" ||
              appointment.status ===
              statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        appointments,
        search,
        statusFilter,
      ]
    );


  /* ========================================================
     HELPERS
  ======================================================== */

  const formatDate =
    (
      date
    ) => {

      if (!date) {

        return "-";

      }


      return new Date(
        `${date}T00:00:00`
      ).toLocaleDateString(
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
      ] = time.split(":");


      const date =
        new Date();


      date.setHours(
        Number(hour),
        Number(minute),
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
            letter
              .toUpperCase()
        );

    };


  /* ========================================================
     UI
  ======================================================== */

  return (

    <Layout>

      <div className="page-content">


        {/* HEADER */}

        <div className="page-header">

          <div className="page-header-actions">

            <div>

              <p className="page-eyebrow">
                DOCTOR
              </p>


              <h1>
                Appointments
              </h1>


              <p className="page-description">

                View patient appointments,
                start consultations and
                track consultation status.

              </p>

            </div>


            <button
              type="button"
              className="btn-secondary"
              onClick={
                loadAppointments
              }
              disabled={
                loading
              }
            >

              <RefreshCw
                size={16}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />

              Refresh

            </button>

          </div>

        </div>


        {/* ERROR */}

        {
          error && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        {/* FILTERS */}

        <div className="appointment-filter-grid">

          <div className="search-box">

            <Search
              size={16}
            />


            <input
              type="text"
              value={search}
              placeholder="Search patient or reason..."
              onChange={
                (
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
              }
            />

          </div>


          <div className="appointment-filter">

            <Stethoscope
              size={16}
            />


            <select
              value={
                statusFilter
              }
              onChange={
                (
                  event
                ) =>
                  setStatusFilter(
                    event
                      .target
                      .value
                  )
              }
            >

              <option value="ALL">
                All Status
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="CONFIRMED">
                Confirmed
              </option>

              <option value="CHECKED_IN">
                Checked In
              </option>

              <option value="IN_CONSULTATION">
                In Consultation
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>

            </select>

          </div>

        </div>


        {/* LOADING */}

        {
          loading ? (

            <div className="loading-screen">

              <Loader2
                size={24}
                className="spin"
              />

              Loading appointments...

            </div>

          ) : filteredAppointments.length ===
            0 ? (

            <div className="empty-state">

              <CalendarDays
                size={31}
              />

              <h3>
                No appointments found
              </h3>


              <p>

                Appointments matching
                your current search and
                status filter will
                appear here.

              </p>

            </div>

          ) : (

            <div className="card">

              <div className="table-responsive">

                <table className="data-table">

                  <thead>

                    <tr>

                      <th>
                        Patient
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Time
                      </th>

                      <th>
                        Reason
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      filteredAppointments
                        .map(
                          (
                            appointment
                          ) => (

                            <tr
                              key={
                                appointment.id
                              }
                            >

                              {/* PATIENT */}

                              <td>

                                <div className="table-user">

                                  <div className="table-avatar">

                                    <UserRound
                                      size={18}
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

                                      Appointment
                                      #
                                      {
                                        appointment.id
                                      }

                                    </span>

                                  </div>

                                </div>

                              </td>


                              {/* DATE */}

                              <td>

                                <div className="table-secondary">

                                  <CalendarDays
                                    size={14}
                                  />

                                  {
                                    formatDate(
                                      appointment
                                        .appointment_date
                                    )
                                  }

                                </div>

                              </td>


                              {/* TIME */}

                              <td>

                                <div className="table-secondary">

                                  <Clock3
                                    size={14}
                                  />

                                  {
                                    formatTime(
                                      appointment
                                        .appointment_time
                                    )
                                  }

                                </div>

                              </td>


                              {/* REASON */}

                              <td>

                                {
                                  appointment.reason ||
                                  "-"
                                }

                              </td>


                              {/* STATUS */}

                              <td>

                                <span
                                  className={
                                    `status-badge appointment-status-${
                                      appointment
                                        .status
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

                              </td>


                              {/* ACTION */}

                              <td>

                                <div className="table-actions">


                                  {/* PENDING - DOCTOR DECISION */}

                                  {
                                    appointment.status ===
                                    "PENDING" && (

                                      <>

                                        <button
                                          type="button"
                                          className="btn-small"
                                          disabled={
                                            actionLoading ===
                                            appointment.id
                                          }
                                          onClick={
                                            () =>
                                              updatePendingAppointment(
                                                appointment,
                                                "CONFIRMED"
                                              )
                                          }
                                        >

                                          {
                                            actionLoading ===
                                            appointment.id
                                              ? (

                                                <Loader2
                                                  size={14}
                                                  className="spin"
                                                />

                                              )
                                              : (

                                                <CheckCircle2
                                                  size={14}
                                                />

                                              )
                                          }

                                          Accept

                                        </button>


                                        <button
                                          type="button"
                                          className="btn-small btn-secondary"
                                          disabled={
                                            actionLoading ===
                                            appointment.id
                                          }
                                          onClick={
                                            () =>
                                              updatePendingAppointment(
                                                appointment,
                                                "CANCELLED"
                                              )
                                          }
                                        >

                                          <XCircle
                                            size={14}
                                          />

                                          Reject

                                        </button>

                                      </>

                                    )
                                  }


                                  {/* CHECKED IN */}

                                  {
                                    appointment.status ===
                                    "CHECKED_IN" && (

                                      <button
                                        type="button"
                                        className="btn-small"
                                        disabled={
                                          actionLoading ===
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
                                          actionLoading ===
                                          appointment.id
                                            ? (

                                              <Loader2
                                                size={14}
                                                className="spin"
                                              />

                                            )
                                            : (

                                              <Play
                                                size={14}
                                              />

                                            )
                                        }

                                        Start

                                      </button>

                                    )
                                  }


                                  {/* ACTIVE CONSULTATION */}

                                  {
                                    appointment.status ===
                                    "IN_CONSULTATION" && (

                                      <button
                                        type="button"
                                        className="btn-small"
                                        onClick={
                                          () =>
                                            continueConsultation(
                                              appointment
                                            )
                                        }
                                      >

                                        <Stethoscope
                                          size={14}
                                        />

                                        Continue

                                      </button>

                                    )
                                  }


                                  {/* COMPLETED */}

                                  {
                                    appointment.status ===
                                    "COMPLETED" && (

                                      <button
                                        type="button"
                                        className="btn-small"
                                        onClick={
                                          () =>
                                            navigate(
                                              `/doctor/patients/${appointment.patient}`
                                            )
                                        }
                                      >

                                        <CheckCircle2
                                          size={14}
                                        />

                                        View

                                      </button>

                                    )
                                  }


                                  {/* OTHER STATUS */}

                                  {
                                    ![
                                      "PENDING",
                                      "CHECKED_IN",
                                      "IN_CONSULTATION",
                                      "COMPLETED",
                                    ].includes(
                                      appointment.status
                                    ) && (

                                      <button
                                        type="button"
                                        className="icon-btn"
                                        title="View appointment"
                                      >

                                        <Eye
                                          size={15}
                                        />

                                      </button>

                                    )
                                  }

                                </div>

                              </td>

                            </tr>

                          )
                        )
                    }

                  </tbody>

                </table>

              </div>

            </div>

          )
        }

      </div>

    </Layout>

  );

}


export default Appointments;
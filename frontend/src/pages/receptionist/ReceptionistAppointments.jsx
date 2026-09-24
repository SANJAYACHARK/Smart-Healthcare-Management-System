import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
  UserCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_CONSULTATION",
  "COMPLETED",
  "CANCELLED",
];


function ReceptionistAppointments() {

  const [
    appointments,
    setAppointments,
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
    actionLoading,
    setActionLoading,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


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


  const fetchAppointments =
    async (
      showRefresh = false
    ) => {

      try {

        if (showRefresh) {

          setRefreshing(true);

        } else {

          setLoading(true);

        }


        setError("");


        const response =
          await api.get(
            "/appointments/receptionist/"
          );


        setAppointments(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Receptionist appointments error:",
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
        setRefreshing(false);

      }

    };


  useEffect(() => {

    fetchAppointments();

  }, []);


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


  const updateStatus =
    async (
      appointment,
      status
    ) => {

      const actionKey =
        `${appointment.id}-${status}`;


      try {

        setActionLoading(
          actionKey
        );

        setError("");
        setSuccess("");


        await api.patch(
          `/appointments/receptionist/${appointment.id}/status/`,
          {
            status,
          }
        );


        setSuccess(
          status ===
          "CONFIRMED"
            ? "Appointment confirmed successfully."
            : status ===
              "CHECKED_IN"
            ? "Patient checked in successfully."
            : status ===
              "CANCELLED"
            ? "Appointment cancelled successfully."
            : "Appointment status updated successfully."
        );


        await fetchAppointments();

      } catch (err) {

        console.error(
          "Receptionist status error:",
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
              String(
                appointment
                  .patient_name ||
                ""
              ).toLowerCase();


            const doctorName =
              String(
                appointment
                  .doctor_name ||
                ""
              ).toLowerCase();


            const reason =
              String(
                appointment
                  .reason ||
                ""
              ).toLowerCase();


            const matchesSearch =
              !query ||
              patientName.includes(
                query
              ) ||
              doctorName.includes(
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


  const counts =
    useMemo(
      () => {

        const result = {
          ALL:
            appointments.length,

          PENDING: 0,
          CONFIRMED: 0,
          CHECKED_IN: 0,
          IN_CONSULTATION: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        };


        appointments.forEach(
          (
            appointment
          ) => {

            if (
              Object.prototype
                .hasOwnProperty
                .call(
                  result,
                  appointment.status
                )
            ) {

              result[
                appointment.status
              ] += 1;

            }

          }
        );


        return result;

      },
      [
        appointments,
      ]
    );


  const isActionLoading =
    (
      appointment,
      status
    ) =>
      actionLoading ===
      `${appointment.id}-${status}`;


  const renderActions =
    (
      appointment
    ) => {

      // Doctor is responsible for accepting/rejecting PENDING requests.
      // Receptionist waits until the doctor confirms the appointment.
      if (
        appointment.status ===
        "PENDING"
      ) {

        return (
          <span className="waiting-label">
            <Clock3 size={14} />
            Awaiting Doctor
          </span>
        );

      }


      // Once the doctor confirms the appointment, the receptionist
      // can check the patient in or cancel the appointment.
      if (
        appointment.status ===
        "CONFIRMED"
      ) {

        return (
          <div className="table-actions">

            <button
              type="button"
              className="btn-small"
              disabled={Boolean(actionLoading)}
              onClick={() =>
                updateStatus(
                  appointment,
                  "CHECKED_IN"
                )
              }
            >
              {
                isActionLoading(
                  appointment,
                  "CHECKED_IN"
                ) ? (
                  <Loader2
                    size={14}
                    className="spin"
                  />
                ) : (
                  <UserCheck size={14} />
                )
              }
              Check In
            </button>

            <button
              type="button"
              className="btn-small danger"
              disabled={Boolean(actionLoading)}
              onClick={() =>
                updateStatus(
                  appointment,
                  "CANCELLED"
                )
              }
            >
              {
                isActionLoading(
                  appointment,
                  "CANCELLED"
                ) ? (
                  <Loader2
                    size={14}
                    className="spin"
                  />
                ) : (
                  <XCircle size={14} />
                )
              }
              Cancel
            </button>

          </div>
        );

      }


      if (
        appointment.status ===
        "CHECKED_IN"
      ) {

        return (
          <span className="waiting-label">
            <Clock3 size={14} />
            Waiting for doctor
          </span>
        );

      }


      if (
        appointment.status ===
        "IN_CONSULTATION"
      ) {

        return (
          <span className="consulting-label">
            <Activity size={14} />
            Consulting
          </span>
        );

      }


      if (
        appointment.status ===
        "COMPLETED"
      ) {

        return (
          <span className="table-secondary">
            <CheckCircle2 size={14} />
            Completed
          </span>
        );

      }


      if (
        appointment.status ===
        "CANCELLED"
      ) {

        return (
          <span className="table-secondary">
            <XCircle size={14} />
            Cancelled
          </span>
        );

      }


      return (
        <span className="table-secondary">
          {formatStatus(appointment.status)}
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

          Loading appointments...

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      <div className="page-content receptionist-appointments-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST
            </p>


            <h1>
              Appointment Management
            </h1>


            <p className="page-description">

              Monitor doctor confirmations,
              check in arriving patients
              and monitor consultation flow.

            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            disabled={
              refreshing
            }
            onClick={
              () =>
                fetchAppointments(
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

        </div>


        {
          error && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        {
          success && (

            <div className="auth-success">

              {success}

            </div>

          )
        }


        <div className="receptionist-appointment-stats">


          <button
            type="button"
            className={
              statusFilter ===
              "ALL"
                ? "receptionist-appointment-stat active"
                : "receptionist-appointment-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ALL"
                )
            }
          >

            <CalendarDays
              size={18}
            />

            <div>

              <strong>
                {
                  counts.ALL
                }
              </strong>

              <span>
                All
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "PENDING"
                ? "receptionist-appointment-stat active"
                : "receptionist-appointment-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "PENDING"
                )
            }
          >

            <Clock3
              size={18}
            />

            <div>

              <strong>
                {
                  counts.PENDING
                }
              </strong>

              <span>
                Pending
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "CONFIRMED"
                ? "receptionist-appointment-stat active"
                : "receptionist-appointment-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "CONFIRMED"
                )
            }
          >

            <CheckCircle2
              size={18}
            />

            <div>

              <strong>
                {
                  counts.CONFIRMED
                }
              </strong>

              <span>
                Confirmed
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "CHECKED_IN"
                ? "receptionist-appointment-stat active"
                : "receptionist-appointment-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "CHECKED_IN"
                )
            }
          >

            <UserCheck
              size={18}
            />

            <div>

              <strong>
                {
                  counts.CHECKED_IN
                }
              </strong>

              <span>
                Checked In
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "IN_CONSULTATION"
                ? "receptionist-appointment-stat active"
                : "receptionist-appointment-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "IN_CONSULTATION"
                )
            }
          >

            <Activity
              size={18}
            />

            <div>

              <strong>
                {
                  counts.IN_CONSULTATION
                }
              </strong>

              <span>
                Consulting
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "COMPLETED"
                ? "receptionist-appointment-stat active"
                : "receptionist-appointment-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "COMPLETED"
                )
            }
          >

            <CheckCircle2
              size={18}
            />

            <div>

              <strong>
                {
                  counts.COMPLETED
                }
              </strong>

              <span>
                Completed
              </span>

            </div>

          </button>


        </div>


        <div className="card receptionist-appointments-card">

          <div className="appointment-filter-grid">

            <div className="search-box">

              <Search
                size={18}
              />


              <input
                type="text"
                placeholder="Search patient, doctor or reason..."
                value={
                  search
                }
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

              <Activity
                size={18}
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

                {
                  STATUS_OPTIONS.map(
                    (
                      status
                    ) => (

                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >

                        {
                          status ===
                          "ALL"
                            ? "All Statuses"
                            : formatStatus(
                                status
                              )
                        }

                      </option>

                    )
                  )
                }

              </select>

            </div>

          </div>


          <div className="table-responsive">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Patient
                  </th>

                  <th>
                    Doctor
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
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  filteredAppointments
                    .length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="receptionist-empty-cell"
                      >

                        No appointments found.

                      </td>

                    </tr>

                  ) : (

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

                            <td>

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

                                    ID: {
                                      appointment
                                        .patient ||
                                      "-"
                                    }

                                  </span>

                                </div>

                              </div>

                            </td>


                            <td>

                              <div className="status-label">

                                <Stethoscope
                                  size={15}
                                />

                                Dr. {
                                  appointment
                                    .doctor_name ||
                                  "-"
                                }

                              </div>

                            </td>


                            <td>

                              {
                                formatDate(
                                  appointment
                                    .appointment_date
                                )
                              }

                            </td>


                            <td>

                              <div className="status-label">

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


                            <td>

                              <span className="receptionist-reason-text">

                                {
                                  appointment
                                    .reason ||
                                  "-"
                                }

                              </span>

                            </td>


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
                                    appointment
                                      .status
                                  )
                                }

                              </span>

                            </td>


                            <td>

                              {
                                renderActions(
                                  appointment
                                )
                              }

                            </td>

                          </tr>

                        )
                      )

                  )
                }

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </Layout>

  );

}


export default ReceptionistAppointments;

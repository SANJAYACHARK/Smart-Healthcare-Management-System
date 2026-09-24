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
  RefreshCw,
  Search,
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


function MyPatients() {

  const navigate =
    useNavigate();


  // =========================================================
  // STATE
  // =========================================================

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
    search,
    setSearch,
  ] = useState("");


  // =========================================================
  // LOAD PATIENTS
  // =========================================================

  const fetchPatients =
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
            "/medical-records/doctor/patients/"
          );


        const data =
          response.data?.results ||
          response.data ||
          [];


        setPatients(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          "Doctor patients error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load patients."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    };


  useEffect(() => {

    fetchPatients();

  }, []);


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredPatients =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        if (!text) {

          return patients;

        }


        return patients.filter(
          (
            patient
          ) => {

            const name =
              (
                patient.patient_name ||
                ""
              ).toLowerCase();


            const email =
              (
                patient.email ||
                ""
              ).toLowerCase();


            const username =
              (
                patient.username ||
                ""
              ).toLowerCase();


            return (
              name.includes(text) ||
              email.includes(text) ||
              username.includes(text)
            );

          }
        );

      },
      [
        patients,
        search,
      ]
    );


  // =========================================================
  // SUMMARY
  // =========================================================

  const totalPatients =
    patients.length;


  const totalVisits =
    patients.reduce(
      (
        total,
        patient
      ) =>
        total +
        Number(
          patient.total_appointments ||
          0
        ),
      0
    );


  const completedVisits =
    patients.reduce(
      (
        total,
        patient
      ) =>
        total +
        Number(
          patient.completed_appointments ||
          0
        ),
      0
    );


  // =========================================================
  // HELPERS
  // =========================================================

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
            letter.toUpperCase()
        );

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

          Loading patients...

        </div>

      </Layout>

    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <Layout>

      <div className="page-content">


        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              DOCTOR
            </p>


            <h1>
              My Patients
            </h1>


            <p className="page-description">

              View your patients and access
              their appointment, medical and
              prescription history.

            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            disabled={refreshing}
            onClick={
              () =>
                fetchPatients(
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
            KPI CARDS
        ===================================================== */}

        <div className="dashboard-grid">


          <div className="card">

            <div className="kpi-card">

              <div className="kpi-icon">

                <Users
                  size={22}
                />

              </div>


              <div>

                <span className="kpi-label">

                  Total Patients

                </span>


                <h2>

                  {totalPatients}

                </h2>

              </div>

            </div>

          </div>


          <div className="card">

            <div className="kpi-card">

              <div className="kpi-icon">

                <CalendarDays
                  size={22}
                />

              </div>


              <div>

                <span className="kpi-label">

                  Total Visits

                </span>


                <h2>

                  {totalVisits}

                </h2>

              </div>

            </div>

          </div>


          <div className="card">

            <div className="kpi-card">

              <div className="kpi-icon">

                <CheckCircle2
                  size={22}
                />

              </div>


              <div>

                <span className="kpi-label">

                  Completed Visits

                </span>


                <h2>

                  {completedVisits}

                </h2>

              </div>

            </div>

          </div>


        </div>


        {/* ====================================================
            PATIENT TABLE
        ===================================================== */}

        <div className="card">


          <div className="table-toolbar">

            <div className="search-box">

              <Search
                size={18}
              />


              <input
                type="text"
                value={search}
                placeholder="Search patient name, email..."
                onChange={
                  (
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="table-secondary">

              {
                filteredPatients.length
              }

              {" "}

              patient(s)

            </div>

          </div>


          {
            filteredPatients.length ===
            0 ? (

              <div className="empty-state">

                <Users
                  size={34}
                />


                <h3>
                  No patients found
                </h3>


                <p>

                  Patients linked to your
                  appointments will appear
                  here.

                </p>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="data-table">

                  <thead>

                    <tr>

                      <th>
                        Patient
                      </th>

                      <th>
                        Total Visits
                      </th>

                      <th>
                        Completed
                      </th>

                      <th>
                        Last Visit
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
                      filteredPatients.map(
                        (
                          patient
                        ) => (

                          <tr
                            key={
                              patient
                                .patient_id
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
                                      patient
                                        .patient_name ||
                                      "Patient"
                                    }

                                  </strong>


                                  <span>

                                    {
                                      patient.email ||
                                      patient.username ||
                                      "-"
                                    }

                                  </span>

                                </div>

                              </div>

                            </td>


                            {/* TOTAL */}

                            <td>

                              <strong>

                                {
                                  patient
                                    .total_appointments ||
                                  0
                                }

                              </strong>

                            </td>


                            {/* COMPLETED */}

                            <td>

                              <div className="table-secondary">

                                <CheckCircle2
                                  size={14}
                                />

                                {
                                  patient
                                    .completed_appointments ||
                                  0
                                }

                              </div>

                            </td>


                            {/* LAST VISIT */}

                            <td>

                              <div className="table-secondary">

                                <CalendarDays
                                  size={14}
                                />

                                {
                                  formatDate(
                                    patient
                                      .last_appointment_date
                                  )
                                }

                              </div>


                              <div className="table-secondary">

                                <Clock3
                                  size={13}
                                />

                                {
                                  formatTime(
                                    patient
                                      .last_appointment_time
                                  )
                                }

                              </div>

                            </td>


                            {/* STATUS */}

                            <td>

                              <span
                                className={
                                  `status-badge appointment-status-${
                                    patient
                                      .last_status
                                      ?.toLowerCase()
                                  }`
                                }
                              >

                                {
                                  formatStatus(
                                    patient
                                      .last_status
                                  )
                                }

                              </span>

                            </td>


                            {/* ACTION */}

                            <td>

                              <button
                                type="button"
                                className="btn-small"
                                onClick={
                                  () =>
                                    navigate(
                                      `/doctor/patients/${patient.patient_id}`
                                    )
                                }
                              >

                                <Eye
                                  size={15}
                                />

                                View History

                              </button>

                            </td>


                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            )
          }

        </div>

      </div>

    </Layout>

  );

}


export default MyPatients;
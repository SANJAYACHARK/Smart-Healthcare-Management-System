import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  Stethoscope,
  UserRoundCheck,
  Users,
  WifiOff,
  XCircle,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function DoctorStatus() {

  const [
    doctors,
    setDoctors,
  ] = useState([]);

  const [
    serverSummary,
    setServerSummary,
  ] = useState(null);

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

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("ALL");


  // ========================================================
  // RESPONSE HELPERS
  // ========================================================

  const getResults = (response) => {

    const data = response?.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };


  // ========================================================
  // FETCH DOCTORS
  // ========================================================

  const fetchDoctorStatus =
    useCallback(
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
              "/accounts/receptionist/doctors/"
            );

          const results =
            getResults(response);

          setDoctors(results);

          setServerSummary(
            response?.data?.summary ||
            null
          );

        } catch (err) {

          console.error(
            "Doctor status load error:",
            err
          );

          setDoctors([]);
          setServerSummary(null);

          setError(
            err?.response
              ?.data
              ?.detail ||
            err?.response
              ?.data
              ?.message ||
            "Unable to load doctor status."
          );

        } finally {

          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  useEffect(() => {

    fetchDoctorStatus();

  }, [fetchDoctorStatus]);


  // ========================================================
  // DOCTOR NAME
  // ========================================================

  const getDoctorName = (doctor) => {

    const firstName =
      doctor?.first_name || "";

    const lastName =
      doctor?.last_name || "";

    const fullName =
      `${firstName} ${lastName}`
        .trim();

    return (
      fullName ||
      doctor?.username ||
      "Doctor"
    );
  };


  // ========================================================
  // DEPARTMENT NAME
  // ========================================================

  const getDepartmentName = (doctor) => {

    if (doctor?.department_name) {
      return doctor.department_name;
    }

    if (
      typeof doctor?.department ===
      "string"
    ) {
      return doctor.department;
    }

    return "General";
  };


  // ========================================================
  // LIVE STATUS
  // ========================================================

  const getLiveStatus = (doctor) => {

    return (
      doctor?.live_status ||
      doctor?.status ||
      (
        doctor?.is_active === false
          ? "OFFLINE"
          : doctor?.is_available === false
            ? "UNAVAILABLE"
            : "AVAILABLE"
      )
    );
  };


  // ========================================================
  // DEPARTMENTS
  // ========================================================

  const departments =
    useMemo(
      () => {

        const values =
          doctors
            .map(
              (doctor) =>
                getDepartmentName(
                  doctor
                )
            )
            .filter(Boolean);

        return [
          ...new Set(values)
        ].sort(
          (a, b) =>
            a.localeCompare(b)
        );

      },
      [doctors]
    );


  // ========================================================
  // FILTERED DOCTORS
  // ========================================================

  const filteredDoctors =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();

        return doctors.filter(
          (doctor) => {

            const name =
              getDoctorName(
                doctor
              );

            const department =
              getDepartmentName(
                doctor
              );

            const status =
              getLiveStatus(
                doctor
              );

            const specialization =
              doctor?.specialization ||
              "";

            const currentPatient =
              doctor
                ?.current_appointment
                ?.patient_name ||
              "";

            const nextPatient =
              doctor
                ?.next_appointment
                ?.patient_name ||
              "";

            const matchesSearch =
              !text ||
              name
                .toLowerCase()
                .includes(text) ||
              department
                .toLowerCase()
                .includes(text) ||
              specialization
                .toLowerCase()
                .includes(text) ||
              currentPatient
                .toLowerCase()
                .includes(text) ||
              nextPatient
                .toLowerCase()
                .includes(text);

            const matchesStatus =
              statusFilter ===
                "ALL" ||
              status ===
                statusFilter;

            const matchesDepartment =
              departmentFilter ===
                "ALL" ||
              department ===
                departmentFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesDepartment
            );
          }
        );

      },
      [
        doctors,
        search,
        statusFilter,
        departmentFilter,
      ]
    );


  // ========================================================
  // STATISTICS
  // ========================================================

  const stats =
    useMemo(
      () => {

        const calculated = {
          total:
            doctors.length,

          available:
            doctors.filter(
              (doctor) =>
                getLiveStatus(
                  doctor
                ) === "AVAILABLE"
            ).length,

          busy:
            doctors.filter(
              (doctor) =>
                getLiveStatus(
                  doctor
                ) === "BUSY"
            ).length,

          unavailable:
            doctors.filter(
              (doctor) =>
                getLiveStatus(
                  doctor
                ) === "UNAVAILABLE"
            ).length,

          offline:
            doctors.filter(
              (doctor) =>
                getLiveStatus(
                  doctor
                ) === "OFFLINE"
            ).length,
        };

        return {
          total:
            serverSummary?.total ??
            calculated.total,

          available:
            serverSummary?.available ??
            calculated.available,

          busy:
            serverSummary?.busy ??
            calculated.busy,

          unavailable:
            serverSummary?.unavailable ??
            calculated.unavailable,

          offline:
            serverSummary?.offline ??
            calculated.offline,
        };

      },
      [
        doctors,
        serverSummary,
      ]
    );


  // ========================================================
  // TIME FORMAT
  // ========================================================

  const formatTime = (time) => {

    if (!time) {
      return "-";
    }

    try {

      const [
        hour,
        minute,
      ] = String(time)
        .split(":");

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

    } catch {

      return time;
    }
  };


  // ========================================================
  // DATE FORMAT
  // ========================================================

  const formatDate = (dateValue) => {

    if (!dateValue) {
      return "-";
    }

    const date =
      new Date(
        `${dateValue}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateValue;
    }

    return date
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


  // ========================================================
  // STATUS LABEL
  // ========================================================

  const formatStatus = (status) => {

    if (!status) {
      return "-";
    }

    return String(status)
      .replaceAll(
        "_",
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };


  // ========================================================
  // STATUS CSS
  // ========================================================

  const getStatusClass = (status) => {

    switch (status) {

      case "AVAILABLE":

        return (
          "status-badge status-active"
        );

      case "BUSY":

        return (
          "status-badge appointment-status-in_consultation"
        );

      case "UNAVAILABLE":

        return (
          "status-badge badge-warning"
        );

      case "OFFLINE":

        return (
          "status-badge status-inactive"
        );

      default:

        return (
          "status-badge"
        );
    }
  };


  // ========================================================
  // CLEAR FILTERS
  // ========================================================

  const clearFilters = () => {

    setSearch("");
    setStatusFilter("ALL");
    setDepartmentFilter("ALL");
  };


  // ========================================================
  // UI
  // ========================================================

  return (

    <Layout>

      <div
        className="
          page-content
          doctor-status-page
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            page-header
            page-header-actions
          "
        >

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST
            </p>

            <h1>
              Doctor Status
            </h1>

            <p className="page-description">
              Monitor doctor availability,
              consultations and today's
              appointment activity in real
              time.
            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            disabled={refreshing}
            onClick={
              () =>
                fetchDoctorStatus(true)
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


        {/* =================================================
            ERROR
        ================================================= */}

        {
          error && (

            <div className="error-message">

              {error}

            </div>
          )
        }


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="doctor-status-stats">

          <button
            type="button"
            className={
              statusFilter === "ALL"
                ? "doctor-status-stat active"
                : "doctor-status-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ALL"
                )
            }
          >

            <Stethoscope size={19} />

            <div>

              <strong>
                {stats.total}
              </strong>

              <span>
                Total Doctors
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
                "AVAILABLE"
                ? "doctor-status-stat active"
                : "doctor-status-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "AVAILABLE"
                )
            }
          >

            <UserRoundCheck
              size={19}
            />

            <div>

              <strong>
                {stats.available}
              </strong>

              <span>
                Available
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter === "BUSY"
                ? "doctor-status-stat active"
                : "doctor-status-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "BUSY"
                )
            }
          >

            <Activity size={19} />

            <div>

              <strong>
                {stats.busy}
              </strong>

              <span>
                Busy
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
                "UNAVAILABLE"
                ? "doctor-status-stat active"
                : "doctor-status-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "UNAVAILABLE"
                )
            }
          >

            <XCircle size={19} />

            <div>

              <strong>
                {stats.unavailable}
              </strong>

              <span>
                Unavailable
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
                "OFFLINE"
                ? "doctor-status-stat active"
                : "doctor-status-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "OFFLINE"
                )
            }
          >

            <WifiOff size={19} />

            <div>

              <strong>
                {stats.offline}
              </strong>

              <span>
                Offline
              </span>

            </div>

          </button>

        </div>


        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div
          className="
            card
            doctor-status-main-card
          "
        >

          {/* ===============================================
              FILTERS
          =============================================== */}

          <div className="doctor-status-toolbar">

            <div className="search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search doctor, department, specialization or patient..."
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="doctor-status-filter">

              <Activity size={17} />

              <select
                value={statusFilter}
                onChange={
                  (event) =>
                    setStatusFilter(
                      event.target.value
                    )
                }
              >

                <option value="ALL">
                  All Statuses
                </option>

                <option value="AVAILABLE">
                  Available
                </option>

                <option value="BUSY">
                  Busy
                </option>

                <option value="UNAVAILABLE">
                  Unavailable
                </option>

                <option value="OFFLINE">
                  Offline
                </option>

              </select>

            </div>


            <div className="doctor-status-filter">

              <Stethoscope
                size={17}
              />

              <select
                value={
                  departmentFilter
                }
                onChange={
                  (event) =>
                    setDepartmentFilter(
                      event.target.value
                    )
                }
              >

                <option value="ALL">
                  All Departments
                </option>

                {
                  departments.map(
                    (department) => (

                      <option
                        key={department}
                        value={department}
                      >

                        {department}

                      </option>
                    )
                  )
                }

              </select>

            </div>


            {
              (
                search ||
                statusFilter !== "ALL" ||
                departmentFilter !== "ALL"
              ) && (

                <button
                  type="button"
                  className="doctor-filter-clear"
                  onClick={clearFilters}
                >

                  <XCircle size={16} />

                  Clear

                </button>
              )
            }

          </div>


          {/* ===============================================
              RESULT COUNT
          =============================================== */}

          {
            !loading && (

              <div className="doctor-results-summary">

                Showing

                <strong>
                  {filteredDoctors.length}
                </strong>

                of

                <strong>
                  {doctors.length}
                </strong>

                doctors

              </div>
            )
          }


          {/* ===============================================
              DOCTOR GRID
          =============================================== */}

          <div className="doctor-status-grid">

            {
              loading ? (

                <div className="doctor-status-loading">

                  <RefreshCw
                    size={24}
                    className="spin"
                  />

                  <strong>
                    Loading doctor status...
                  </strong>

                  <span>
                    Fetching current doctor
                    availability and appointments.
                  </span>

                </div>

              ) : filteredDoctors.length ===
                0 ? (

                <div className="doctor-status-loading">

                  <Stethoscope
                    size={27}
                  />

                  <strong>
                    No doctors found
                  </strong>

                  <span>
                    Try changing the search
                    or filters.
                  </span>

                </div>

              ) : (

                filteredDoctors.map(
                  (doctor) => {

                    const liveStatus =
                      getLiveStatus(
                        doctor
                      );

                    const doctorName =
                      getDoctorName(
                        doctor
                      );

                    const department =
                      getDepartmentName(
                        doctor
                      );

                    const current =
                      doctor
                        ?.current_appointment;

                    const next =
                      doctor
                        ?.next_appointment;

                    const today =
                      doctor?.today || {};

                    return (

                      <article
                        className="
                          doctor-status-card
                          enhanced
                        "
                        key={doctor.id}
                      >

                        {/* ===============================
                            CARD HEADER
                        =============================== */}

                        <div className="doctor-status-header">

                          <div className="doctor-status-profile">

                            <div className="doctor-status-avatar">

                              <Stethoscope
                                size={21}
                              />

                            </div>

                            <div className="doctor-status-title">

                              <h3>
                                Dr. {doctorName}
                              </h3>

                              <p>

                                {
                                  doctor
                                    ?.specialization ||
                                  "General Practitioner"
                                }

                              </p>

                            </div>

                          </div>


                          <span
                            className={
                              getStatusClass(
                                liveStatus
                              )
                            }
                          >

                            {
                              formatStatus(
                                liveStatus
                              )
                            }

                          </span>

                        </div>


                        {/* ===============================
                            BASIC INFORMATION
                        =============================== */}

                        <div
                          className="
                            doctor-status-info
                            enhanced
                          "
                        >

                          <div>

                            <span>
                              Department
                            </span>

                            <strong>
                              {department}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Experience
                            </span>

                            <strong>

                              {
                                doctor
                                  ?.experience_years ??
                                0
                              } years

                            </strong>

                          </div>


                          <div>

                            <span>
                              Qualification
                            </span>

                            <strong>

                              {
                                doctor
                                  ?.qualification ||
                                "-"
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Today's Appointments
                            </span>

                            <strong>

                              <CalendarDays
                                size={14}
                              />

                              {
                                today?.total ??
                                0
                              }

                            </strong>

                          </div>

                        </div>


                        {/* ===============================
                            TODAY SUMMARY
                        =============================== */}

                        <div className="doctor-today-summary">

                          <div>

                            <Activity
                              size={15}
                            />

                            <span>
                              Active
                            </span>

                            <strong>
                              {
                                today?.active ??
                                0
                              }
                            </strong>

                          </div>


                          <div>

                            <CheckCircle2
                              size={15}
                            />

                            <span>
                              Completed
                            </span>

                            <strong>
                              {
                                today?.completed ??
                                0
                              }
                            </strong>

                          </div>


                          <div>

                            <XCircle
                              size={15}
                            />

                            <span>
                              Cancelled
                            </span>

                            <strong>
                              {
                                today?.cancelled ??
                                0
                              }
                            </strong>

                          </div>

                        </div>


                        {/* ===============================
                            CURRENT CONSULTATION
                        =============================== */}

                        {
                          current ? (

                            <div
                              className="
                                doctor-current-patient
                                enhanced
                              "
                            >

                              <UserRoundCheck
                                size={18}
                              />

                              <div>

                                <span>
                                  Currently Consulting
                                </span>

                                <strong>
                                  {
                                    current
                                      ?.patient_name ||
                                    "Patient"
                                  }
                                </strong>

                                <small>

                                  {
                                    formatTime(
                                      current
                                        ?.appointment_time
                                    )
                                  }

                                  {" • "}

                                  {
                                    formatStatus(
                                      current?.status
                                    )
                                  }

                                </small>

                              </div>

                            </div>

                          ) : (

                            <div className="doctor-no-current">

                              <UserRoundCheck
                                size={17}
                              />

                              <div>

                                <span>
                                  Current Consultation
                                </span>

                                <strong>
                                  No active consultation
                                </strong>

                              </div>

                            </div>
                          )
                        }


                        {/* ===============================
                            NEXT APPOINTMENT
                        =============================== */}

                        {
                          next ? (

                            <div className="doctor-next-appointment">

                              <div className="doctor-next-heading">

                                <div>

                                  <Clock3
                                    size={16}
                                  />

                                  <span>
                                    Next Appointment
                                  </span>

                                </div>

                                <strong>
                                  {
                                    formatTime(
                                      next
                                        ?.appointment_time
                                    )
                                  }
                                </strong>

                              </div>


                              <div className="doctor-next-details">

                                <div>

                                  <span>
                                    Patient
                                  </span>

                                  <strong>
                                    {
                                      next
                                        ?.patient_name ||
                                      "-"
                                    }
                                  </strong>

                                </div>

                                <div>

                                  <span>
                                    Date
                                  </span>

                                  <strong>
                                    {
                                      formatDate(
                                        next
                                          ?.appointment_date
                                      )
                                    }
                                  </strong>

                                </div>

                                <div>

                                  <span>
                                    Status
                                  </span>

                                  <strong>
                                    {
                                      formatStatus(
                                        next?.status
                                      )
                                    }
                                  </strong>

                                </div>

                              </div>

                            </div>

                          ) : (

                            <div className="doctor-next-empty">

                              <Clock3 size={16} />

                              No upcoming appointment today.

                            </div>
                          )
                        }


                        {/* ===============================
                            FOOTER
                        =============================== */}

                        <div className="doctor-queue-footer">

                          <span>

                            <Users size={14} />

                            {
                              today?.active ??
                              0
                            } active today

                          </span>


                          <span>

                            <CheckCircle2
                              size={14}
                            />

                            {
                              today?.completed ??
                              0
                            } completed

                          </span>

                        </div>

                      </article>
                    );
                  }
                )
              )
            }

          </div>

        </div>

      </div>

    </Layout>
  );
}


export default DoctorStatus;
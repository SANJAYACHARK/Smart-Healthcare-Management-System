import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  Power,
  RefreshCw,
  Search,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import api from "../../api/axios";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const fetchPatients = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/accounts/admin/patients/"
      );

      setPatients(getResults(response));
    } catch (err) {
      console.error(
        "Admin patients load error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to load patients."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const stats = useMemo(() => {
    const active = patients.filter(
      (patient) =>
        patient.is_active !== false
    ).length;

    return {
      total: patients.length,
      active,
      inactive: patients.length - active,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const text = search
      .trim()
      .toLowerCase();

    return patients.filter((patient) => {
      const fullName =
        `${patient.first_name || ""} ${
          patient.last_name || ""
        }`
          .trim()
          .toLowerCase();

      const username = String(
        patient.username || ""
      ).toLowerCase();

      const email = String(
        patient.email || ""
      ).toLowerCase();

      const phone = String(
        patient.phone || ""
      ).toLowerCase();

      const matchesSearch =
        !text ||
        fullName.includes(text) ||
        username.includes(text) ||
        email.includes(text) ||
        phone.includes(text);

      const isActive =
        patient.is_active !== false;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          isActive) ||
        (statusFilter === "INACTIVE" &&
          !isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    patients,
    search,
    statusFilter,
  ]);

  const getDisplayName = (patient) => {
    const fullName =
      `${patient.first_name || ""} ${
        patient.last_name || ""
      }`.trim();

    return (
      fullName ||
      patient.username ||
      "Patient"
    );
  };

  const getInitials = (patient) => {
    const name =
      getDisplayName(patient);

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part[0]?.toUpperCase()
      )
      .join("");
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const raw = String(value);

    const parsed =
      /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(`${raw}T00:00:00`)
        : new Date(raw);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return raw;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const toggleStatus = async (
    patient
  ) => {
    try {
      setUpdatingId(patient.id);
      setError("");
      setSuccess("");

      const nextStatus =
        !(patient.is_active !== false);

      await api.patch(
        `/accounts/admin/patients/${patient.id}/`,
        {
          is_active: nextStatus,
        }
      );

      setPatients((previous) =>
        previous.map((item) =>
          item.id === patient.id
            ? {
                ...item,
                is_active: nextStatus,
              }
            : item
        )
      );

      setSuccess(
        nextStatus
          ? "Patient activated successfully."
          : "Patient deactivated successfully."
      );
    } catch (err) {
      console.error(
        "Patient status update error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to update patient status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout>
      <div className="page-content admin-patients-page">
        <div className="page-header page-header-actions">
          <div>
            <p className="page-eyebrow">
              ADMINISTRATION
            </p>

            <h1>Patients</h1>

            <p className="page-description">
              View registered patients,
              search patient accounts and
              manage account access.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            disabled={refreshing}
            onClick={() =>
              fetchPatients(true)
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

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        <div className="admin-patient-stats">
          <button
            type="button"
            className={
              statusFilter === "ALL"
                ? "admin-patient-stat active"
                : "admin-patient-stat"
            }
            onClick={() =>
              setStatusFilter("ALL")
            }
          >
            <Users size={20} />

            <div>
              <strong>
                {stats.total}
              </strong>

              <span>
                Total Patients
              </span>
            </div>
          </button>

          <button
            type="button"
            className={
              statusFilter === "ACTIVE"
                ? "admin-patient-stat active"
                : "admin-patient-stat"
            }
            onClick={() =>
              setStatusFilter("ACTIVE")
            }
          >
            <UserRoundCheck
              size={20}
            />

            <div>
              <strong>
                {stats.active}
              </strong>

              <span>
                Active Patients
              </span>
            </div>
          </button>

          <button
            type="button"
            className={
              statusFilter === "INACTIVE"
                ? "admin-patient-stat active"
                : "admin-patient-stat"
            }
            onClick={() =>
              setStatusFilter("INACTIVE")
            }
          >
            <UserRoundX
              size={20}
            />

            <div>
              <strong>
                {stats.inactive}
              </strong>

              <span>
                Inactive Patients
              </span>
            </div>
          </button>

          <div className="admin-patient-stat static">
            <UserRound size={20} />

            <div>
              <strong>
                {filteredPatients.length}
              </strong>

              <span>
                Showing Results
              </span>
            </div>
          </div>
        </div>

        <div className="card admin-patients-card">
          <div className="admin-patients-toolbar">
            <div className="search-box">
              <Search size={19} />

              <input
                type="text"
                placeholder="Search patient name, username, email or phone..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              className="admin-patients-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="ALL">
                All Patients
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Username</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="admin-patient-empty-cell"
                    >
                      <Loader2
                        size={18}
                        className="spin"
                      />

                      Loading patients...
                    </td>
                  </tr>
                ) : filteredPatients.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="admin-patient-empty-cell"
                    >
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(
                    (patient) => {
                      const isActive =
                        patient.is_active !==
                        false;

                      return (
                        <tr
                          key={patient.id}
                        >
                          <td>
                            <div className="table-user">
                              <div className="table-avatar admin-patient-avatar">
                                {getInitials(
                                  patient
                                ) || (
                                  <UserRound
                                    size={17}
                                  />
                                )}
                              </div>

                              <div>
                                <strong>
                                  {getDisplayName(
                                    patient
                                  )}
                                </strong>

                                <span>
                                  {patient.email ||
                                    "No email"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {patient.username ||
                              "-"}
                          </td>

                          <td>
                            <div className="admin-patient-contact">
                              <span>
                                <Mail
                                  size={14}
                                />

                                {patient.email ||
                                  "-"}
                              </span>

                              <span>
                                <Phone
                                  size={14}
                                />

                                {patient.phone ||
                                  "-"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="admin-patient-joined">
                              <CalendarDays
                                size={14}
                              />

                              {formatDate(
                                patient.date_joined ||
                                  patient.joined
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                isActive
                                  ? "status-badge status-active"
                                  : "status-badge status-inactive"
                              }
                            >
                              {isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className={
                                isActive
                                  ? "btn-small btn-secondary admin-patient-status-btn deactivate"
                                  : "btn-small btn-secondary admin-patient-status-btn"
                              }
                              disabled={
                                updatingId ===
                                patient.id
                              }
                              onClick={() =>
                                toggleStatus(
                                  patient
                                )
                              }
                            >
                              {updatingId ===
                              patient.id ? (
                                <Loader2
                                  size={15}
                                  className="spin"
                                />
                              ) : (
                                <Power
                                  size={15}
                                />
                              )}

                              {updatingId ===
                              patient.id
                                ? "Updating..."
                                : isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Patients;

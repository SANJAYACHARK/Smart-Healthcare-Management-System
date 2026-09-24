import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function ReceptionistPatients() {

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
            "/accounts/receptionist/patients/"
          );


        setPatients(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Receptionist patients error:",
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


  const filteredPatients =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return patients.filter(
          (
            patient
          ) => {

            const fullName =
              `${patient.first_name || ""} ${
                patient.last_name || ""
              }`
                .trim()
                .toLowerCase();


            const username =
              String(
                patient.username ||
                ""
              ).toLowerCase();


            const email =
              String(
                patient.email ||
                ""
              ).toLowerCase();


            const phone =
              String(
                patient.phone ||
                ""
              ).toLowerCase();


            const matchesSearch =
              !text ||
              fullName.includes(
                text
              ) ||
              username.includes(
                text
              ) ||
              email.includes(
                text
              ) ||
              phone.includes(
                text
              );


            const isActive =
              patient.is_active !==
              false;


            const matchesStatus =
              statusFilter ===
              "ALL" ||
              (
                statusFilter ===
                "ACTIVE" &&
                isActive
              ) ||
              (
                statusFilter ===
                "INACTIVE" &&
                !isActive
              );


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        patients,
        search,
        statusFilter,
      ]
    );


  const counts =
    useMemo(
      () => {

        const active =
          patients.filter(
            (
              patient
            ) =>
              patient.is_active !==
              false
          ).length;


        const inactive =
          patients.length -
          active;


        return {
          total:
            patients.length,

          active,

          inactive,
        };

      },
      [
        patients,
      ]
    );


  const getDisplayName =
    (
      patient
    ) => {

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


  const getInitials =
    (
      patient
    ) => {

      const name =
        getDisplayName(
          patient
        );


      return name
        .split(" ")
        .filter(Boolean)
        .slice(
          0,
          2
        )
        .map(
          (
            item
          ) =>
            item[0]
              ?.toUpperCase()
        )
        .join("");

    };


  return (

    <Layout>

      <div className="page-content receptionist-patients-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST
            </p>


            <h1>
              Patients
            </h1>


            <p className="page-description">

              Search and view registered
              patient details and account
              status.

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


        {
          error && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        <div className="receptionist-patient-stats">


          <button
            type="button"
            className={
              statusFilter ===
              "ALL"
                ? "receptionist-patient-stat active"
                : "receptionist-patient-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ALL"
                )
            }
          >

            <Users
              size={19}
            />

            <div>

              <strong>
                {
                  counts.total
                }
              </strong>

              <span>
                Total Patients
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "ACTIVE"
                ? "receptionist-patient-stat active"
                : "receptionist-patient-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "ACTIVE"
                )
            }
          >

            <UserRound
              size={19}
            />

            <div>

              <strong>
                {
                  counts.active
                }
              </strong>

              <span>
                Active
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              statusFilter ===
              "INACTIVE"
                ? "receptionist-patient-stat active"
                : "receptionist-patient-stat"
            }
            onClick={
              () =>
                setStatusFilter(
                  "INACTIVE"
                )
            }
          >

            <UserRound
              size={19}
            />

            <div>

              <strong>
                {
                  counts.inactive
                }
              </strong>

              <span>
                Inactive
              </span>

            </div>

          </button>


        </div>


        <div className="card receptionist-patients-card">

          <div className="table-toolbar receptionist-patient-toolbar">

            <div className="search-box">

              <Search
                size={18}
              />


              <input
                type="text"
                placeholder="Search patient, username, email or phone..."
                value={
                  search
                }
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


            <select
              className="receptionist-patient-filter"
              value={
                statusFilter
              }
              onChange={
                (
                  event
                ) =>
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

                  <th>
                    Patient
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  loading ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="receptionist-empty-cell"
                      >

                        Loading patients...

                      </td>

                    </tr>

                  ) : filteredPatients
                    .length ===
                    0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="receptionist-empty-cell"
                      >

                        No patients found.

                      </td>

                    </tr>

                  ) : (

                    filteredPatients
                      .map(
                        (
                          patient
                        ) => (

                          <tr
                            key={
                              patient.id
                            }
                          >

                            <td>

                              <div className="table-user">

                                <div className="receptionist-patient-avatar">

                                  {
                                    getInitials(
                                      patient
                                    ) ||
                                    "P"
                                  }

                                </div>


                                <div>

                                  <strong>

                                    {
                                      getDisplayName(
                                        patient
                                      )
                                    }

                                  </strong>


                                  <span>

                                    Patient ID: {
                                      patient.id
                                    }

                                  </span>

                                </div>

                              </div>

                            </td>


                            <td>

                              {
                                patient.username ||
                                "-"
                              }

                            </td>


                            <td>

                              <div className="status-label receptionist-contact-label">

                                <Mail
                                  size={14}
                                />

                                {
                                  patient.email ||
                                  "-"
                                }

                              </div>

                            </td>


                            <td>

                              <div className="status-label receptionist-contact-label">

                                <Phone
                                  size={14}
                                />

                                {
                                  patient.phone ||
                                  "-"
                                }

                              </div>

                            </td>


                            <td>

                              <span
                                className={
                                  patient
                                    .is_active !==
                                  false
                                    ? "status-badge status-active"
                                    : "status-badge status-inactive"
                                }
                              >

                                {
                                  patient
                                    .is_active !==
                                  false
                                    ? "Active"
                                    : "Inactive"
                                }

                              </span>

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


export default ReceptionistPatients;

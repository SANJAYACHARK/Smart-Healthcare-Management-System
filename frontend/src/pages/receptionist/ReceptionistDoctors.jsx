import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeIndianRupee,
  Building2,
  BriefcaseMedical,
  RefreshCw,
  Search,
  Stethoscope,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function ReceptionistDoctors() {

  const [
    doctors,
    setDoctors,
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
    availabilityFilter,
    setAvailabilityFilter,
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


  const fetchDoctors =
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


        setDoctors(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Receptionist doctors error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load doctors."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    };


  useEffect(() => {

    fetchDoctors();

  }, []);


  const filteredDoctors =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return doctors.filter(
          (
            doctor
          ) => {

            const fullName =
              `${doctor.first_name || ""} ${
                doctor.last_name || ""
              }`
                .trim()
                .toLowerCase();


            const username =
              String(
                doctor.username ||
                ""
              ).toLowerCase();


            const specialization =
              String(
                doctor.specialization ||
                ""
              ).toLowerCase();


            const department =
              String(
                doctor.department_name ||
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
              specialization.includes(
                text
              ) ||
              department.includes(
                text
              );


            const available =
              Boolean(
                doctor.is_active &&
                doctor.is_available
              );


            const matchesAvailability =
              availabilityFilter ===
              "ALL" ||
              (
                availabilityFilter ===
                "AVAILABLE" &&
                available
              ) ||
              (
                availabilityFilter ===
                "UNAVAILABLE" &&
                !available
              );


            return (
              matchesSearch &&
              matchesAvailability
            );

          }
        );

      },
      [
        doctors,
        search,
        availabilityFilter,
      ]
    );


  const stats =
    useMemo(
      () => {

        const available =
          doctors.filter(
            (
              doctor
            ) =>
              doctor.is_active &&
              doctor.is_available
          ).length;


        const unavailable =
          doctors.length -
          available;


        const departments =
          new Set(
            doctors
              .map(
                (
                  doctor
                ) =>
                  doctor.department_name
              )
              .filter(Boolean)
          ).size;


        return {
          total:
            doctors.length,

          available,

          unavailable,

          departments,
        };

      },
      [
        doctors,
      ]
    );


  const getDoctorName =
    (
      doctor
    ) => {

      const fullName =
        `${doctor.first_name || ""} ${
          doctor.last_name || ""
        }`.trim();


      return (
        fullName ||
        doctor.username ||
        "Doctor"
      );

    };


  const formatCurrency =
    (
      amount
    ) => {

      const numeric =
        Number(
          amount
        );


      if (
        Number.isNaN(
          numeric
        )
      ) {

        return (
          amount ||
          "-"
        );

      }


      return new Intl.NumberFormat(
        "en-IN",
        {
          style:
            "currency",

          currency:
            "INR",

          maximumFractionDigits:
            numeric % 1 ===
            0
              ? 0
              : 2,
        }
      ).format(
        numeric
      );

    };


  return (

    <Layout>

      <div className="page-content receptionist-doctors-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST
            </p>


            <h1>
              Doctors
            </h1>


            <p className="page-description">

              View doctors, departments,
              specialization, consultation
              fees and current availability.

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
                fetchDoctors(
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


        <div className="receptionist-doctor-stats">


          <button
            type="button"
            className={
              availabilityFilter ===
              "ALL"
                ? "receptionist-doctor-stat active"
                : "receptionist-doctor-stat"
            }
            onClick={
              () =>
                setAvailabilityFilter(
                  "ALL"
                )
            }
          >

            <Stethoscope
              size={19}
            />

            <div>

              <strong>
                {
                  stats.total
                }
              </strong>

              <span>
                Total Doctors
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              availabilityFilter ===
              "AVAILABLE"
                ? "receptionist-doctor-stat active"
                : "receptionist-doctor-stat"
            }
            onClick={
              () =>
                setAvailabilityFilter(
                  "AVAILABLE"
                )
            }
          >

            <UserRoundCheck
              size={19}
            />

            <div>

              <strong>
                {
                  stats.available
                }
              </strong>

              <span>
                Available
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              availabilityFilter ===
              "UNAVAILABLE"
                ? "receptionist-doctor-stat active"
                : "receptionist-doctor-stat"
            }
            onClick={
              () =>
                setAvailabilityFilter(
                  "UNAVAILABLE"
                )
            }
          >

            <UserRoundX
              size={19}
            />

            <div>

              <strong>
                {
                  stats.unavailable
                }
              </strong>

              <span>
                Unavailable
              </span>

            </div>

          </button>


          <div className="receptionist-doctor-stat static">

            <Building2
              size={19}
            />

            <div>

              <strong>
                {
                  stats.departments
                }
              </strong>

              <span>
                Departments
              </span>

            </div>

          </div>


        </div>


        <div className="card receptionist-doctors-card">

          <div className="table-toolbar receptionist-doctor-toolbar">

            <div className="search-box">

              <Search
                size={18}
              />


              <input
                type="text"
                placeholder="Search doctor, specialization or department..."
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


            <select
              className="receptionist-doctor-filter"
              value={
                availabilityFilter
              }
              onChange={
                (
                  event
                ) =>
                  setAvailabilityFilter(
                    event
                      .target
                      .value
                  )
              }
            >

              <option value="ALL">
                All Doctors
              </option>

              <option value="AVAILABLE">
                Available
              </option>

              <option value="UNAVAILABLE">
                Unavailable
              </option>

            </select>

          </div>


          <div className="table-responsive">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Experience
                  </th>

                  <th>
                    Consultation Fee
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
                        className="receptionist-doctor-empty-cell"
                      >

                        Loading doctors...

                      </td>

                    </tr>

                  ) : filteredDoctors
                    .length ===
                    0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="receptionist-doctor-empty-cell"
                      >

                        No doctors found.

                      </td>

                    </tr>

                  ) : (

                    filteredDoctors
                      .map(
                        (
                          doctor
                        ) => {

                          const available =
                            Boolean(
                              doctor.is_active &&
                              doctor.is_available
                            );


                          return (

                            <tr
                              key={
                                doctor.id
                              }
                            >

                              <td>

                                <div className="table-user">

                                  <div className="table-avatar">

                                    <Stethoscope
                                      size={17}
                                    />

                                  </div>


                                  <div>

                                    <strong>

                                      Dr. {
                                        getDoctorName(
                                          doctor
                                        )
                                      }

                                    </strong>


                                    <span>

                                      {
                                        doctor.specialization ||
                                        "General"
                                      }

                                    </span>

                                  </div>

                                </div>

                              </td>


                              <td>

                                <div className="status-label">

                                  <Building2
                                    size={14}
                                  />

                                  {
                                    doctor.department_name ||
                                    "General"
                                  }

                                </div>

                              </td>


                              <td>

                                <div className="status-label">

                                  <BriefcaseMedical
                                    size={14}
                                  />

                                  {
                                    doctor.experience_years ??
                                    0
                                  } Years

                                </div>

                              </td>


                              <td>

                                <div className="status-label">

                                  <BadgeIndianRupee
                                    size={14}
                                  />

                                  {
                                    formatCurrency(
                                      doctor.consultation_fee
                                    )
                                  }

                                </div>

                              </td>


                              <td>

                                <span
                                  className={
                                    available
                                      ? "status-badge status-active"
                                      : "status-badge status-inactive"
                                  }
                                >

                                  {
                                    available
                                      ? "Available"
                                      : "Unavailable"
                                  }

                                </span>

                              </td>

                            </tr>

                          );

                        }
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


export default ReceptionistDoctors;

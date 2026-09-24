import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  FileHeart,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function MedicalRecords() {

  const [
    records,
    setRecords,
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


  const fetchRecords =
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
            "/medical-records/doctor/"
          );


        const data =
          response.data?.results ||
          response.data ||
          [];


        setRecords(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          "Medical records load error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load medical records."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    };


  useEffect(() => {

    fetchRecords();

  }, []);


  const filteredRecords =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        if (!text) {

          return records;

        }


        return records.filter(
          (
            record
          ) => {

            const patient =
              (
                record.patient_name ||
                ""
              ).toLowerCase();


            const diagnosis =
              (
                record.diagnosis ||
                ""
              ).toLowerCase();


            const symptoms =
              (
                record.symptoms ||
                ""
              ).toLowerCase();


            const notes =
              (
                record.clinical_notes ||
                ""
              ).toLowerCase();


            return (
              patient.includes(text) ||
              diagnosis.includes(text) ||
              symptoms.includes(text) ||
              notes.includes(text)
            );

          }
        );

      },
      [
        records,
        search,
      ]
    );


  const formatDate =
    (
      value
    ) => {

      if (!value) {

        return "-";

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

        return value;

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


  if (loading) {

    return (

      <Layout>

        <div className="loading-screen">

          <Loader2
            size={24}
            className="spin"
          />

          Loading medical records...

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      <div className="page-content">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              DOCTOR
            </p>


            <h1>
              Medical Records
            </h1>


            <p className="page-description">

              Review clinical records created
              from completed patient consultations.

            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            disabled={refreshing}
            onClick={
              () =>
                fetchRecords(
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


        <div className="card">

          <div className="table-toolbar">

            <div className="search-box">

              <Search
                size={18}
              />


              <input
                type="text"
                placeholder="Search patient, diagnosis, symptoms or notes..."
                value={search}
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
                filteredRecords.length
              }

              {" "}

              record(s)

            </div>

          </div>


          {
            filteredRecords.length ===
            0 ? (

              <div className="empty-state">

                <FileHeart
                  size={34}
                />


                <h3>
                  No Medical Records
                </h3>


                <p>

                  Records are created when
                  a doctor completes a consultation.

                </p>

              </div>

            ) : (

              <div className="doctor-history-grid">

                {
                  filteredRecords.map(
                    (
                      record
                    ) => (

                      <div
                        className="card"
                        key={
                          record.id
                        }
                      >

                        <div className="card-header">

                          <div>

                            <h3>

                              <Stethoscope
                                size={17}
                              />

                              {
                                record.diagnosis ||
                                "Diagnosis"
                              }

                            </h3>


                            <p>

                              {
                                formatDate(
                                  record.appointment_date
                                )
                              }

                            </p>

                          </div>

                        </div>


                        <div className="table-user">

                          <div className="table-avatar">

                            <UserRound
                              size={17}
                            />

                          </div>


                          <div>

                            <strong>

                              {
                                record.patient_name ||
                                "Patient"
                              }

                            </strong>


                            <span>

                              Appointment #

                              {
                                typeof record.appointment ===
                                "object"
                                  ? record.appointment?.id
                                  : record.appointment
                              }

                            </span>

                          </div>

                        </div>


                        <div className="patient-history-details">

                          <div>

                            <span>
                              Symptoms
                            </span>


                            <p>

                              {
                                record.symptoms ||
                                "Not provided"
                              }

                            </p>

                          </div>


                          <div>

                            <span>
                              Diagnosis
                            </span>


                            <p>

                              {
                                record.diagnosis ||
                                "Not provided"
                              }

                            </p>

                          </div>


                          <div>

                            <span>
                              Clinical Notes
                            </span>


                            <p>

                              {
                                record.clinical_notes ||
                                "No clinical notes."
                              }

                            </p>

                          </div>


                          <div>

                            <span>
                              Follow-up
                            </span>


                            <p>

                              <CalendarDays
                                size={13}
                              />

                              {" "}

                              {
                                record.follow_up_date
                                  ? formatDate(
                                      record.follow_up_date
                                    )
                                  : "Not scheduled"
                              }

                            </p>

                          </div>

                        </div>

                      </div>

                    )
                  )
                }

              </div>

            )
          }

        </div>

      </div>

    </Layout>

  );

}


export default MedicalRecords;

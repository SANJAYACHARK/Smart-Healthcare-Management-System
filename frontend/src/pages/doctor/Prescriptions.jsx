import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Loader2,
  Pill,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function Prescriptions() {

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


  const [
    search,
    setSearch,
  ] = useState("");


  const fetchPrescriptions =
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
            "/medical-records/doctor/prescriptions/"
          );


        const data =
          response.data?.results ||
          response.data ||
          [];


        setPrescriptions(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          "Prescription page error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load prescriptions."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    };


  useEffect(() => {

    fetchPrescriptions();

  }, []);


  const filteredPrescriptions =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        if (!text) {

          return prescriptions;

        }


        return prescriptions.filter(
          (
            item
          ) => {

            const patient =
              (
                item.patient_name ||
                ""
              ).toLowerCase();


            const diagnosis =
              (
                item.diagnosis ||
                ""
              ).toLowerCase();


            const advice =
              (
                item.advice ||
                ""
              ).toLowerCase();


            const medicineMatch =
              item.medicines
                ?.some(
                  (
                    medicine
                  ) =>
                    (
                      medicine.medicine_name ||
                      ""
                    )
                      .toLowerCase()
                      .includes(text)
                );


            return (
              patient.includes(text) ||
              diagnosis.includes(text) ||
              advice.includes(text) ||
              medicineMatch
            );

          }
        );

      },
      [
        prescriptions,
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

          Loading prescriptions...

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
              Prescriptions
            </h1>


            <p className="page-description">

              Review prescriptions and medicines
              created during patient consultations.

            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            disabled={refreshing}
            onClick={
              () =>
                fetchPrescriptions(
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
                placeholder="Search patient, diagnosis, advice or medicine..."
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
                filteredPrescriptions.length
              }

              {" "}

              prescription(s)

            </div>

          </div>


          {
            filteredPrescriptions.length ===
            0 ? (

              <div className="empty-state">

                <Pill
                  size={34}
                />


                <h3>
                  No Prescriptions
                </h3>


                <p>

                  Prescriptions are created
                  when medicines are added
                  during consultation.

                </p>

              </div>

            ) : (

              <div className="doctor-history-grid">

                {
                  filteredPrescriptions.map(
                    (
                      prescription
                    ) => (

                      <div
                        className="card"
                        key={
                          prescription.id
                        }
                      >

                        <div className="card-header">

                          <div>

                            <h3>

                              <Pill
                                size={17}
                              />

                              Prescription #

                              {
                                prescription.id
                              }

                            </h3>


                            <p>

                              <CalendarDays
                                size={13}
                              />

                              {" "}

                              {
                                formatDate(
                                  prescription.appointment_date
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
                                prescription.patient_name ||
                                "Patient"
                              }

                            </strong>


                            <span>

                              <Stethoscope
                                size={12}
                              />

                              {" "}

                              {
                                prescription.diagnosis ||
                                "-"
                              }

                            </span>

                          </div>

                        </div>


                        <div className="patient-history-details">

                          <div>

                            <span>
                              Doctor Advice
                            </span>


                            <p>

                              {
                                prescription.advice ||
                                "No additional advice."
                              }

                            </p>

                          </div>

                        </div>


                        {
                          prescription.medicines
                            ?.length >
                          0 ? (

                            <div className="patient-medicine-list">

                              {
                                prescription.medicines.map(
                                  (
                                    medicine
                                  ) => (

                                    <div
                                      className="patient-medicine-item"
                                      key={
                                        medicine.id
                                      }
                                    >

                                      <strong>

                                        {
                                          medicine.medicine_name
                                        }

                                      </strong>


                                      <span>

                                        {
                                          medicine.dosage
                                        }

                                        {" • "}

                                        {
                                          medicine.frequency
                                        }

                                        {" • "}

                                        {
                                          medicine.duration
                                        }

                                      </span>


                                      {
                                        medicine.food_instruction && (

                                          <small>

                                            {
                                              medicine.food_instruction
                                            }

                                          </small>

                                        )
                                      }


                                      {
                                        medicine.notes && (

                                          <small>

                                            {
                                              medicine.notes
                                            }

                                          </small>

                                        )
                                      }

                                    </div>

                                  )
                                )
                              }

                            </div>

                          ) : (

                            <div className="empty-state">

                              <Pill
                                size={24}
                              />

                              <p>
                                No medicines.
                              </p>

                            </div>

                          )
                        }

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


export default Prescriptions;

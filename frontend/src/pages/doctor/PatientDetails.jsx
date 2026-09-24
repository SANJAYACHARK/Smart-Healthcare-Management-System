import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileHeart,
  Loader2,
  Mail,
  Pill,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function PatientDetails() {

  const navigate =
    useNavigate();


  const {
    patientId,
  } = useParams();


  // =========================================================
  // STATE
  // =========================================================

  const [
    patientData,
    setPatientData,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // =========================================================
  // LOAD PATIENT HISTORY
  // =========================================================

  const fetchPatientData =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await api.get(
            `/medical-records/doctor/patients/${patientId}/`
          );


        setPatientData(
          response.data
        );

      } catch (err) {

        console.error(
          "Patient details error:",
          err
        );


        setPatientData(
          null
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load patient details."
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    if (patientId) {

      fetchPatientData();

    }

  }, [
    patientId,
  ]);


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
            size={25}
            className="spin"
          />

          Loading patient history...

        </div>

      </Layout>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (
    !patientData
  ) {

    return (

      <Layout>

        <div className="page-content">


          <div className="error-message">

            {
              error ||
              "Patient not found."
            }

          </div>


          <button
            type="button"
            className="btn-secondary"
            onClick={
              () =>
                navigate(
                  "/doctor/patients"
                )
            }
          >

            <ArrowLeft
              size={16}
            />

            Back to Patients

          </button>

        </div>

      </Layout>

    );

  }


  // =========================================================
  // DATA
  // =========================================================

  const patient =
    patientData.patient ||
    {};


  const stats =
    patientData.stats ||
    {};


  const appointments =
    patientData.appointments ||
    [];


  const medicalRecords =
    patientData.medical_records ||
    [];


  const prescriptions =
    patientData.prescriptions ||
    [];


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <Layout>

      <div className="page-content">


        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="page-header">


          <button
            type="button"
            className="consultation-back-btn"
            onClick={
              () =>
                navigate(
                  "/doctor/patients"
                )
            }
          >

            <ArrowLeft
              size={16}
            />

            My Patients

          </button>


          <p className="page-eyebrow">

            PATIENT HISTORY

          </p>


          <h1>

            {
              patient.name ||
              "Patient"
            }

          </h1>


          <p className="page-description">

            Review appointment history,
            medical records, diagnoses,
            prescriptions and medicines.

          </p>

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
            PATIENT INFORMATION
        ===================================================== */}

        <div className="card">

          <div className="table-user">

            <div className="table-avatar">

              <UserRound
                size={21}
              />

            </div>


            <div>

              <strong>

                {
                  patient.name ||
                  "Patient"
                }

              </strong>


              <span>

                <Mail
                  size={12}
                />

                {" "}

                {
                  patient.email ||
                  patient.username ||
                  "-"
                }

              </span>

            </div>

          </div>

        </div>


        {/* ====================================================
            KPI CARDS
        ===================================================== */}

        <div
          className="dashboard-grid"
          style={{
            marginTop:
              "20px",
          }}
        >


          <div className="card">

            <div className="kpi-card">

              <div className="kpi-icon">

                <CalendarDays
                  size={22}
                />

              </div>


              <div>

                <span className="kpi-label">

                  Appointments

                </span>


                <h2>

                  {
                    stats
                      .total_appointments ||
                    0
                  }

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

                  Completed

                </span>


                <h2>

                  {
                    stats
                      .completed_appointments ||
                    0
                  }

                </h2>

              </div>

            </div>

          </div>


          <div className="card">

            <div className="kpi-card">

              <div className="kpi-icon">

                <FileHeart
                  size={22}
                />

              </div>


              <div>

                <span className="kpi-label">

                  Medical Records

                </span>


                <h2>

                  {
                    stats
                      .medical_records ||
                    0
                  }

                </h2>

              </div>

            </div>

          </div>


          <div className="card">

            <div className="kpi-card">

              <div className="kpi-icon">

                <Pill
                  size={22}
                />

              </div>


              <div>

                <span className="kpi-label">

                  Prescriptions

                </span>


                <h2>

                  {
                    stats
                      .prescriptions ||
                    0
                  }

                </h2>

              </div>

            </div>

          </div>


        </div>


        {/* ====================================================
            MEDICAL RECORDS
        ===================================================== */}

        <div className="dashboard-section">


          <div className="section-header">

            <div>

              <h2>

                <FileHeart
                  size={19}
                />

                Medical Records

              </h2>


              <p>

                Previous diagnosis and
                consultation findings.

              </p>

            </div>

          </div>


          {
            medicalRecords.length ===
            0 ? (

              <div className="empty-state">

                <FileHeart
                  size={34}
                />


                <h3>

                  No Medical Records

                </h3>


                <p>

                  Medical records will
                  appear after completed
                  consultations.

                </p>

              </div>

            ) : (

              <div className="doctor-history-grid">

                {
                  medicalRecords.map(
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
                                  record
                                    .appointment_date
                                )
                              }

                            </p>

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
                                record
                                  .clinical_notes ||
                                "No clinical notes."
                              }

                            </p>

                          </div>


                          <div>

                            <span>
                              Follow-up Date
                            </span>


                            <p>

                              {
                                record
                                  .follow_up_date
                                  ? formatDate(
                                      record
                                        .follow_up_date
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


        {/* ====================================================
            PRESCRIPTIONS
        ===================================================== */}

        <div className="dashboard-section">


          <div className="section-header">

            <div>

              <h2>

                <Pill
                  size={19}
                />

                Prescriptions

              </h2>


              <p>

                Medicines prescribed during
                previous consultations.

              </p>

            </div>

          </div>


          {
            prescriptions.length ===
            0 ? (

              <div className="empty-state">

                <Pill
                  size={34}
                />


                <h3>

                  No Prescriptions

                </h3>


                <p>

                  Prescribed medicines
                  will appear here.

                </p>

              </div>

            ) : (

              <div className="doctor-history-grid">

                {
                  prescriptions.map(
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

                              Prescription
                              {" #"}
                              {
                                prescription.id
                              }

                            </h3>


                            <p>

                              {
                                formatDate(
                                  prescription
                                    .appointment_date
                                )
                              }

                            </p>

                          </div>

                        </div>


                        <div className="patient-history-details">


                          <div>

                            <span>
                              Diagnosis
                            </span>


                            <p>

                              {
                                prescription
                                  .diagnosis ||
                                "-"
                              }

                            </p>

                          </div>


                          {
                            prescription
                              .advice && (

                              <div>

                                <span>
                                  Doctor Advice
                                </span>


                                <p>

                                  {
                                    prescription
                                      .advice
                                  }

                                </p>

                              </div>

                            )
                          }


                        </div>


                        {
                          prescription
                            .medicines
                            ?.length >
                          0 && (

                            <div className="patient-medicine-list">

                              {
                                prescription
                                  .medicines
                                  .map(
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
                                            medicine
                                              .medicine_name
                                          }

                                        </strong>


                                        <span>

                                          {
                                            medicine
                                              .dosage
                                          }

                                          {" • "}

                                          {
                                            medicine
                                              .frequency
                                          }

                                          {" • "}

                                          {
                                            medicine
                                              .duration
                                          }

                                        </span>


                                        {
                                          medicine
                                            .food_instruction && (

                                            <small>

                                              {
                                                medicine
                                                  .food_instruction
                                              }

                                            </small>

                                          )
                                        }


                                        {
                                          medicine
                                            .notes && (

                                            <small>

                                              {
                                                medicine
                                                  .notes
                                              }

                                            </small>

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

                    )
                  )
                }

              </div>

            )
          }

        </div>


        {/* ====================================================
            APPOINTMENT HISTORY
        ===================================================== */}

        <div className="dashboard-section">


          <div className="section-header">

            <div>

              <h2>

                <ClipboardList
                  size={19}
                />

                Appointment History

              </h2>


              <p>

                All appointments between
                you and this patient.

              </p>

            </div>

          </div>


          {
            appointments.length ===
            0 ? (

              <div className="empty-state">

                <CalendarDays
                  size={34}
                />


                <h3>
                  No Appointments
                </h3>

              </div>

            ) : (

              <div className="card">

                <div className="table-responsive">

                  <table className="data-table">

                    <thead>

                      <tr>

                        <th>
                          Appointment
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

                      </tr>

                    </thead>


                    <tbody>

                      {
                        appointments.map(
                          (
                            appointment
                          ) => (

                            <tr
                              key={
                                appointment.id
                              }
                            >


                              <td>

                                <div className="table-secondary">

                                  <ClipboardList
                                    size={14}
                                  />

                                  #

                                  {
                                    appointment.id
                                  }

                                </div>

                              </td>


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


                              <td>

                                {
                                  appointment.reason ||
                                  "-"
                                }

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


      </div>

    </Layout>

  );

}


export default PatientDetails;
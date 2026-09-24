import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  Clock3,
  FileHeart,
  Loader2,
  Pill,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Layout from "../../components/layout/Layout";

import api from "../../api/axios";


function Consultation() {

  const {
    appointmentId,
  } = useParams();


  const navigate =
    useNavigate();


  /* ========================================================
     STATE
  ======================================================== */

  const [
    appointment,
    setAppointment,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    symptoms,
    setSymptoms,
  ] = useState("");


  const [
    diagnosis,
    setDiagnosis,
  ] = useState("");


  const [
    clinicalNotes,
    setClinicalNotes,
  ] = useState("");


  const [
    followUpDate,
    setFollowUpDate,
  ] = useState("");


  const [
    advice,
    setAdvice,
  ] = useState("");


  const [
    medicines,
    setMedicines,
  ] = useState([]);


  /* ========================================================
     LOAD APPOINTMENT
  ======================================================== */

  const loadAppointment =
    async () => {

      try {

        setLoading(true);
        setError("");


        const response =
          await api.get(
            `/appointments/doctor/${appointmentId}/`
          );


        setAppointment(
          response.data
        );

      } catch (err) {

        console.error(
          "Consultation appointment error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load appointment."
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    if (appointmentId) {

      loadAppointment();

    }

  }, [
    appointmentId,
  ]);


  /* ========================================================
     HELPERS
  ======================================================== */

  const formatDate =
    (date) => {

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
    (time) => {

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
    (status) => {

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
          (letter) =>
            letter.toUpperCase()
        );

    };


  /* ========================================================
     MEDICINES
  ======================================================== */

  const addMedicine =
    () => {

      setMedicines(
        (
          current
        ) => [
          ...current,
          {
            medicine_name:
              "",

            dosage:
              "",

            frequency:
              "",

            duration:
              "",

            food_instruction:
              "",

            notes:
              "",
          },
        ]
      );

    };


  const removeMedicine =
    (
      index
    ) => {

      setMedicines(
        (
          current
        ) =>
          current.filter(
            (
              _,
              medicineIndex
            ) =>
              medicineIndex !==
              index
          )
      );

    };


  const updateMedicine =
    (
      index,
      field,
      value
    ) => {

      setMedicines(
        (
          current
        ) =>
          current.map(
            (
              medicine,
              medicineIndex
            ) => {

              if (
                medicineIndex !==
                index
              ) {

                return medicine;

              }


              return {
                ...medicine,
                [field]:
                  value,
              };

            }
          )
      );

    };


  /* ========================================================
     VALIDATION
  ======================================================== */

  const validateForm =
    () => {

      if (
        !symptoms.trim()
      ) {

        setError(
          "Please enter patient symptoms."
        );

        return false;

      }


      if (
        !diagnosis.trim()
      ) {

        setError(
          "Please enter diagnosis."
        );

        return false;

      }


      for (
        let index = 0;
        index < medicines.length;
        index += 1
      ) {

        const medicine =
          medicines[index];


        if (
          !medicine
            .medicine_name
            .trim()
        ) {

          setError(
            `Medicine ${
              index + 1
            }: medicine name is required.`
          );

          return false;

        }


        if (
          !medicine
            .dosage
            .trim()
        ) {

          setError(
            `Medicine ${
              index + 1
            }: dosage is required.`
          );

          return false;

        }


        if (
          !medicine
            .frequency
            .trim()
        ) {

          setError(
            `Medicine ${
              index + 1
            }: frequency is required.`
          );

          return false;

        }


        if (
          !medicine
            .duration
            .trim()
        ) {

          setError(
            `Medicine ${
              index + 1
            }: duration is required.`
          );

          return false;

        }

      }


      return true;

    };


  /* ========================================================
     COMPLETE CONSULTATION
  ======================================================== */

  const handleComplete =
    async () => {

      if (
        !validateForm()
      ) {

        return;

      }


      if (
        appointment?.status !==
        "IN_CONSULTATION"
      ) {

        setError(
          "This appointment must be in consultation before it can be completed."
        );

        return;

      }


      try {

        setSaving(true);
        setError("");
        setSuccess("");


        const payload = {

          appointment:
            Number(
              appointmentId
            ),

          symptoms:
            symptoms.trim(),

          diagnosis:
            diagnosis.trim(),

          clinical_notes:
            clinicalNotes.trim(),

          follow_up_date:
            followUpDate ||
            null,

          advice:
            advice.trim(),

          medicines:
            medicines.map(
              (
                medicine
              ) => ({

                medicine_name:
                  medicine
                    .medicine_name
                    .trim(),

                dosage:
                  medicine
                    .dosage
                    .trim(),

                frequency:
                  medicine
                    .frequency
                    .trim(),

                duration:
                  medicine
                    .duration
                    .trim(),

                food_instruction:
                  medicine
                    .food_instruction
                    .trim(),

                notes:
                  medicine
                    .notes
                    .trim(),

              })
            ),

        };


        const response =
          await api.post(
            "/medical-records/doctor/complete-consultation/",
            payload
          );


        setAppointment(
          (
            current
          ) => ({
            ...current,

            status:
              "COMPLETED",
          })
        );


        setSuccess(
          response.data
            ?.message ||
          "Consultation completed successfully."
        );


        setTimeout(
          () => {

            navigate(
              "/doctor/appointments"
            );

          },
          900
        );

      } catch (err) {

        console.error(
          "Complete consultation error:",
          err
        );


        const responseData =
          err.response
            ?.data;


        let message =
          "Unable to complete consultation.";


        if (
          responseData
            ?.detail
        ) {

          message =
            responseData.detail;

        } else if (
          responseData &&
          typeof responseData ===
            "object"
        ) {

          const firstKey =
            Object.keys(
              responseData
            )[0];


          if (
            firstKey
          ) {

            const value =
              responseData[
                firstKey
              ];


            if (
              Array.isArray(
                value
              )
            ) {

              message =
                value[0];

            } else if (
              typeof value ===
              "string"
            ) {

              message =
                value;

            } else {

              message =
                JSON.stringify(
                  value
                );

            }

          }

        } else if (
          err.message
        ) {

          message =
            err.message;

        }


        setError(
          message
        );

      } finally {

        setSaving(false);

      }

    };


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (

      <Layout>

        <div className="loading-screen">

          <Loader2
            className="spin"
            size={24}
          />

          Loading consultation...

        </div>

      </Layout>

    );

  }


  /* ========================================================
     ERROR WITHOUT APPOINTMENT
  ======================================================== */

  if (
    !appointment
  ) {

    return (

      <Layout>

        <div className="consultation-page">

          <div className="error-message">

            {
              error ||
              "Appointment not found."
            }

          </div>


          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              navigate(
                "/doctor/appointments"
              )
            }
          >

            <ArrowLeft
              size={16}
            />

            Back to Appointments

          </button>

        </div>

      </Layout>

    );

  }


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <Layout>

      <div className="consultation-page">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="consultation-header">

          <div>

            <button
              type="button"
              className="consultation-back-btn"
              onClick={() =>
                navigate(
                  "/doctor/appointments"
                )
              }
            >

              <ArrowLeft
                size={16}
              />

              Appointments

            </button>


            <p className="page-eyebrow">

              DOCTOR CONSULTATION

            </p>


            <h1>
              Patient Consultation
            </h1>


            <p className="page-description">

              Record diagnosis,
              clinical observations,
              medicines and follow-up.

            </p>

          </div>


          <div className="consultation-header-status">

            <span
              className={`status-badge appointment-status-${appointment.status?.toLowerCase()}`}
            >

              {
                formatStatus(
                  appointment.status
                )
              }

            </span>

          </div>

        </div>


        {/* ==================================================
            MESSAGES
        ================================================== */}

        {error && (

          <div className="error-message">

            {error}

          </div>

        )}


        {success && (

          <div className="success-message">

            <CheckCircle2
              size={17}
            />

            {success}

          </div>

        )}


        {/* ==================================================
            PATIENT OVERVIEW
        ================================================== */}

        <div className="consultation-patient-card">

          <div className="consultation-patient-avatar">

            <UserRound
              size={26}
            />

          </div>


          <div className="consultation-patient-main">

            <span>
              Patient
            </span>

            <h2>

              {
                appointment
                  .patient_name ||
                "Patient"
              }

            </h2>


            {
              appointment
                .patient_email && (

                <p>

                  {
                    appointment
                      .patient_email
                  }

                </p>

              )
            }

          </div>


          <div className="consultation-patient-meta">

            <div>

              <CalendarDays
                size={16}
              />

              <span>

                {
                  formatDate(
                    appointment
                      .appointment_date
                  )
                }

              </span>

            </div>


            <div>

              <Clock3
                size={16}
              />

              <span>

                {
                  formatTime(
                    appointment
                      .appointment_time
                  )
                }

              </span>

            </div>


            <div>

              <Stethoscope
                size={16}
              />

              <span>

                {
                  appointment
                    .doctor_specialization ||
                  "Consultation"
                }

              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            REASON
        ================================================== */}

        <div className="consultation-reason-card">

          <div className="consultation-section-icon">

            <Activity
              size={18}
            />

          </div>


          <div>

            <span>
              Appointment Reason
            </span>

            <strong>

              {
                appointment.reason ||
                "No reason provided."
              }

            </strong>

          </div>

        </div>


        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <div className="consultation-grid">


          {/* =================================================
              CLINICAL DETAILS
          ================================================= */}

          <div className="consultation-card">

            <div className="consultation-card-header">

              <div className="consultation-card-title-icon">

                <FileHeart
                  size={18}
                />

              </div>


              <div>

                <h3>
                  Clinical Assessment
                </h3>

                <p>
                  Record the patient's
                  examination and diagnosis.
                </p>

              </div>

            </div>


            <div className="consultation-form">


              {/* SYMPTOMS */}

              <div className="form-group">

                <label>
                  Symptoms *
                </label>


                <textarea
                  rows="4"
                  value={symptoms}
                  disabled={
                    appointment.status ===
                    "COMPLETED"
                  }
                  placeholder="Enter symptoms reported by the patient..."
                  onChange={
                    (
                      event
                    ) =>
                      setSymptoms(
                        event
                          .target
                          .value
                      )
                  }
                />

              </div>


              {/* DIAGNOSIS */}

              <div className="form-group">

                <label>
                  Diagnosis *
                </label>


                <textarea
                  rows="4"
                  value={diagnosis}
                  disabled={
                    appointment.status ===
                    "COMPLETED"
                  }
                  placeholder="Enter diagnosis..."
                  onChange={
                    (
                      event
                    ) =>
                      setDiagnosis(
                        event
                          .target
                          .value
                      )
                  }
                />

              </div>


              {/* CLINICAL NOTES */}

              <div className="form-group">

                <label>
                  Clinical Notes
                </label>


                <textarea
                  rows="5"
                  value={
                    clinicalNotes
                  }
                  disabled={
                    appointment.status ===
                    "COMPLETED"
                  }
                  placeholder="Examination findings, observations and additional notes..."
                  onChange={
                    (
                      event
                    ) =>
                      setClinicalNotes(
                        event
                          .target
                          .value
                      )
                  }
                />

              </div>


              {/* FOLLOW UP */}

              <div className="form-group">

                <label>
                  Follow-up Date
                </label>


                <input
                  type="date"
                  value={
                    followUpDate
                  }
                  disabled={
                    appointment.status ===
                    "COMPLETED"
                  }
                  min={
                    new Date()
                      .toISOString()
                      .split(
                        "T"
                      )[0]
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setFollowUpDate(
                        event
                          .target
                          .value
                      )
                  }
                />

              </div>

            </div>

          </div>


          {/* =================================================
              CONSULTATION SUMMARY
          ================================================= */}

          <div className="consultation-card consultation-summary-card">

            <div className="consultation-card-header">

              <div className="consultation-card-title-icon">

                <ClipboardPlus
                  size={18}
                />

              </div>


              <div>

                <h3>
                  Consultation Summary
                </h3>

                <p>
                  Current appointment details.
                </p>

              </div>

            </div>


            <div className="consultation-summary-list">


              <div className="consultation-summary-item">

                <span>
                  Patient
                </span>

                <strong>

                  {
                    appointment
                      .patient_name ||
                    "-"
                  }

                </strong>

              </div>


              <div className="consultation-summary-item">

                <span>
                  Appointment
                </span>

                <strong>

                  #{appointment.id}

                </strong>

              </div>


              <div className="consultation-summary-item">

                <span>
                  Date
                </span>

                <strong>

                  {
                    formatDate(
                      appointment
                        .appointment_date
                    )
                  }

                </strong>

              </div>


              <div className="consultation-summary-item">

                <span>
                  Time
                </span>

                <strong>

                  {
                    formatTime(
                      appointment
                        .appointment_time
                    )
                  }

                </strong>

              </div>


              <div className="consultation-summary-item">

                <span>
                  Medicines
                </span>

                <strong>

                  {
                    medicines.length
                  }

                </strong>

              </div>


              <div className="consultation-summary-item">

                <span>
                  Follow-up
                </span>

                <strong>

                  {
                    followUpDate
                      ? formatDate(
                          followUpDate
                        )
                      : "Not scheduled"
                  }

                </strong>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            PRESCRIPTION
        ================================================== */}

        <div className="consultation-card consultation-prescription-card">

          <div className="consultation-card-header consultation-prescription-header">

            <div className="consultation-card-title">

              <div className="consultation-card-title-icon">

                <Pill
                  size={18}
                />

              </div>


              <div>

                <h3>
                  Prescription
                </h3>

                <p>
                  Add prescribed medicines
                  for this consultation.
                </p>

              </div>

            </div>


            {
              appointment.status !==
              "COMPLETED" && (

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    addMedicine
                  }
                >

                  <Plus
                    size={15}
                  />

                  Add Medicine

                </button>

              )
            }

          </div>


          {
            medicines.length ===
            0 ? (

              <div className="consultation-empty-medicine">

                <div>

                  <Pill
                    size={25}
                  />

                </div>


                <h4>
                  No medicines added
                </h4>


                <p>
                  Prescription is optional.
                  Add medicine if required.
                </p>


                {
                  appointment.status !==
                  "COMPLETED" && (

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={
                        addMedicine
                      }
                    >

                      <Plus
                        size={15}
                      />

                      Add Medicine

                    </button>

                  )
                }

              </div>

            ) : (

              <div className="medicine-list">

                {
                  medicines.map(
                    (
                      medicine,
                      index
                    ) => (

                      <div
                        className="medicine-card"
                        key={index}
                      >

                        <div className="medicine-card-header">

                          <div>

                            <span>
                              Medicine
                            </span>

                            <strong>

                              {
                                index + 1
                              }

                            </strong>

                          </div>


                          {
                            appointment.status !==
                            "COMPLETED" && (

                              <button
                                type="button"
                                className="btn-icon-danger"
                                onClick={() =>
                                  removeMedicine(
                                    index
                                  )
                                }
                              >

                                <Trash2
                                  size={16}
                                />

                              </button>

                            )
                          }

                        </div>


                        <div className="medicine-form-grid">


                          <div className="form-group medicine-name-field">

                            <label>
                              Medicine Name *
                            </label>


                            <input
                              type="text"
                              value={
                                medicine
                                  .medicine_name
                              }
                              disabled={
                                appointment.status ===
                                "COMPLETED"
                              }
                              placeholder="Example: Paracetamol 500mg"
                              onChange={
                                (
                                  event
                                ) =>
                                  updateMedicine(
                                    index,
                                    "medicine_name",
                                    event
                                      .target
                                      .value
                                  )
                              }
                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Dosage *
                            </label>


                            <input
                              type="text"
                              value={
                                medicine
                                  .dosage
                              }
                              disabled={
                                appointment.status ===
                                "COMPLETED"
                              }
                              placeholder="1 tablet"
                              onChange={
                                (
                                  event
                                ) =>
                                  updateMedicine(
                                    index,
                                    "dosage",
                                    event
                                      .target
                                      .value
                                  )
                              }
                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Frequency *
                            </label>


                            <select
                              value={
                                medicine
                                  .frequency
                              }
                              disabled={
                                appointment.status ===
                                "COMPLETED"
                              }
                              onChange={
                                (
                                  event
                                ) =>
                                  updateMedicine(
                                    index,
                                    "frequency",
                                    event
                                      .target
                                      .value
                                  )
                              }
                            >

                              <option value="">
                                Select
                              </option>

                              <option value="Once daily">
                                Once daily
                              </option>

                              <option value="Twice daily">
                                Twice daily
                              </option>

                              <option value="Three times daily">
                                Three times daily
                              </option>

                              <option value="Four times daily">
                                Four times daily
                              </option>

                              <option value="At bedtime">
                                At bedtime
                              </option>

                              <option value="As needed">
                                As needed
                              </option>

                            </select>

                          </div>


                          <div className="form-group">

                            <label>
                              Duration *
                            </label>


                            <input
                              type="text"
                              value={
                                medicine
                                  .duration
                              }
                              disabled={
                                appointment.status ===
                                "COMPLETED"
                              }
                              placeholder="5 days"
                              onChange={
                                (
                                  event
                                ) =>
                                  updateMedicine(
                                    index,
                                    "duration",
                                    event
                                      .target
                                      .value
                                  )
                              }
                            />

                          </div>


                          <div className="form-group">

                            <label>
                              Food Instruction
                            </label>


                            <select
                              value={
                                medicine
                                  .food_instruction
                              }
                              disabled={
                                appointment.status ===
                                "COMPLETED"
                              }
                              onChange={
                                (
                                  event
                                ) =>
                                  updateMedicine(
                                    index,
                                    "food_instruction",
                                    event
                                      .target
                                      .value
                                  )
                              }
                            >

                              <option value="">
                                Not specified
                              </option>

                              <option value="Before food">
                                Before food
                              </option>

                              <option value="After food">
                                After food
                              </option>

                              <option value="With food">
                                With food
                              </option>

                              <option value="Empty stomach">
                                Empty stomach
                              </option>

                            </select>

                          </div>


                          <div className="form-group medicine-notes-field">

                            <label>
                              Medicine Notes
                            </label>


                            <input
                              type="text"
                              value={
                                medicine
                                  .notes
                              }
                              disabled={
                                appointment.status ===
                                "COMPLETED"
                              }
                              placeholder="Optional instructions"
                              onChange={
                                (
                                  event
                                ) =>
                                  updateMedicine(
                                    index,
                                    "notes",
                                    event
                                      .target
                                      .value
                                  )
                              }
                            />

                          </div>

                        </div>

                      </div>

                    )
                  )
                }

              </div>

            )
          }


          {
            medicines.length >
            0 && (

              <div className="form-group consultation-advice">

                <label>
                  Prescription Advice
                </label>


                <textarea
                  rows="3"
                  value={advice}
                  disabled={
                    appointment.status ===
                    "COMPLETED"
                  }
                  placeholder="General medicine instructions, diet advice, precautions..."
                  onChange={
                    (
                      event
                    ) =>
                      setAdvice(
                        event
                          .target
                          .value
                      )
                  }
                />

              </div>

            )
          }

        </div>


        {/* ==================================================
            ACTION BAR
        ================================================== */}

        <div className="consultation-action-bar">

          <div>

            <span>
              Consultation Status
            </span>

            <strong>

              {
                formatStatus(
                  appointment.status
                )
              }

            </strong>

          </div>


          <div className="consultation-actions">

            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={() =>
                navigate(
                  "/doctor/appointments"
                )
              }
            >

              Cancel

            </button>


            {
              appointment.status ===
              "IN_CONSULTATION" && (

                <button
                  type="button"
                  className="btn-primary consultation-complete-btn"
                  disabled={saving}
                  onClick={
                    handleComplete
                  }
                >

                  {
                    saving ? (

                      <>

                        <Loader2
                          size={16}
                          className="spin"
                        />

                        Saving...

                      </>

                    ) : (

                      <>

                        <Save
                          size={16}
                        />

                        Complete Consultation

                      </>

                    )
                  }

                </button>

              )
            }


            {
              appointment.status ===
              "COMPLETED" && (

                <div className="consultation-completed-label">

                  <CheckCircle2
                    size={17}
                  />

                  Consultation Completed

                </div>

              )
            }

          </div>

        </div>

      </div>

    </Layout>

  );

}


export default Consultation;
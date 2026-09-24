import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Building2,
  CalendarDays,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import {
  useLocation,
  useSearchParams,
} from "react-router-dom";

import Layout from "../../components/layout/Layout";
import api from "../../api/axios";


function Appointments() {
  // ========================================================
  // ROUTER
  // ========================================================

  const location = useLocation();

  const [searchParams] =
    useSearchParams();

  const aiDoctorId =
    searchParams.get("doctor");

  const shouldAutoBook =
    searchParams.get("book") === "1";

  const aiSuggestedSlot =
    location.state?.suggestedSlot || null;

  const aiSuggestedDoctor =
    location.state?.suggestedDoctor || null;

  const shouldOpenDoctorDetails =
    Boolean(
      location.state?.openDoctorDetails
    );


  // Prevent React StrictMode or data refresh
  // from reopening the AI modal repeatedly.

  const aiActionHandled =
    useRef(false);

  // Prevent AI slot restoration after
  // patient manually changes the date.

  const aiSlotHandled =
    useRef(false);


  // ========================================================
  // STATE
  // ========================================================

  const [
    departments,
    setDepartments,
  ] = useState([]);

  const [
    doctors,
    setDoctors,
  ] = useState([]);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    selectedDepartment,
    setSelectedDepartment,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    bookingSubmitting,
    setBookingSubmitting,
  ] = useState(false);

  const [
    cancellingId,
    setCancellingId,
  ] = useState(null);


  // ========================================================
  // BOOKING MODAL
  // ========================================================

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    selectedDoctor,
    setSelectedDoctor,
  ] = useState(null);

  const [
    isAiBooking,
    setIsAiBooking,
  ] = useState(false);


  // ========================================================
  // DOCTOR DETAILS MODAL
  // ========================================================

  const [
    showDoctorModal,
    setShowDoctorModal,
  ] = useState(false);


  // ========================================================
  // AVAILABLE SLOTS
  // ========================================================

  const [
    availableSlots,
    setAvailableSlots,
  ] = useState([]);

  const [
    loadingSlots,
    setLoadingSlots,
  ] = useState(false);


  // ========================================================
  // BOOKING FORM
  // ========================================================

  const [
    formData,
    setFormData,
  ] = useState({
    appointment_date: "",
    appointment_time: "",
    reason: "",
  });


  // ========================================================
  // HELPERS
  // ========================================================

  const getResults = (
    response
  ) => {
    const data =
      response?.data;

    if (Array.isArray(data)) {
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


  const getErrorMessage = (
    err,
    fallback
  ) => {
    const data =
      err.response?.data;

    if (data?.detail) {
      return data.detail;
    }

    if (
      Array.isArray(
        data?.appointment_time
      )
    ) {
      return data
        .appointment_time
        .join(" ");
    }

    if (
      data?.appointment_time
    ) {
      return data.appointment_time;
    }

    if (
      Array.isArray(
        data?.appointment_date
      )
    ) {
      return data
        .appointment_date
        .join(" ");
    }

    if (
      data?.appointment_date
    ) {
      return data.appointment_date;
    }

    if (
      Array.isArray(
        data?.non_field_errors
      )
    ) {
      return data
        .non_field_errors
        .join(" ");
    }

    return fallback;
  };


  const normalizeTime = (
    value
  ) => {
    if (!value) {
      return "";
    }

    return String(value)
      .split(":")
      .slice(0, 2)
      .join(":");
  };


  const getTodayDate = () => {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  };


  const today =
    getTodayDate();


  const formatTime = (
    time
  ) => {
    if (!time) {
      return "-";
    }

    const normalized =
      normalizeTime(time);

    const [
      hours,
      minutes,
    ] = normalized.split(":");

    const date =
      new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      [],
      {
        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );
  };


  // ========================================================
  // LOAD PAGE DATA
  // ========================================================

  const fetchData =
    async (
      showRefresh = false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          departmentResponse,
          doctorResponse,
          appointmentResponse,
        ] =
          await Promise.all([
            api.get(
              "/departments/"
            ),

            api.get(
              "/appointments/doctors/"
            ),

            api.get(
              "/appointments/my/"
            ),
          ]);

        setDepartments(
          getResults(
            departmentResponse
          )
        );

        setDoctors(
          getResults(
            doctorResponse
          )
        );

        setAppointments(
          getResults(
            appointmentResponse
          )
        );

        setError("");
      } catch (err) {
        console.error(
          "Appointment page load error:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load appointment information."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };


  useEffect(() => {
    fetchData();
  }, []);


  // ========================================================
  // FETCH AVAILABLE SLOTS
  // ========================================================

  const fetchAvailableSlots =
    async (
      doctorId,
      date
    ) => {
      if (
        !doctorId ||
        !date
      ) {
        setAvailableSlots(
          []
        );

        return [];
      }

      try {
        setLoadingSlots(true);

        setAvailableSlots(
          []
        );

        setError("");

        const response =
          await api.get(
            `/appointments/doctors/${doctorId}/slots/`,
            {
              params: {
                date,
              },
            }
          );

        const slots =
          response.data
            ?.available_slots ||
          [];

        setAvailableSlots(
          slots
        );

        return slots;
      } catch (err) {
        console.error(
          "Available slots error:",
          err
        );

        setAvailableSlots(
          []
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load available time slots."
          )
        );

        return [];
      } finally {
        setLoadingSlots(false);
      }
    };


  // ========================================================
  // OPEN BOOKING MODAL
  // ========================================================

  const openBookingModal = (
    doctor,
    options = {}
  ) => {
    const {
      aiBooking = false,
    } = options;

    setSelectedDoctor(
      doctor
    );

    setShowDoctorModal(
      false
    );

    setAvailableSlots(
      []
    );

    setFormData({
      appointment_date: "",
      appointment_time: "",
      reason: "",
    });

    setIsAiBooking(
      aiBooking
    );

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // ========================================================
  // CLOSE BOOKING MODAL
  // ========================================================

  const closeBookingModal =
    () => {
      setShowModal(false);

      setSelectedDoctor(
        null
      );

      setAvailableSlots(
        []
      );

      setFormData({
        appointment_date: "",
        appointment_time: "",
        reason: "",
      });

      setIsAiBooking(
        false
      );

      setError("");
    };


  // ========================================================
  // OPEN DOCTOR DETAILS
  // ========================================================

  const openDoctorDetails =
    (doctor) => {
      setSelectedDoctor(
        doctor
      );

      setShowDoctorModal(
        true
      );

      setShowModal(false);

      setError("");
    };


  // ========================================================
  // CLOSE DOCTOR DETAILS
  // ========================================================

  const closeDoctorDetails =
    () => {
      setShowDoctorModal(
        false
      );

      setSelectedDoctor(
        null
      );
    };


  // ========================================================
  // HANDLE AI SUGGESTED DOCTOR
  // ========================================================

  useEffect(() => {
    if (
      doctors.length === 0 ||
      aiActionHandled.current
    ) {
      return;
    }


    let suggestedDoctor =
      null;


    if (aiDoctorId) {
      suggestedDoctor =
        doctors.find(
          (doctor) =>
            String(
              doctor.id
            ) ===
            String(
              aiDoctorId
            )
        );
    }


    if (
      !suggestedDoctor &&
      aiSuggestedDoctor
    ) {
      suggestedDoctor =
        aiSuggestedDoctor;
    }


    if (!suggestedDoctor) {
      return;
    }


    if (
      suggestedDoctor.department
    ) {
      setSelectedDepartment(
        String(
          suggestedDoctor.department
        )
      );
    }


    aiActionHandled.current =
      true;


    // ======================================================
    // AI BOOK NEXT SLOT
    // ======================================================

    if (shouldAutoBook) {
      openBookingModal(
        suggestedDoctor,
        {
          aiBooking: true,
        }
      );


      if (
        aiSuggestedSlot?.date
      ) {
        aiSlotHandled.current =
          false;


        setFormData({
          appointment_date:
            aiSuggestedSlot.date,

          appointment_time:
            "",

          reason:
            "",
        });


        fetchAvailableSlots(
          suggestedDoctor.id,
          aiSuggestedSlot.date
        );
      }

      return;
    }


    // ======================================================
    // AI VIEW DOCTOR
    // ======================================================

    if (
      shouldOpenDoctorDetails
    ) {
      openDoctorDetails(
        suggestedDoctor
      );
    }
  }, [
    doctors,
    aiDoctorId,
    shouldAutoBook,
    shouldOpenDoctorDetails,
    aiSuggestedDoctor,
    aiSuggestedSlot,
  ]);


  // ========================================================
  // RESTORE AI SLOT AFTER SLOT API LOADS
  // ========================================================

  useEffect(() => {
    if (
      !isAiBooking ||
      aiSlotHandled.current ||
      !aiSuggestedSlot?.time ||
      !aiSuggestedSlot?.date ||
      availableSlots.length === 0 ||
      formData.appointment_date !==
        aiSuggestedSlot.date
    ) {
      return;
    }


    const suggestedTime =
      normalizeTime(
        aiSuggestedSlot.time
      );


    const matchingSlot =
      availableSlots.find(
        (slot) =>
          normalizeTime(
            slot
          ) ===
          suggestedTime
      );


    if (matchingSlot) {
      setFormData(
        (previous) => ({
          ...previous,

          appointment_time:
            matchingSlot,
        })
      );
    }


    aiSlotHandled.current =
      true;
  }, [
    availableSlots,
    aiSuggestedSlot,
    isAiBooking,
    formData.appointment_date,
  ]);


  // ========================================================
  // FILTER DOCTORS
  // ========================================================

  const filteredDoctors =
    useMemo(() => {
      return doctors.filter(
        (doctor) => {
          const fullName =
            `${
              doctor.first_name ||
              ""
            } ${
              doctor.last_name ||
              ""
            }`
              .trim()
              .toLowerCase();


          const searchText =
            search
              .trim()
              .toLowerCase();


          const specialization =
            doctor.specialization
              ?.toLowerCase() ||
            "";


          const departmentName =
            doctor.department_name
              ?.toLowerCase() ||
            "";


          const matchesSearch =
            !searchText ||
            fullName.includes(
              searchText
            ) ||
            specialization.includes(
              searchText
            ) ||
            departmentName.includes(
              searchText
            );


          const matchesDepartment =
            !selectedDepartment ||
            String(
              doctor.department
            ) ===
              String(
                selectedDepartment
              );


          return (
            matchesSearch &&
            matchesDepartment &&
            doctor.is_active !==
              false &&
            doctor.is_available ===
              true
          );
        }
      );
    }, [
      doctors,
      search,
      selectedDepartment,
    ]);


  // ========================================================
  // FORM CHANGE
  // ========================================================

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;


      if (
        name ===
        "appointment_date"
      ) {
        // Patient manually changed
        // the date, so AI should no
        // longer force its old slot.

        aiSlotHandled.current =
          true;


        setFormData(
          (previous) => ({
            ...previous,

            appointment_date:
              value,

            appointment_time:
              "",
          })
        );


        if (
          selectedDoctor &&
          value
        ) {
          fetchAvailableSlots(
            selectedDoctor.id,
            value
          );
        }

        return;
      }


      setFormData(
        (previous) => ({
          ...previous,

          [name]:
            value,
        })
      );
    };


  // ========================================================
  // SELECT SLOT
  // ========================================================

  const selectTimeSlot =
    (slot) => {
      aiSlotHandled.current =
        true;

      setFormData(
        (previous) => ({
          ...previous,

          appointment_time:
            slot,
        })
      );
    };


  // ========================================================
  // BOOK APPOINTMENT
  // ========================================================

  const handleBooking =
    async (event) => {
      event.preventDefault();


      if (!selectedDoctor) {
        return;
      }


      if (
        !formData
          .appointment_date
      ) {
        setError(
          "Please select an appointment date."
        );

        return;
      }


      if (
        !formData
          .appointment_time
      ) {
        setError(
          "Please select an available time slot."
        );

        return;
      }


      if (
        !formData.reason.trim()
      ) {
        setError(
          "Please enter the reason for consultation."
        );

        return;
      }


      try {
        setBookingSubmitting(true);
        setError("");
        setSuccess("");


        await api.post(
          "/appointments/book/",
          {
            doctor_id:
              selectedDoctor.id,

            appointment_date:
              formData
                .appointment_date,

            appointment_time:
              formData
                .appointment_time,

            reason:
              formData.reason.trim(),
          }
        );


        closeBookingModal();


        setSuccess(
          "Appointment booked successfully."
        );


        await fetchData();
      } catch (err) {
        console.error(
          "Appointment booking error:",
          err
        );


        setError(
          getErrorMessage(
            err,
            "Unable to book appointment."
          )
        );
      } finally {
        setBookingSubmitting(false);
      }
    };


  // ========================================================
  // CANCEL APPOINTMENT
  // ========================================================

  const cancelAppointment =
    async (
      appointment
    ) => {
      const confirmed =
        window.confirm(
          "Cancel this appointment?"
        );


      if (!confirmed) {
        return;
      }


      try {
        setCancellingId(
          appointment.id
        );

        setError("");
        setSuccess("");


        await api.patch(
          `/appointments/${appointment.id}/cancel/`
        );


        setSuccess(
          "Appointment cancelled successfully."
        );


        await fetchData();
      } catch (err) {
        console.error(
          "Cancel appointment error:",
          err
        );


        setError(
          getErrorMessage(
            err,
            "Unable to cancel appointment."
          )
        );
      } finally {
        setCancellingId(null);
      }
    };


  // ========================================================
  // RENDER
  // ========================================================

  return (
    <Layout>

      <div className="page-content patient-appointments-page">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="page-header page-header-actions">

        <div>

          <p className="page-eyebrow">
            PATIENT
          </p>

          <h1>
            Appointments
          </h1>

          <p className="page-description">
            Search doctors, review doctor
            information, select available
            time slots and manage your
            consultations.
          </p>

        </div>


        <button
          type="button"
          className="btn-secondary"
          disabled={refreshing}
          onClick={() =>
            fetchData(true)
          }
        >
          <RefreshCw
            size={17}
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
          MESSAGES
      ===================================================== */}

      {error &&
        !showModal &&
        !showDoctorModal && (

        <div className="error-message">
          {error}
        </div>

      )}


      {success && (

        <div className="auth-success">
          {success}
        </div>

      )}


      {/* ====================================================
          SEARCH / FILTER
      ===================================================== */}

      <div className="card">

        <div className="appointment-filter-grid">

          <div className="search-box">

            <Search size={19} />

            <input
              type="text"
              placeholder="Search doctor, specialization or department..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          <div className="appointment-filter">

            <Building2 size={18} />

            <select
              value={
                selectedDepartment
              }
              onChange={(event) =>
                setSelectedDepartment(
                  event.target.value
                )
              }
            >

              <option value="">
                All Departments
              </option>


              {departments.map(
                (department) => (

                  <option
                    key={
                      department.id
                    }
                    value={
                      department.id
                    }
                  >
                    {
                      department.name
                    }
                  </option>

                )
              )}

            </select>

          </div>

        </div>


        {/* =================================================
            DOCTOR CARDS
        ================================================= */}

        <div className="doctor-booking-grid">

          {loading ? (

            <div className="patient-appointment-loading">
              <Loader2
                size={20}
                className="spin"
              />
              Loading doctors...
            </div>

          ) : filteredDoctors.length ===
            0 ? (

            <div className="empty-state">

              <Stethoscope
                size={32}
              />

              <h3>
                No available doctors
              </h3>

              <p>
                Try another department
                or search term.
              </p>

            </div>

          ) : (

            filteredDoctors.map(
              (doctor) => {

                const isAiDoctor =
                  aiDoctorId &&
                  String(
                    doctor.id
                  ) ===
                    String(
                      aiDoctorId
                    );


                return (

                  <div
                    className={`doctor-book-card ${
                      isAiDoctor
                        ? "ai-suggested-doctor"
                        : ""
                    }`}
                    key={
                      doctor.id
                    }
                  >

                    {isAiDoctor && (

                      <span className="ai-recommended-badge">

                        <Sparkles
                          size={12}
                        />

                        AI Recommended

                      </span>

                    )}


                    <div className="doctor-book-header">

                      <div className="doctor-book-avatar">

                        <Stethoscope
                          size={24}
                        />

                      </div>


                      <div>

                        <h3>
                          Dr. {
                            doctor.first_name
                          } {
                            doctor.last_name
                          }
                        </h3>

                        <p>
                          {
                            doctor.specialization ||
                            "General Medicine"
                          }
                        </p>

                      </div>

                    </div>


                    <div className="doctor-book-info">

                      <div>

                        <span>
                          Department
                        </span>

                        <strong>
                          {
                            doctor.department_name ||
                            "General"
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Experience
                        </span>

                        <strong>
                          {
                            doctor.experience_years ??
                            0
                          } Years
                        </strong>

                      </div>


                      <div>

                        <span>
                          Consultation Fee
                        </span>

                        <strong>
                          ₹{
                            doctor.consultation_fee ??
                            0
                          }
                        </strong>

                      </div>

                    </div>


                    <div className="doctor-card-actions">

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          openDoctorDetails(
                            doctor
                          )
                        }
                      >

                        <UserRound
                          size={17}
                        />

                        View Doctor

                      </button>


                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                          openBookingModal(
                            doctor
                          )
                        }
                      >

                        <CalendarDays
                          size={17}
                        />

                        Book Appointment

                      </button>

                    </div>

                  </div>

                );

              }
            )

          )}

        </div>

      </div>


      {/* ====================================================
          MY APPOINTMENTS
      ===================================================== */}

      <div
        className="card"
        style={{
          marginTop:
            "24px",
        }}
      >

        <div className="card-header">

          <div>

            <h3>
              My Appointments
            </h3>

            <p>
              View upcoming and previous
              consultations.
            </p>

          </div>

        </div>


        <div className="table-responsive">

          <table className="data-table">

            <thead>

              <tr>

                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    <Loader2
                      size={16}
                      className="spin"
                    />
                    Loading appointments...
                  </td>

                </tr>

              ) : appointments.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    No appointments found.
                  </td>

                </tr>

              ) : (

                appointments.map(
                  (appointment) => (

                    <tr
                      key={
                        appointment.id
                      }
                    >

                      <td>
                        Dr. {
                          appointment.doctor_name ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          appointment.appointment_date
                        }
                      </td>

                      <td>
                        {
                          formatTime(
                            appointment.appointment_time
                          )
                        }
                      </td>

                      <td>
                        {
                          appointment.reason ||
                          "-"
                        }
                      </td>

                      <td>

                        <span
                          className={`status-badge appointment-status-${appointment.status?.toLowerCase()}`}
                        >
                          {
                            appointment.status
                          }
                        </span>

                      </td>

                      <td>

                        {[
                          "PENDING",
                          "CONFIRMED",
                        ].includes(
                          appointment.status
                        ) ? (

                          <button
                            type="button"
                            className="btn-text-danger"
                            disabled={
                              cancellingId ===
                              appointment.id
                            }
                            onClick={() =>
                              cancelAppointment(
                                appointment
                              )
                            }
                          >
                            {
                              cancellingId ===
                              appointment.id
                                ? "Cancelling..."
                                : "Cancel"
                            }
                          </button>

                        ) : (
                          "-"
                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ====================================================
          DOCTOR DETAILS MODAL
      ===================================================== */}

      {showDoctorModal &&
        selectedDoctor && (

        <div className="modal-overlay">

          <div className="modal doctor-detail-modal">

            <div className="modal-header">

              <div>

                <p className="page-eyebrow">
                  DOCTOR PROFILE
                </p>

                <h2>
                  Dr. {
                    selectedDoctor.first_name
                  } {
                    selectedDoctor.last_name
                  }
                </h2>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeDoctorDetails
                }
                aria-label="Close doctor details"
              >

                <X size={20} />

              </button>

            </div>


            <div className="doctor-detail-profile">

              <div className="doctor-detail-avatar">

                <Stethoscope
                  size={30}
                />

              </div>


              <div>

                <h3>
                  {
                    selectedDoctor.specialization ||
                    "General Medicine"
                  }
                </h3>

                <p>
                  {
                    selectedDoctor.department_name ||
                    "General"
                  }
                </p>

              </div>

            </div>


            <div className="doctor-detail-grid">

              <div>

                <span>
                  Experience
                </span>

                <strong>
                  {
                    selectedDoctor.experience_years ??
                    0
                  } Years
                </strong>

              </div>


              <div>

                <span>
                  Qualification
                </span>

                <strong>
                  {
                    selectedDoctor.qualification ||
                    "Not provided"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Consultation Fee
                </span>

                <strong>
                  ₹{
                    selectedDoctor.consultation_fee ??
                    0
                  }
                </strong>

              </div>


              <div>

                <span>
                  Availability
                </span>

                <strong>
                  {
                    selectedDoctor.is_available
                      ? "Available"
                      : "Unavailable"
                  }
                </strong>

              </div>

            </div>


            <div className="modal-actions">

              <button
                type="button"
                className="btn-secondary"
                onClick={
                  closeDoctorDetails
                }
              >
                Close
              </button>


              <button
                type="button"
                className="btn-primary"
                disabled={
                  !selectedDoctor.is_available
                }
                onClick={() => {
                  const doctor =
                    selectedDoctor;

                  setShowDoctorModal(
                    false
                  );

                  openBookingModal(
                    doctor
                  );
                }}
              >

                <CalendarDays
                  size={17}
                />

                Book Appointment

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ====================================================
          BOOK APPOINTMENT MODAL
      ===================================================== */}

      {showModal &&
        selectedDoctor && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  Book Appointment
                </h2>


                {isAiBooking &&
                  aiSuggestedSlot && (

                  <div className="ai-booking-notice">

                    <Sparkles
                      size={14}
                    />

                    AI selected the nearest
                    available appointment slot.

                  </div>

                )}


                <p>

                  Dr. {
                    selectedDoctor.first_name
                  } {
                    selectedDoctor.last_name
                  }

                  {" · "}

                  {
                    selectedDoctor.specialization ||
                    "General Medicine"
                  }

                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                disabled={
                  bookingSubmitting
                }
                onClick={
                  closeBookingModal
                }
                aria-label="Close booking"
              >

                <X size={20} />

              </button>

            </div>


            <form
              onSubmit={
                handleBooking
              }
            >

              {/* DATE */}

              <div className="form-group">

                <label>
                  Appointment Date
                </label>

                <input
                  type="date"
                  name="appointment_date"
                  value={
                    formData.appointment_date
                  }
                  onChange={
                    handleChange
                  }
                  min={today}
                  required
                />

              </div>


              {/* AVAILABLE TIME */}

              <div
                className="form-group"
                style={{
                  marginTop:
                    "18px",
                }}
              >

                <label>
                  Available Time
                </label>


                {loadingSlots ? (

                  <div className="slot-loading">
                    Loading available slots...
                  </div>

                ) : !formData
                    .appointment_date ? (

                  <div className="slot-message">
                    Select an appointment
                    date first.
                  </div>

                ) : availableSlots.length ===
                  0 ? (

                  <div className="slot-message">
                    No appointment slots
                    are available on this
                    date.
                  </div>

                ) : (

                  <div className="time-slot-grid">

                    {availableSlots.map(
                      (slot) => (

                        <button
                          type="button"
                          key={slot}
                          className={
                            normalizeTime(
                              formData
                                .appointment_time
                            ) ===
                            normalizeTime(
                              slot
                            )
                              ? "time-slot active"
                              : "time-slot"
                          }
                          onClick={() =>
                            selectTimeSlot(
                              slot
                            )
                          }
                        >

                          {
                            formatTime(
                              slot
                            )
                          }

                        </button>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* REASON */}

              <div
                className="form-group"
                style={{
                  marginTop:
                    "18px",
                }}
              >

                <label>
                  Reason / Symptoms
                </label>

                <textarea
                  name="reason"
                  value={
                    formData.reason
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder="Briefly describe the reason for consultation..."
                  required
                />

              </div>


              {error && (

                <div className="error-message">
                  {error}
                </div>

              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={
                    bookingSubmitting
                  }
                  onClick={
                    closeBookingModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    bookingSubmitting ||
                    loadingSlots ||
                    !formData
                      .appointment_date ||
                    !formData
                      .appointment_time ||
                    !formData
                      .reason
                      .trim()
                  }
                >

                  {
                    bookingSubmitting ? (
                      <Loader2
                        size={17}
                        className="spin"
                      />
                    ) : (
                      <Clock3
                        size={17}
                      />
                    )
                  }

                  {
                    bookingSubmitting
                      ? "Booking..."
                      : "Confirm Appointment"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      </div>

    </Layout>
  );
}


export default Appointments;
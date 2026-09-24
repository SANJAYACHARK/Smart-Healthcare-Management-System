import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


const DAYS = [
  {
    value: 0,
    label: "Monday",
  },
  {
    value: 1,
    label: "Tuesday",
  },
  {
    value: 2,
    label: "Wednesday",
  },
  {
    value: 3,
    label: "Thursday",
  },
  {
    value: 4,
    label: "Friday",
  },
  {
    value: 5,
    label: "Saturday",
  },
  {
    value: 6,
    label: "Sunday",
  },
];


const DEFAULT_FORM = {
  day_of_week: 0,
  start_time: "",
  end_time: "",
  slot_duration: 30,
  is_active: true,
};


function DoctorAvailability() {

  // =========================================================
  // STATE
  // =========================================================

  const [
    availability,
    setAvailability,
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
    saving,
    setSaving,
  ] = useState(false);


  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    showModal,
    setShowModal,
  ] = useState(false);


  const [
    editingSlot,
    setEditingSlot,
  ] = useState(null);


  const [
    formData,
    setFormData,
  ] = useState({
    ...DEFAULT_FORM,
  });


  // =========================================================
  // HELPERS
  // =========================================================

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


  const getDayName =
    (
      slot
    ) => {

      if (
        slot?.day_name
      ) {

        return slot.day_name;

      }


      return (
        DAYS.find(
          (
            day
          ) =>
            day.value ===
            Number(
              slot?.day_of_week
            )
        )?.label ||
        "-"
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


  const timeToMinutes =
    (
      time
    ) => {

      if (!time) {

        return 0;

      }


      const [
        hours,
        minutes,
      ] = time
        .split(":")
        .map(
          Number
        );


      return (
        hours * 60 +
        minutes
      );

    };


  const getErrorMessage =
    (
      data,
      fallback =
        "Unable to save availability."
    ) => {

      if (!data) {

        return fallback;

      }


      if (
        data.detail
      ) {

        return data.detail;

      }


      if (
        typeof data ===
        "object"
      ) {

        const messages =
          Object.values(
            data
          )
            .flat(
              Infinity
            )
            .filter(
              Boolean
            )
            .join(
              " "
            );


        if (messages) {

          return messages;

        }

      }


      return fallback;

    };


  // =========================================================
  // LOAD AVAILABILITY
  // =========================================================

  const fetchAvailability =
    async (
      showRefresh = false
    ) => {

      try {

        if (showRefresh) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        setError("");


        const response =
          await api.get(
            "/appointments/doctor/availability/"
          );


        setAvailability(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Availability load error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load availability."
        );

      } finally {

        setLoading(
          false
        );

        setRefreshing(
          false
        );

      }

    };


  useEffect(() => {

    fetchAvailability();

  }, []);


  // =========================================================
  // SORTED AVAILABILITY
  // =========================================================

  const sortedAvailability =
    useMemo(
      () => {

        return [
          ...availability,
        ].sort(
          (
            first,
            second
          ) => {

            const dayDifference =
              Number(
                first.day_of_week
              ) -
              Number(
                second.day_of_week
              );


            if (
              dayDifference !==
              0
            ) {

              return dayDifference;

            }


            return String(
              first.start_time ||
              ""
            )
              .localeCompare(
                String(
                  second.start_time ||
                  ""
                )
              );

          }
        );

      },
      [
        availability,
      ]
    );


  // =========================================================
  // SUMMARY
  // =========================================================

  const activeSlots =
    useMemo(
      () => {

        return availability
          .filter(
            (
              slot
            ) =>
              Boolean(
                slot.is_active
              )
          )
          .length;

      },
      [
        availability,
      ]
    );


  const activeDays =
    useMemo(
      () => {

        const days =
          new Set();


        availability
          .filter(
            (
              slot
            ) =>
              Boolean(
                slot.is_active
              )
          )
          .forEach(
            (
              slot
            ) => {

              days.add(
                Number(
                  slot.day_of_week
                )
              );

            }
          );


        return days.size;

      },
      [
        availability,
      ]
    );


  const totalWeeklyMinutes =
    useMemo(
      () => {

        return availability
          .filter(
            (
              slot
            ) =>
              Boolean(
                slot.is_active
              )
          )
          .reduce(
            (
              total,
              slot
            ) => {

              const start =
                timeToMinutes(
                  slot.start_time
                );


              const end =
                timeToMinutes(
                  slot.end_time
                );


              return (
                total +
                Math.max(
                  0,
                  end - start
                )
              );

            },
            0
          );

      },
      [
        availability,
      ]
    );


  const totalWeeklyHours =
    (
      totalWeeklyMinutes /
      60
    ).toFixed(
      totalWeeklyMinutes %
        60 ===
      0
        ? 0
        : 1
    );


  // =========================================================
  // MODAL
  // =========================================================

  const openAddModal =
    () => {

      setEditingSlot(
        null
      );


      setFormData({
        ...DEFAULT_FORM,
      });


      setError("");
      setSuccess("");


      setShowModal(
        true
      );

    };


  const openEditModal =
    (
      slot
    ) => {

      setEditingSlot(
        slot
      );


      setFormData({
        day_of_week:
          Number(
            slot.day_of_week
          ),

        start_time:
          slot.start_time
            ?.slice(
              0,
              5
            ) ||
          "",

        end_time:
          slot.end_time
            ?.slice(
              0,
              5
            ) ||
          "",

        slot_duration:
          Number(
            slot.slot_duration ||
            30
          ),

        is_active:
          Boolean(
            slot.is_active
          ),
      });


      setError("");
      setSuccess("");


      setShowModal(
        true
      );

    };


  const closeModal =
    () => {

      if (saving) {

        return;

      }


      setShowModal(
        false
      );


      setEditingSlot(
        null
      );


      setFormData({
        ...DEFAULT_FORM,
      });


      setError("");

    };


  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange =
    (
      event
    ) => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;


      setFormData(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );

    };


  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm =
    () => {

      if (
        !formData.start_time ||
        !formData.end_time
      ) {

        setError(
          "Start time and end time are required."
        );

        return false;

      }


      if (
        formData.end_time <=
        formData.start_time
      ) {

        setError(
          "End time must be after start time."
        );

        return false;

      }


      const duration =
        Number(
          formData.slot_duration
        );


      if (
        Number.isNaN(
          duration
        ) ||
        duration <
        5
      ) {

        setError(
          "Slot duration must be at least 5 minutes."
        );

        return false;

      }


      const startMinutes =
        timeToMinutes(
          formData.start_time
        );


      const endMinutes =
        timeToMinutes(
          formData.end_time
        );


      if (
        endMinutes -
          startMinutes <
        duration
      ) {

        setError(
          "Working period must be at least as long as one appointment slot."
        );

        return false;

      }


      const hasOverlap =
        availability.some(
          (
            slot
          ) => {

            if (
              editingSlot &&
              String(
                slot.id
              ) ===
              String(
                editingSlot.id
              )
            ) {

              return false;

            }


            if (
              Number(
                slot.day_of_week
              ) !==
              Number(
                formData.day_of_week
              )
            ) {

              return false;

            }


            const existingStart =
              timeToMinutes(
                slot.start_time
              );


            const existingEnd =
              timeToMinutes(
                slot.end_time
              );


            return (
              startMinutes <
                existingEnd &&
              endMinutes >
                existingStart
            );

          }
        );


      if (
        hasOverlap
      ) {

        setError(
          "This time overlaps with another availability period on the same day."
        );

        return false;

      }


      return true;

    };


  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      setError("");
      setSuccess("");


      if (
        !validateForm()
      ) {

        return;

      }


      const payload = {
        day_of_week:
          Number(
            formData.day_of_week
          ),

        start_time:
          formData.start_time,

        end_time:
          formData.end_time,

        slot_duration:
          Number(
            formData.slot_duration
          ),

        is_active:
          Boolean(
            formData.is_active
          ),
      };


      try {

        setSaving(
          true
        );


        if (
          editingSlot
        ) {

          await api.put(
            `/appointments/doctor/availability/${editingSlot.id}/`,
            payload
          );


          setSuccess(
            "Availability updated successfully."
          );

        } else {

          await api.post(
            "/appointments/doctor/availability/",
            payload
          );


          setSuccess(
            "Availability added successfully."
          );

        }


        setShowModal(
          false
        );


        setEditingSlot(
          null
        );


        setFormData({
          ...DEFAULT_FORM,
        });


        await fetchAvailability();

      } catch (err) {

        console.error(
          "Availability save error:",
          err
        );


        setError(
          getErrorMessage(
            err.response
              ?.data
          )
        );

      } finally {

        setSaving(
          false
        );

      }

    };


  // =========================================================
  // DELETE
  // =========================================================

  const deleteSlot =
    async (
      slot
    ) => {

      if (
        !slot?.id
      ) {

        return;

      }


      const dayName =
        getDayName(
          slot
        );


      const confirmed =
        window.confirm(
          `Delete ${dayName} ${formatTime(
            slot.start_time
          )} - ${formatTime(
            slot.end_time
          )}?`
        );


      if (
        !confirmed
      ) {

        return;

      }


      try {

        setDeletingId(
          slot.id
        );


        setError("");
        setSuccess("");


        await api.delete(
          `/appointments/doctor/availability/${slot.id}/`
        );


        setSuccess(
          "Availability deleted successfully."
        );


        await fetchAvailability();

      } catch (err) {

        console.error(
          "Delete availability error:",
          err
        );


        setError(
          getErrorMessage(
            err.response
              ?.data,
            "Unable to delete availability."
          )
        );

      } finally {

        setDeletingId(
          null
        );

      }

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading
  ) {

    return (

      <Layout>

        <div className="loading-screen">

          <Loader2
            size={24}
            className="spin"
          />

          Loading availability...

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
              Availability
            </h1>


            <p className="page-description">

              Configure your weekly working
              hours and appointment slot
              duration.

            </p>

          </div>


          <div
            className="availability-header-actions"
          >

            <button
              type="button"
              className="btn-secondary"
              disabled={
                refreshing
              }
              onClick={
                () =>
                  fetchAvailability(
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


            <button
              type="button"
              className="btn-primary"
              onClick={
                openAddModal
              }
            >

              <Plus
                size={18}
              />

              Add Availability

            </button>

          </div>

        </div>


        {/* ====================================================
            MESSAGES
        ===================================================== */}

        {
          error &&
          !showModal && (

            <div className="error-message">

              {error}

            </div>

          )
        }


        {
          success && (

            <div className="auth-success">

              {success}

            </div>

          )
        }


        {/* ====================================================
            KPI CARDS
        ===================================================== */}

        <div className="availability-summary-grid">


          <div className="availability-summary-card">

            <div className="availability-summary-icon">

              <CalendarDays
                size={20}
              />

            </div>


            <div>

              <span>
                Active Days
              </span>


              <strong>

                {
                  activeDays
                }

              </strong>

            </div>

          </div>


          <div className="availability-summary-card">

            <div className="availability-summary-icon">

              <Clock3
                size={20}
              />

            </div>


            <div>

              <span>
                Active Periods
              </span>


              <strong>

                {
                  activeSlots
                }

              </strong>

            </div>

          </div>


          <div className="availability-summary-card">

            <div className="availability-summary-icon">

              <CheckCircle2
                size={20}
              />

            </div>


            <div>

              <span>
                Weekly Hours
              </span>


              <strong>

                {
                  totalWeeklyHours
                }

                h

              </strong>

            </div>

          </div>


        </div>


        {/* ====================================================
            WEEKLY SCHEDULE
        ===================================================== */}

        <div className="card">

          <div className="card-header">

            <div>

              <h3>
                Weekly Schedule
              </h3>


              <p>

                Patients can only book
                appointments during active
                working periods.

              </p>

            </div>


            <CalendarDays
              size={21}
            />

          </div>


          {
            sortedAvailability.length ===
            0 ? (

              <div className="empty-state">

                <CalendarDays
                  size={34}
                />


                <h3>
                  No Availability Configured
                </h3>


                <p>

                  Add your first working
                  period to allow patients
                  to book appointments.

                </p>


                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    openAddModal
                  }
                >

                  <Plus
                    size={16}
                  />

                  Add Availability

                </button>

              </div>

            ) : (

              <div className="table-responsive">

                <table className="data-table">

                  <thead>

                    <tr>

                      <th>
                        Day
                      </th>

                      <th>
                        Working Hours
                      </th>

                      <th>
                        Slot Duration
                      </th>

                      <th>
                        Estimated Slots
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      sortedAvailability.map(
                        (
                          slot
                        ) => {

                          const duration =
                            Number(
                              slot.slot_duration ||
                              30
                            );


                          const workingMinutes =
                            Math.max(
                              0,
                              timeToMinutes(
                                slot.end_time
                              ) -
                              timeToMinutes(
                                slot.start_time
                              )
                            );


                          const estimatedSlots =
                            duration >
                            0
                              ? Math.floor(
                                  workingMinutes /
                                  duration
                                )
                              : 0;


                          return (

                            <tr
                              key={
                                slot.id
                              }
                            >

                              <td>

                                <strong>

                                  {
                                    getDayName(
                                      slot
                                    )
                                  }

                                </strong>

                              </td>


                              <td>

                                <div className="availability-time">

                                  <Clock3
                                    size={16}
                                  />

                                  {
                                    formatTime(
                                      slot.start_time
                                    )
                                  }

                                  <span>
                                    –
                                  </span>

                                  {
                                    formatTime(
                                      slot.end_time
                                    )
                                  }

                                </div>

                              </td>


                              <td>

                                {
                                  slot.slot_duration
                                }

                                {" "}

                                minutes

                              </td>


                              <td>

                                {
                                  estimatedSlots
                                }

                                {" "}

                                slot(s)

                              </td>


                              <td>

                                <span
                                  className={
                                    slot.is_active
                                      ? "status-badge status-active"
                                      : "status-badge status-inactive"
                                  }
                                >

                                  {
                                    slot.is_active
                                      ? "Active"
                                      : "Inactive"
                                  }

                                </span>

                              </td>


                              <td>

                                <div className="table-actions">

                                  <button
                                    type="button"
                                    className="icon-btn"
                                    title="Edit availability"
                                    disabled={
                                      deletingId ===
                                      slot.id
                                    }
                                    onClick={
                                      () =>
                                        openEditModal(
                                          slot
                                        )
                                    }
                                  >

                                    <Edit
                                      size={17}
                                    />

                                  </button>


                                  <button
                                    type="button"
                                    className="icon-btn danger-btn"
                                    title="Delete availability"
                                    disabled={
                                      deletingId ===
                                      slot.id
                                    }
                                    onClick={
                                      () =>
                                        deleteSlot(
                                          slot
                                        )
                                    }
                                  >

                                    {
                                      deletingId ===
                                      slot.id ? (

                                        <Loader2
                                          size={17}
                                          className="spin"
                                        />

                                      ) : (

                                        <Trash2
                                          size={17}
                                        />

                                      )
                                    }

                                  </button>

                                </div>

                              </td>

                            </tr>

                          );

                        }
                      )
                    }

                  </tbody>

                </table>

              </div>

            )
          }

        </div>


        {/* ====================================================
            ADD / EDIT MODAL
        ===================================================== */}

        {
          showModal && (

            <div className="modal-overlay">

              <div className="modal">

                <div className="modal-header">

                  <div>

                    <p className="page-eyebrow">
                      SCHEDULE
                    </p>


                    <h2>

                      {
                        editingSlot
                          ? "Edit Availability"
                          : "Add Availability"
                      }

                    </h2>


                    <p>

                      Define your working hours
                      and appointment duration.

                    </p>

                  </div>


                  <button
                    type="button"
                    className="modal-close"
                    disabled={
                      saving
                    }
                    onClick={
                      closeModal
                    }
                    aria-label="Close availability form"
                  >

                    <X
                      size={20}
                    />

                  </button>

                </div>


                <form
                  onSubmit={
                    handleSubmit
                  }
                >

                  <div className="form-grid">


                    <div className="form-group">

                      <label>
                        Day
                      </label>


                      <select
                        name="day_of_week"
                        value={
                          formData.day_of_week
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          handleChange
                        }
                        required
                      >

                        {
                          DAYS.map(
                            (
                              day
                            ) => (

                              <option
                                key={
                                  day.value
                                }
                                value={
                                  day.value
                                }
                              >

                                {
                                  day.label
                                }

                              </option>

                            )
                          )
                        }

                      </select>

                    </div>


                    <div className="form-group">

                      <label>
                        Slot Duration
                      </label>


                      <select
                        name="slot_duration"
                        value={
                          formData.slot_duration
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          handleChange
                        }
                        required
                      >

                        <option value="15">
                          15 minutes
                        </option>

                        <option value="20">
                          20 minutes
                        </option>

                        <option value="30">
                          30 minutes
                        </option>

                        <option value="45">
                          45 minutes
                        </option>

                        <option value="60">
                          60 minutes
                        </option>

                      </select>

                    </div>


                    <div className="form-group">

                      <label>
                        Start Time
                      </label>


                      <input
                        type="time"
                        name="start_time"
                        value={
                          formData.start_time
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label>
                        End Time
                      </label>


                      <input
                        type="time"
                        name="end_time"
                        value={
                          formData.end_time
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>

                  </div>


                  <label className="availability-checkbox">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={
                        formData.is_active
                      }
                      disabled={
                        saving
                      }
                      onChange={
                        handleChange
                      }
                    />


                    <span>

                      This availability
                      is active

                    </span>

                  </label>


                  {
                    error && (

                      <div className="error-message">

                        {error}

                      </div>

                    )
                  }


                  <div className="availability-form-preview">

                    <Clock3
                      size={17}
                    />


                    <span>

                      {
                        DAYS.find(
                          (
                            day
                          ) =>
                            day.value ===
                            Number(
                              formData.day_of_week
                            )
                        )?.label
                      }

                      {
                        formData.start_time &&
                        formData.end_time
                          ? ` · ${formatTime(
                              formData.start_time
                            )} – ${formatTime(
                              formData.end_time
                            )}`
                          : ""
                      }

                      {
                        formData.slot_duration
                          ? ` · ${formData.slot_duration} min slots`
                          : ""
                      }

                    </span>

                  </div>


                  <div className="modal-actions">

                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={
                        saving
                      }
                      onClick={
                        closeModal
                      }
                    >

                      Cancel

                    </button>


                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        saving
                      }
                    >

                      {
                        saving ? (

                          <>

                            <Loader2
                              size={16}
                              className="spin"
                            />

                            {
                              editingSlot
                                ? "Updating..."
                                : "Adding..."
                            }

                          </>

                        ) : (

                          <>

                            <CheckCircle2
                              size={16}
                            />

                            {
                              editingSlot
                                ? "Update Availability"
                                : "Add Availability"
                            }

                          </>

                        )
                      }

                    </button>

                  </div>

                </form>

              </div>

            </div>

          )
        }

      </div>

    </Layout>

  );

}


export default DoctorAvailability;

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarCheck,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Star,
  Stethoscope,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


function Feedback() {

  const [
    appointments,
    setAppointments,
  ] = useState([]);


  const [
    feedbacks,
    setFeedbacks,
  ] = useState([]);


  const [
    selectedAppointment,
    setSelectedAppointment,
  ] = useState("");


  const [
    rating,
    setRating,
  ] = useState(0);


  const [
    hoverRating,
    setHoverRating,
  ] = useState(0);


  const [
    comment,
    setComment,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    submitting,
    setSubmitting,
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
    search,
    setSearch,
  ] = useState("");


  const getResults = (
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


  const loadData =
    async (
      showRefresh = false
    ) => {

      try {

        if (
          showRefresh
        ) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        setError("");


        const [
          appointmentResponse,
          feedbackResponse,
        ] =
          await Promise.all([
            api.get(
              "/appointments/my/"
            ),
            api.get(
              "/feedback/patient/"
            ),
          ]);


        setAppointments(
          getResults(
            appointmentResponse
          )
        );


        setFeedbacks(
          getResults(
            feedbackResponse
          )
        );

      } catch (err) {

        console.error(
          "Patient feedback load error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load feedback information."
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

    loadData();

  }, []);


  const reviewedAppointmentIds =
    useMemo(
      () =>
        new Set(
          feedbacks
            .map(
              (
                feedback
              ) =>
                Number(
                  feedback.appointment
                    ?.id ??
                  feedback.appointment
                )
            )
            .filter(
              Number.isFinite
            )
        ),
      [
        feedbacks,
      ]
    );


  const eligibleAppointments =
    useMemo(
      () =>
        appointments.filter(
          (
            appointment
          ) =>
            appointment.status ===
              "COMPLETED" &&
            !reviewedAppointmentIds
              .has(
                Number(
                  appointment.id
                )
              )
        ),
      [
        appointments,
        reviewedAppointmentIds,
      ]
    );


  const filteredFeedbacks =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        if (
          !text
        ) {

          return feedbacks;

        }


        return feedbacks.filter(
          (
            feedback
          ) => {

            const searchable =
              [
                feedback.doctor_name,
                feedback.comment,
                feedback.appointment_date,
                feedback.rating,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchable
              .includes(
                text
              );

          }
        );

      },
      [
        feedbacks,
        search,
      ]
    );


  const averageRating =
    useMemo(
      () => {

        if (
          feedbacks.length ===
          0
        ) {

          return 0;

        }


        const total =
          feedbacks.reduce(
            (
              sum,
              feedback
            ) =>
              sum +
              Number(
                feedback.rating ||
                0
              ),
            0
          );


        return (
          total /
          feedbacks.length
        );

      },
      [
        feedbacks,
      ]
    );


  const formatDate = (
    value
  ) => {

    if (
      !value
    ) {

      return "-";

    }


    const date =
      new Date(
        String(value)
          .includes("T")
          ? value
          : `${value}T00:00:00`
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


  const resetForm =
    () => {

      setSelectedAppointment(
        ""
      );

      setRating(
        0
      );

      setHoverRating(
        0
      );

      setComment(
        ""
      );

  };


  const submitFeedback =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        !selectedAppointment
      ) {

        setError(
          "Please select a completed appointment."
        );

        return;

      }


      if (
        rating <
        1
      ) {

        setError(
          "Please select a rating."
        );

        return;

      }


      try {

        setSubmitting(
          true
        );

        setError("");

        setSuccess("");


        await api.post(
          "/feedback/patient/",
          {
            appointment:
              Number(
                selectedAppointment
              ),

            rating:
              Number(
                rating
              ),

            comment:
              comment.trim(),
          }
        );


        setSuccess(
          "Thank you. Your feedback has been submitted successfully."
        );


        resetForm();


        await loadData(
          false
        );

      } catch (err) {

        console.error(
          "Feedback submission error:",
          err
        );


        const data =
          err.response
            ?.data;


        setError(
          data?.detail ||
          data?.appointment?.[0] ||
          data?.rating?.[0] ||
          data?.comment?.[0] ||
          "Unable to submit feedback."
        );

      } finally {

        setSubmitting(
          false
        );

      }

    };


  const renderStars = (
    value,
    size = 16
  ) => {

    return (

      <div className="patient-feedback-stars-readonly">

        {
          [
            1,
            2,
            3,
            4,
            5,
          ].map(
            (
              star
            ) => (

              <Star
                key={
                  star
                }
                size={
                  size
                }
                fill={
                  star <=
                  Number(value)
                    ? "currentColor"
                    : "none"
                }
                className={
                  star <=
                  Number(value)
                    ? "active"
                    : ""
                }
              />

            )
          )
        }

      </div>

    );

  };


  return (

    <Layout>

      <div className="page-content patient-feedback-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              PATIENT
            </p>


            <h1>
              Feedback
            </h1>


            <p className="page-description">

              Share your experience after a
              completed consultation and
              review feedback you have
              already submitted.

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
                loadData(
                  true
                )
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


        {
          error && (

            <div className="error-message">
              {error}
            </div>

          )
        }


        {
          success && (

            <div className="patient-feedback-success">

              <CheckCircle2
                size={18}
              />

              {success}

            </div>

          )
        }


        <div className="patient-feedback-stats">


          <div className="patient-feedback-stat">

            <MessageSquareText
              size={20}
            />

            <div>

              <strong>
                {
                  feedbacks.length
                }
              </strong>

              <span>
                Feedback Submitted
              </span>

            </div>

          </div>


          <div className="patient-feedback-stat">

            <CalendarCheck
              size={20}
            />

            <div>

              <strong>
                {
                  eligibleAppointments
                    .length
                }
              </strong>

              <span>
                Eligible Consultations
              </span>

            </div>

          </div>


          <div className="patient-feedback-stat">

            <Star
              size={20}
            />

            <div>

              <strong>

                {
                  averageRating >
                  0
                    ? averageRating
                        .toFixed(1)
                    : "-"
                }

              </strong>

              <span>
                Your Average Rating
              </span>

            </div>

          </div>


        </div>


        {
          loading ? (

            <div className="card patient-feedback-loading">

              <Loader2
                size={24}
                className="spin"
              />

              <span>
                Loading feedback...
              </span>

            </div>

          ) : (

            <div className="patient-feedback-layout">


              <section className="card patient-feedback-form-card">

                <div className="patient-feedback-section-header">

                  <div>

                    <p className="page-eyebrow">
                      NEW FEEDBACK
                    </p>

                    <h2>
                      Rate Your Consultation
                    </h2>

                    <p>

                      Only completed
                      appointments that have
                      not been reviewed are
                      shown here.

                    </p>

                  </div>


                  <Star
                    size={23}
                  />

                </div>


                {
                  eligibleAppointments
                    .length ===
                  0 ? (

                    <div className="patient-feedback-no-eligible">

                      <CheckCircle2
                        size={34}
                      />


                      <h3>
                        You're all caught up
                      </h3>


                      <p>

                        There are no completed
                        consultations waiting
                        for feedback.

                      </p>

                    </div>

                  ) : (

                    <form
                      onSubmit={
                        submitFeedback
                      }
                      className="patient-feedback-form"
                    >

                      <div className="form-group">

                        <label>
                          Completed Appointment
                        </label>


                        <select
                          value={
                            selectedAppointment
                          }
                          onChange={
                            (
                              event
                            ) =>
                              setSelectedAppointment(
                                event.target.value
                              )
                          }
                          disabled={
                            submitting
                          }
                          required
                        >

                          <option value="">
                            Select appointment
                          </option>


                          {
                            eligibleAppointments
                              .map(
                                (
                                  appointment
                                ) => (

                                  <option
                                    key={
                                      appointment.id
                                    }
                                    value={
                                      appointment.id
                                    }
                                  >

                                    Dr. {
                                      appointment.doctor_name ||
                                      "Doctor"
                                    } — {
                                      formatDate(
                                        appointment
                                          .appointment_date
                                      )
                                    }

                                  </option>

                                )
                              )
                          }

                        </select>

                      </div>


                      <div className="form-group">

                        <label>
                          Your Rating
                        </label>


                        <div
                          className="patient-feedback-rating-input"
                          onMouseLeave={
                            () =>
                              setHoverRating(
                                0
                              )
                          }
                        >

                          {
                            [
                              1,
                              2,
                              3,
                              4,
                              5,
                            ].map(
                              (
                                star
                              ) => {

                                const active =
                                  star <=
                                  (
                                    hoverRating ||
                                    rating
                                  );


                                return (

                                  <button
                                    type="button"
                                    key={
                                      star
                                    }
                                    className={
                                      active
                                        ? "active"
                                        : ""
                                    }
                                    onMouseEnter={
                                      () =>
                                        setHoverRating(
                                          star
                                        )
                                    }
                                    onFocus={
                                      () =>
                                        setHoverRating(
                                          star
                                        )
                                    }
                                    onBlur={
                                      () =>
                                        setHoverRating(
                                          0
                                        )
                                    }
                                    onClick={
                                      () =>
                                        setRating(
                                          star
                                        )
                                    }
                                    disabled={
                                      submitting
                                    }
                                    aria-label={
                                      `Rate ${star} out of 5`
                                    }
                                  >

                                    <Star
                                      size={29}
                                      fill={
                                        active
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />

                                  </button>

                                );

                              }
                            )
                          }


                          <span>

                            {
                              rating >
                              0
                                ? `${rating}/5`
                                : "Select rating"
                            }

                          </span>

                        </div>

                      </div>


                      <div className="form-group">

                        <label>
                          Comments
                        </label>


                        <textarea
                          rows={6}
                          value={
                            comment
                          }
                          onChange={
                            (
                              event
                            ) =>
                              setComment(
                                event.target.value
                              )
                          }
                          placeholder="Tell us about your consultation experience..."
                          maxLength={
                            2000
                          }
                          disabled={
                            submitting
                          }
                        />


                        <div className="patient-feedback-character-count">

                          {
                            comment.length
                          }/2000

                        </div>

                      </div>


                      <button
                        type="submit"
                        className="btn-primary patient-feedback-submit"
                        disabled={
                          submitting ||
                          !selectedAppointment ||
                          rating <
                            1
                        }
                      >

                        {
                          submitting ? (

                            <>

                              <Loader2
                                size={17}
                                className="spin"
                              />

                              Submitting...

                            </>

                          ) : (

                            <>

                              <Send
                                size={17}
                              />

                              Submit Feedback

                            </>

                          )
                        }

                      </button>

                    </form>

                  )
                }

              </section>


              <section className="card patient-feedback-history-card">

                <div className="patient-feedback-section-header">

                  <div>

                    <p className="page-eyebrow">
                      HISTORY
                    </p>

                    <h2>
                      My Feedback
                    </h2>

                    <p>
                      Your previously submitted reviews.
                    </p>

                  </div>

                </div>


                <div className="search-box patient-feedback-search">

                  <Search
                    size={17}
                  />


                  <input
                    type="text"
                    placeholder="Search doctor or comment..."
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


                {
                  filteredFeedbacks
                    .length ===
                  0 ? (

                    <div className="empty-state patient-feedback-empty">

                      <MessageSquareText
                        size={34}
                      />


                      <h3>

                        {
                          feedbacks.length ===
                          0
                            ? "No feedback submitted"
                            : "No matching feedback"
                        }

                      </h3>


                      <p>

                        {
                          feedbacks.length ===
                          0
                            ? "Your submitted feedback will appear here."
                            : "Try a different search."
                        }

                      </p>

                    </div>

                  ) : (

                    <div className="patient-feedback-history">

                      {
                        filteredFeedbacks
                          .map(
                            (
                              feedback
                            ) => (

                              <article
                                className="patient-feedback-history-item"
                                key={
                                  feedback.id
                                }
                              >

                                <div className="patient-feedback-history-top">

                                  <div className="patient-feedback-doctor">

                                    <div>

                                      <Stethoscope
                                        size={17}
                                      />

                                    </div>


                                    <div>

                                      <strong>

                                        Dr. {
                                          feedback.doctor_name ||
                                          "Doctor"
                                        }

                                      </strong>


                                      <span>

                                        {
                                          formatDate(
                                            feedback
                                              .appointment_date ||
                                            feedback
                                              .created_at
                                          )
                                        }

                                      </span>

                                    </div>

                                  </div>


                                  {
                                    renderStars(
                                      feedback.rating
                                    )
                                  }

                                </div>


                                {
                                  feedback.comment ? (

                                    <p className="patient-feedback-comment">

                                      {
                                        feedback.comment
                                      }

                                    </p>

                                  ) : (

                                    <p className="patient-feedback-comment muted">

                                      No written comment.

                                    </p>

                                  )
                                }

                              </article>

                            )
                          )
                      }

                    </div>

                  )
                }

              </section>


            </div>

          )
        }


      </div>

    </Layout>

  );

}


export default Feedback;

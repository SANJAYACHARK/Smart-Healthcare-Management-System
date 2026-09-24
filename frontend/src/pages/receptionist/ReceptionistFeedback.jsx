import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Stethoscope,
  UserRound,
} from "lucide-react";

import Layout
  from "../../components/layout/Layout";

import api
  from "../../api/axios";


const RATING_OPTIONS = [
  "ALL",
  "5",
  "4",
  "3",
  "2",
  "1",
];


function ReceptionistFeedback() {

  const [
    feedback,
    setFeedback,
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
    ratingFilter,
    setRatingFilter,
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


  const fetchFeedback =
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
            "/feedback/receptionist/"
          );


        setFeedback(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Receptionist feedback error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load patient feedback."
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

    fetchFeedback();

  }, []);


  const filteredFeedback =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return feedback.filter(
          (
            item
          ) => {

            const matchesSearch =
              !text ||
              String(
                item.patient_name ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                ) ||
              String(
                item.doctor_name ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                ) ||
              String(
                item.comment ||
                ""
              )
                .toLowerCase()
                .includes(
                  text
                );


            const matchesRating =
              ratingFilter ===
              "ALL" ||
              Number(
                item.rating
              ) ===
                Number(
                  ratingFilter
                );


            return (
              matchesSearch &&
              matchesRating
            );

          }
        );

      },
      [
        feedback,
        search,
        ratingFilter,
      ]
    );


  const stats =
    useMemo(
      () => {

        const counts = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };


        let totalRating = 0;
        let validRatings = 0;


        feedback.forEach(
          (
            item
          ) => {

            const rating =
              Number(
                item.rating
              );


            if (
              rating >= 1 &&
              rating <= 5
            ) {

              counts[
                rating
              ] += 1;

              totalRating +=
                rating;

              validRatings +=
                1;

            }

          }
        );


        const average =
          validRatings
            ? totalRating /
              validRatings
            : 0;


        const positive =
          counts[4] +
          counts[5];


        return {
          total:
            feedback.length,

          average,

          positive,

          counts,
        };

      },
      [
        feedback,
      ]
    );


  const formatDate =
    (
      value
    ) => {

      if (!value) {

        return "-";

      }


      const parsed =
        new Date(
          `${value}T00:00:00`
        );


      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {

        return value;

      }


      return parsed
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


  const renderStars =
    (
      rating,
      size = 16
    ) => {

      const numericRating =
        Number(
          rating
        );


      return [1, 2, 3, 4, 5].map(
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
              numericRating
                ? "currentColor"
                : "none"
            }
          />

        )
      );

    };


  const setRating =
    (
      rating
    ) => {

      setRatingFilter(
        String(
          rating
        )
      );

    };


  return (

    <Layout>

      <div className="page-content receptionist-feedback-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST
            </p>


            <h1>
              Patient Feedback
            </h1>


            <p className="page-description">

              Review patient ratings,
              consultation comments and
              overall service feedback.

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
                fetchFeedback(
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


        <div className="receptionist-feedback-stats">


          <button
            type="button"
            className={
              ratingFilter ===
              "ALL"
                ? "receptionist-feedback-stat active"
                : "receptionist-feedback-stat"
            }
            onClick={
              () =>
                setRatingFilter(
                  "ALL"
                )
            }
          >

            <MessageSquare
              size={19}
            />

            <div>

              <strong>
                {
                  stats.total
                }
              </strong>

              <span>
                Total Reviews
              </span>

            </div>

          </button>


          <div className="receptionist-feedback-stat static">

            <Star
              size={19}
              fill="currentColor"
            />

            <div>

              <strong>

                {
                  stats.average
                    .toFixed(
                      1
                    )
                }

              </strong>

              <span>
                Average Rating
              </span>

            </div>

          </div>


          <button
            type="button"
            className={
              ratingFilter ===
              "5"
                ? "receptionist-feedback-stat active"
                : "receptionist-feedback-stat"
            }
            onClick={
              () =>
                setRating(
                  5
                )
            }
          >

            <Star
              size={19}
            />

            <div>

              <strong>
                {
                  stats.counts[5]
                }
              </strong>

              <span>
                5 Star Reviews
              </span>

            </div>

          </button>


          <button
            type="button"
            className={
              ratingFilter ===
              "4"
                ? "receptionist-feedback-stat active"
                : "receptionist-feedback-stat"
            }
            onClick={
              () =>
                setRating(
                  4
                )
            }
          >

            <Star
              size={19}
            />

            <div>

              <strong>
                {
                  stats.counts[4]
                }
              </strong>

              <span>
                4 Star Reviews
              </span>

            </div>

          </button>


          <div className="receptionist-feedback-stat static">

            <Star
              size={19}
            />

            <div>

              <strong>

                {
                  stats.total
                    ? Math.round(
                        (
                          stats.positive /
                          stats.total
                        ) *
                          100
                      )
                    : 0
                }%

              </strong>

              <span>
                Positive Reviews
              </span>

            </div>

          </div>


        </div>


        <div className="card receptionist-feedback-card">

          <div className="appointment-filter-grid">

            <div className="search-box">

              <Search
                size={18}
              />


              <input
                type="text"
                placeholder="Search patient, doctor or feedback..."
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


            <div className="appointment-filter">

              <Star
                size={17}
              />


              <select
                value={
                  ratingFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setRatingFilter(
                      event
                        .target
                        .value
                    )
                }
              >

                {
                  RATING_OPTIONS.map(
                    (
                      rating
                    ) => (

                      <option
                        key={
                          rating
                        }
                        value={
                          rating
                        }
                      >

                        {
                          rating ===
                          "ALL"
                            ? "All Ratings"
                            : `${rating} ${
                                rating ===
                                "1"
                                  ? "Star"
                                  : "Stars"
                              }`
                        }

                      </option>

                    )
                  )
                }

              </select>

            </div>

          </div>


          <div className="receptionist-feedback-summary">

            <div className="receptionist-feedback-rating-overview">

              <div className="receptionist-feedback-average">

                <strong>

                  {
                    stats.average
                      .toFixed(
                        1
                      )
                  }

                </strong>

                <span>
                  out of 5
                </span>

              </div>


              <div>

                <div className="feedback-stars receptionist-feedback-stars-large">

                  {
                    renderStars(
                      Math.round(
                        stats.average
                      ),
                      18
                    )
                  }

                </div>


                <p>

                  Based on {
                    stats.total
                  } patient {
                    stats.total ===
                    1
                      ? "review"
                      : "reviews"
                  }.

                </p>

              </div>

            </div>


            <div className="receptionist-feedback-breakdown">

              {
                [5, 4, 3, 2, 1].map(
                  (
                    rating
                  ) => {

                    const count =
                      stats.counts[
                        rating
                      ];


                    const percent =
                      stats.total
                        ? (
                            count /
                            stats.total
                          ) *
                          100
                        : 0;


                    return (

                      <button
                        type="button"
                        key={
                          rating
                        }
                        className="receptionist-rating-row"
                        onClick={
                          () =>
                            setRating(
                              rating
                            )
                        }
                      >

                        <span>
                          {
                            rating
                          }
                        </span>


                        <Star
                          size={13}
                          fill="currentColor"
                        />


                        <div className="receptionist-rating-track">

                          <span
                            style={{
                              width:
                                `${percent}%`,
                            }}
                          />

                        </div>


                        <strong>
                          {
                            count
                          }
                        </strong>

                      </button>

                    );

                  }
                )
              }

            </div>

          </div>


          <div className="feedback-list receptionist-feedback-list">

            {
              loading ? (

                <div className="empty-state">

                  Loading feedback...

                </div>

              ) : filteredFeedback
                .length ===
                0 ? (

                <div className="empty-state">

                  No feedback found.

                </div>

              ) : (

                filteredFeedback
                  .map(
                    (
                      item
                    ) => (

                      <article
                        className="feedback-review-card receptionist-feedback-review"
                        key={
                          item.id
                        }
                      >

                        <div className="feedback-review-icon">

                          <MessageSquare
                            size={20}
                          />

                        </div>


                        <div className="feedback-review-content">

                          <div className="feedback-review-header receptionist-feedback-review-header">

                            <div className="receptionist-feedback-person">

                              <div className="receptionist-feedback-avatar">

                                <UserRound
                                  size={17}
                                />

                              </div>


                              <div>

                                <strong>

                                  {
                                    item.patient_name ||
                                    "Patient"
                                  }

                                </strong>


                                <span>

                                  reviewed Dr. {
                                    item.doctor_name ||
                                    "-"
                                  }

                                </span>

                              </div>

                            </div>


                            <div className="receptionist-feedback-rating-block">

                              <div className="feedback-stars">

                                {
                                  renderStars(
                                    item.rating
                                  )
                                }

                              </div>


                              <strong>

                                {
                                  Number(
                                    item.rating ||
                                    0
                                  )
                                }/5

                              </strong>

                            </div>

                          </div>


                          <div className="receptionist-feedback-doctor-row">

                            <span>

                              <Stethoscope
                                size={14}
                              />

                              Dr. {
                                item.doctor_name ||
                                "-"
                              }

                            </span>


                            <span>

                              <CalendarDays
                                size={14}
                              />

                              {
                                formatDate(
                                  item.appointment_date
                                )
                              }

                            </span>

                          </div>


                          <p className="receptionist-feedback-comment">

                            {
                              item.comment ||
                              "No comment provided."
                            }

                          </p>

                        </div>

                      </article>

                    )
                  )

              )
            }

          </div>

        </div>

      </div>

    </Layout>

  );

}


export default ReceptionistFeedback;

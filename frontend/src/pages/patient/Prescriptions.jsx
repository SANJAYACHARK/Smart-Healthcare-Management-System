import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  Download,
  Loader2,
  Pill,
  RefreshCw,
  Search,
  Stethoscope,
  Utensils,
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

  const [
    downloadingId,
    setDownloadingId,
  ] = useState(null);



  const [
    followUpFilter,
    setFollowUpFilter,
  ] = useState("ALL");


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


  const loadPrescriptions =
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


        const response =
  await api.get(
    "/medical-records/patient/prescriptions/"
  );


        setPrescriptions(
          getResults(
            response
          )
        );

      } catch (err) {

        console.error(
          "Prescription load error:",
          err
        );


        setPrescriptions([]);


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to load prescriptions."
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

    loadPrescriptions();

  }, []);


  const downloadPrescriptionPDF =
    async (
      prescriptionId
    ) => {

      try {

        setDownloadingId(
          prescriptionId
        );

        const response =
          await api.get(
            `/medical-records/prescriptions/${prescriptionId}/pdf/`,
            {
              responseType: "blob",
            }
          );

        const blob =
          new Blob(
            [response.data],
            {
              type: "application/pdf",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          `SmartCare_Prescription_RX-${String(
            prescriptionId
          ).padStart(
            6,
            "0"
          )}.pdf`;

        document.body.appendChild(
          link
        );

        link.click();
        link.remove();

        window.URL.revokeObjectURL(
          url
        );

      } catch (err) {

        console.error(
          "Prescription PDF download error:",
          err
        );

        setError(
          err.response?.data?.detail ||
          "Unable to download prescription PDF."
        );

      } finally {

        setDownloadingId(
          null
        );

      }

    };


  const formatDate = (
    value
  ) => {

    if (
      !value
    ) {

      return "-";

    }


    const safeValue =
      String(value)
        .includes("T")
        ? value
        : `${value}T00:00:00`;


    const date =
      new Date(
        safeValue
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


  const hasUpcomingFollowUp = (
    prescription
  ) => {

    if (
      !prescription
        .follow_up_date
    ) {

      return false;

    }


    const date =
      new Date(
        `${prescription.follow_up_date}T00:00:00`
      );


    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );


    return (
      !Number.isNaN(
        date.getTime()
      ) &&
      date >= today
    );

  };


  const getMedicines = (
    prescription
  ) => {

    const medicines =
      prescription.medicines ||
      prescription.items ||
      [];


    return Array.isArray(
      medicines
    )
      ? medicines
      : [];

  };


  const filteredPrescriptions =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return prescriptions.filter(
          (
            prescription
          ) => {

            const medicines =
              getMedicines(
                prescription
              );


            const medicineText =
              medicines
                .map(
                  (
                    medicine
                  ) =>
                    [
                      medicine
                        .medicine_name,
                      medicine.name,
                      medicine.dosage,
                      medicine.frequency,
                      medicine.duration,
                    ]
                      .filter(Boolean)
                      .join(" ")
                )
                .join(" ");


            const searchable =
              [
                prescription
                  .doctor_name,
                prescription
                  .doctor
                  ?.name,
                prescription
                  .diagnosis,
                prescription
                  .notes,
                medicineText,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              !text ||
              searchable.includes(
                text
              );


            const upcoming =
              hasUpcomingFollowUp(
                prescription
              );


            const matchesFollowUp =
              followUpFilter ===
              "ALL" ||
              (
                followUpFilter ===
                "FOLLOW_UP" &&
                upcoming
              ) ||
              (
                followUpFilter ===
                "NO_FOLLOW_UP" &&
                !upcoming
              );


            return (
              matchesSearch &&
              matchesFollowUp
            );

          }
        );

      },
      [
        prescriptions,
        search,
        followUpFilter,
      ]
    );


  const stats =
    useMemo(
      () => {

        const doctors =
          new Set();


        let medicineCount =
          0;


        let followUps =
          0;


        prescriptions.forEach(
          (
            prescription
          ) => {

            const doctor =
              prescription
                .doctor_name ||
              prescription
                .doctor
                ?.name;


            if (
              doctor
            ) {

              doctors.add(
                doctor
              );

            }


            medicineCount +=
              getMedicines(
                prescription
              ).length;


            if (
              hasUpcomingFollowUp(
                prescription
              )
            ) {

              followUps += 1;

            }

          }
        );


        return {
          total:
            prescriptions.length,

          doctors:
            doctors.size,

          medicines:
            medicineCount,

          followUps,
        };

      },
      [
        prescriptions,
      ]
    );


  return (

    <Layout>

      <div className="page-content patient-prescriptions-page">


        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              PATIENT
            </p>


            <h1>
              My Prescriptions
            </h1>


            <p className="page-description">

              View medicines, dosage
              instructions and follow-up
              information prescribed by your
              doctors.

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
                loadPrescriptions(
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


        <div className="patient-prescription-stats">


          <div className="patient-prescription-stat">

            <Pill
              size={20}
            />

            <div>

              <strong>
                {stats.total}
              </strong>

              <span>
                Prescriptions
              </span>

            </div>

          </div>


          <div className="patient-prescription-stat">

            <Pill
              size={20}
            />

            <div>

              <strong>
                {stats.medicines}
              </strong>

              <span>
                Medicines
              </span>

            </div>

          </div>


          <div className="patient-prescription-stat">

            <Stethoscope
              size={20}
            />

            <div>

              <strong>
                {stats.doctors}
              </strong>

              <span>
                Prescribing Doctors
              </span>

            </div>

          </div>


          <div className="patient-prescription-stat">

            <CalendarCheck
              size={20}
            />

            <div>

              <strong>
                {stats.followUps}
              </strong>

              <span>
                Upcoming Follow-ups
              </span>

            </div>

          </div>


        </div>


        <div className="card patient-prescription-toolbar">

          <div className="search-box">

            <Search
              size={18}
            />


            <input
              type="text"
              placeholder="Search medicine, doctor, diagnosis or notes..."
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
            value={
              followUpFilter
            }
            onChange={
              (
                event
              ) =>
                setFollowUpFilter(
                  event.target.value
                )
            }
          >

            <option value="ALL">
              All Prescriptions
            </option>

            <option value="FOLLOW_UP">
              Upcoming Follow-up
            </option>

            <option value="NO_FOLLOW_UP">
              No Upcoming Follow-up
            </option>

          </select>

        </div>


        {
          loading ? (

            <div className="card patient-prescription-loading">

              <Loader2
                size={24}
                className="spin"
              />

              <span>
                Loading prescriptions...
              </span>

            </div>

          ) : filteredPrescriptions
            .length ===
            0 ? (

            <div className="card empty-state patient-prescription-empty">

              <Pill
                size={42}
              />


              <h3>

                {
                  prescriptions.length ===
                  0
                    ? "No prescriptions found"
                    : "No matching prescriptions"
                }

              </h3>


              <p>

                {
                  prescriptions.length ===
                  0
                    ? "Prescriptions created by your doctor will appear here."
                    : "Try changing your search or follow-up filter."
                }

              </p>

            </div>

          ) : (

            <div className="prescription-list patient-prescription-list">

              {
                filteredPrescriptions.map(
                  (
                    prescription
                  ) => {

                    const medicines =
                      getMedicines(
                        prescription
                      );


                    return (

                      <article
                        key={
                          prescription.id
                        }
                        className="card prescription-card patient-prescription-card"
                      >


                        <div className="prescription-header">

                          <div className="prescription-title">

                            <div className="prescription-icon">

                              <Pill
                                size={21}
                              />

                            </div>


                            <div>

                              <h3>

                                Prescription #{
                                  prescription.id
                                }

                              </h3>


                              <p>

                                <CalendarDays
                                  size={14}
                                />

                                {
                                  formatDate(
                                    prescription
                                      .created_at ||
                                    prescription
                                      .date
                                  )
                                }

                              </p>

                            </div>

                          </div>


                          <div className="patient-prescription-badges">

                            <span className="status-badge status-completed">
                              Prescribed
                            </span>


                            {
                              hasUpcomingFollowUp(
                                prescription
                              ) && (

                                <span className="status-badge status-pending">
                                  Follow-up
                                </span>

                              )
                            }

                            <button
                              type="button"
                              className="btn-small btn-primary prescription-pdf-download-btn"
                              disabled={
                                downloadingId ===
                                prescription.id
                              }
                              onClick={
                                () =>
                                  downloadPrescriptionPDF(
                                    prescription.id
                                  )
                              }
                            >
                              {
                                downloadingId ===
                                prescription.id
                                  ? (
                                    <Loader2
                                      size={14}
                                      className="spin"
                                    />
                                  )
                                  : (
                                    <Download
                                      size={14}
                                    />
                                  )
                              }

                              {
                                downloadingId ===
                                prescription.id
                                  ? "Preparing..."
                                  : "Download PDF"
                              }
                            </button>

                          </div>

                        </div>


                        <div className="prescription-doctor">

                          <Stethoscope
                            size={17}
                          />

                          <div>

                            <span>
                              Prescribed by
                            </span>


                            <strong>

                              Dr. {
                                prescription
                                  .doctor_name ||
                                prescription
                                  .doctor
                                  ?.name ||
                                "Doctor"
                              }

                            </strong>

                          </div>

                        </div>


                        {
                          prescription
                            .diagnosis && (

                            <div className="prescription-diagnosis">

                              <FileText
                                size={17}
                              />

                              <div>

                                <span>
                                  Diagnosis
                                </span>

                                <strong>

                                  {
                                    prescription
                                      .diagnosis
                                  }

                                </strong>

                              </div>

                            </div>

                          )
                        }


                        <div className="medicine-section">

                          <div className="patient-medicine-heading">

                            <h4>
                              Medicines
                            </h4>


                            <span>

                              {
                                medicines.length
                              } item{
                                medicines.length ===
                                1
                                  ? ""
                                  : "s"
                              }

                            </span>

                          </div>


                          {
                            medicines.length ===
                            0 ? (

                              <p className="text-muted">
                                No medicine details.
                              </p>

                            ) : (

                              <div className="medicine-list">

                                {
                                  medicines.map(
                                    (
                                      medicine,
                                      index
                                    ) => (

                                      <div
                                        key={
                                          medicine.id ||
                                          index
                                        }
                                        className="medicine-card"
                                      >

                                        <div className="medicine-number">

                                          {
                                            index +
                                            1
                                          }

                                        </div>


                                        <div className="medicine-content">

                                          <h4>

                                            {
                                              medicine
                                                .medicine_name ||
                                              medicine
                                                .name ||
                                              "Medicine"
                                            }

                                          </h4>


                                          <div className="medicine-details">


                                            <div>

                                              <span>
                                                Dosage
                                              </span>

                                              <strong>

                                                {
                                                  medicine
                                                    .dosage ||
                                                  "-"
                                                }

                                              </strong>

                                            </div>


                                            <div>

                                              <span>
                                                Frequency
                                              </span>

                                              <strong>

                                                {
                                                  medicine
                                                    .frequency ||
                                                  "-"
                                                }

                                              </strong>

                                            </div>


                                            <div>

                                              <span>
                                                Duration
                                              </span>

                                              <strong>

                                                {
                                                  medicine
                                                    .duration ||
                                                  "-"
                                                }

                                              </strong>

                                            </div>


                                          </div>


                                          {
                                            medicine
                                              .food_instruction && (

                                              <div className="medicine-instruction">

                                                <Utensils
                                                  size={15}
                                                />

                                                {
                                                  medicine
                                                    .food_instruction
                                                }

                                              </div>

                                            )
                                          }


                                          {
                                            medicine
                                              .notes && (

                                              <div className="medicine-instruction">

                                                <FileText
                                                  size={15}
                                                />

                                                {
                                                  medicine
                                                    .notes
                                                }

                                              </div>

                                            )
                                          }

                                        </div>

                                      </div>

                                    )
                                  )
                                }

                              </div>

                            )
                          }

                        </div>


                        {
                          prescription
                            .notes && (

                            <div className="prescription-notes">

                              <FileText
                                size={17}
                              />

                              <div>

                                <span>
                                  Doctor's Notes
                                </span>


                                <p>

                                  {
                                    prescription
                                      .notes
                                  }

                                </p>

                              </div>

                            </div>

                          )
                        }


                        {
                          prescription
                            .follow_up_date && (

                            <div className="prescription-followup">

                              <Clock3
                                size={16}
                              />

                              Follow-up:

                              <strong>

                                {
                                  formatDate(
                                    prescription
                                      .follow_up_date
                                  )
                                }

                              </strong>

                            </div>

                          )
                        }


                      </article>

                    );

                  }
                )
              }

            </div>

          )
        }


      </div>

    </Layout>

  );

}


export default Prescriptions;

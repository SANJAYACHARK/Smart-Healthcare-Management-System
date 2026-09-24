import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarCheck,
  CalendarDays,
  Download,
  FileHeart,
  FileImage,
  FileText,
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


const FILE_TYPES = [
  {
    value: "ALL",
    label: "All Document Types",
  },
  {
    value: "LAB_REPORT",
    label: "Lab Reports",
  },
  {
    value: "SCAN_REPORT",
    label: "Scan / Imaging",
  },
  {
    value: "PRESCRIPTION",
    label: "Prescriptions",
  },
  {
    value: "DISCHARGE_SUMMARY",
    label: "Discharge Summaries",
  },
  {
    value: "REFERRAL",
    label: "Referrals",
  },
  {
    value: "OTHER",
    label: "Other Documents",
  },
];


function MedicalRecords() {

  // =========================================================
  // STATE
  // =========================================================

  const [
    records,
    setRecords,
  ] = useState([]);


  const [
    medicalFiles,
    setMedicalFiles,
  ] = useState([]);


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "records"
  );


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
    followUpFilter,
    setFollowUpFilter,
  ] = useState("ALL");


  const [
    fileTypeFilter,
    setFileTypeFilter,
  ] = useState("ALL");


  const [
    downloadingId,
    setDownloadingId,
  ] = useState(null);


  // =========================================================
  // RESPONSE HELPER
  // =========================================================

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


  // =========================================================
  // LOAD DATA
  // =========================================================

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
          recordsResult,
          filesResult,
        ] =
          await Promise.allSettled(
            [

              api.get(
                "/medical-records/patient/"
              ),

              api.get(
                "/medical-records/patient/files/"
              ),

            ]
          );


        // -----------------------------------------------
        // CONSULTATION RECORDS
        // -----------------------------------------------

        if (
          recordsResult.status ===
          "fulfilled"
        ) {

          setRecords(
            getResults(
              recordsResult.value
            )
          );

        } else {

          console.error(
            "Patient medical records error:",
            recordsResult.reason
          );

          setRecords([]);

        }


        // -----------------------------------------------
        // MEDICAL FILES
        // -----------------------------------------------

        if (
          filesResult.status ===
          "fulfilled"
        ) {

          setMedicalFiles(
            getResults(
              filesResult.value
            )
          );

        } else {

          console.error(
            "Patient medical files error:",
            filesResult.reason
          );

          setMedicalFiles([]);

        }


        // -----------------------------------------------
        // ERROR
        // -----------------------------------------------

        if (
          recordsResult.status ===
            "rejected" &&
          filesResult.status ===
            "rejected"
        ) {

          setError(
            "Unable to load your medical records."
          );

        } else if (
          recordsResult.status ===
          "rejected"
        ) {

          setError(
            "Consultation records could not be loaded."
          );

        } else if (
          filesResult.status ===
          "rejected"
        ) {

          setError(
            "Uploaded medical files could not be loaded."
          );

        }


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


  // =========================================================
  // DATE HELPERS
  // =========================================================

  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
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


  // =========================================================
  // FOLLOW-UP
  // =========================================================

  const hasUpcomingFollowUp = (
    record
  ) => {

    if (
      !record.follow_up_date
    ) {

      return false;

    }


    const followUp =
      new Date(
        `${record.follow_up_date}T00:00:00`
      );


    if (
      Number.isNaN(
        followUp.getTime()
      )
    ) {

      return false;

    }


    return (
      followUp >=
      today
    );

  };


  // =========================================================
  // FILTER CONSULTATION RECORDS
  // =========================================================

  const filteredRecords =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return records.filter(
          (
            record
          ) => {

            const searchable =
              [
                record.diagnosis,
                record.symptoms,
                record.clinical_notes,
                record.doctor_name,
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
                record
              );


            const matchesFilter =
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
              matchesFilter
            );

          }
        );

      },
      [
        records,
        search,
        followUpFilter,
      ]
    );


  // =========================================================
  // FILTER MEDICAL FILES
  // =========================================================

  const filteredFiles =
    useMemo(
      () => {

        const text =
          search
            .trim()
            .toLowerCase();


        return medicalFiles.filter(
          (
            item
          ) => {

            const searchable =
              [
                item.title,
                item.description,
                item.file_type,
                item.file_type_display,
                item.doctor_name,
                item.uploaded_by_name,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              !text ||
              searchable.includes(
                text
              );


            const matchesType =
              fileTypeFilter ===
                "ALL" ||
              item.file_type ===
                fileTypeFilter;


            return (
              matchesSearch &&
              matchesType
            );

          }
        );

      },
      [
        medicalFiles,
        search,
        fileTypeFilter,
      ]
    );


  // =========================================================
  // STATISTICS
  // =========================================================

  const stats =
    useMemo(
      () => {

        const doctors =
          new Set(
            records
              .map(
                (
                  record
                ) =>
                  record.doctor_name
              )
              .filter(Boolean)
          );


        const followUps =
          records.filter(
            (
              record
            ) =>
              hasUpcomingFollowUp(
                record
              )
          ).length;


        return {

          records:
            records.length,

          files:
            medicalFiles.length,

          doctors:
            doctors.size,

          followUps,

        };

      },
      [
        records,
        medicalFiles,
      ]
    );


  // =========================================================
  // DOWNLOAD MEDICAL FILE
  // =========================================================

  const downloadMedicalFile =
    async (
      item
    ) => {

      try {

        setDownloadingId(
          item.id
        );

        setError("");


        const response =
          await api.get(
            `/medical-records/patient/files/${item.id}/download/`,
            {
              responseType:
                "blob",
            }
          );


        const disposition =
          response.headers[
            "content-disposition"
          ] || "";


        const utfMatch =
          disposition.match(
            /filename\*=UTF-8''([^;]+)/i
          );


        const normalMatch =
          disposition.match(
            /filename="?([^";]+)"?/i
          );


        let filename =
          utfMatch?.[1] ||
          normalMatch?.[1] ||
          item.title ||
          "medical-document";


        try {

          filename =
            decodeURIComponent(
              filename
            );

        } catch {

          // Keep original filename.
        }


        const blobUrl =
          window.URL
            .createObjectURL(
              response.data
            );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          blobUrl;

        link.download =
          filename;


        document.body
          .appendChild(
            link
          );


        link.click();

        link.remove();


        window.URL
          .revokeObjectURL(
            blobUrl
          );


      } catch (err) {

        console.error(
          "Medical file download error:",
          err
        );


        setError(
          err.response
            ?.data
            ?.detail ||
          "Unable to download this medical file."
        );


      } finally {

        setDownloadingId(
          null
        );

      }

    };


  // =========================================================
  // FILE ICON
  // =========================================================

  const getFileIcon = (
    fileType
  ) => {

    if (
      fileType ===
      "SCAN_REPORT"
    ) {

      return (
        <FileImage
          size={22}
        />
      );

    }


    if (
      fileType ===
      "LAB_REPORT"
    ) {

      return (
        <FileHeart
          size={22}
        />
      );

    }


    return (
      <FileText
        size={22}
      />
    );

  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <Layout>

      <div className="page-content patient-medical-records-page">


        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              PATIENT
            </p>


            <h1>
              Medical Records
            </h1>


            <p className="page-description">

              View your consultation history,
              diagnoses, follow-up information
              and medical documents uploaded
              to your SmartCare account.

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


        {/* ===================================================
            ERROR
        ==================================================== */}

        {
          error && (

            <div className="error-message">
              {error}
            </div>

          )
        }


        {/* ===================================================
            STATS
        ==================================================== */}

        <div className="patient-record-stats">


          <div className="patient-record-stat">

            <FileHeart
              size={20}
            />

            <div>

              <strong>
                {stats.records}
              </strong>

              <span>
                Consultation Records
              </span>

            </div>

          </div>


          <div className="patient-record-stat">

            <FileText
              size={20}
            />

            <div>

              <strong>
                {stats.files}
              </strong>

              <span>
                Medical Files
              </span>

            </div>

          </div>


          <div className="patient-record-stat">

            <Stethoscope
              size={20}
            />

            <div>

              <strong>
                {stats.doctors}
              </strong>

              <span>
                Consulting Doctors
              </span>

            </div>

          </div>


          <div className="patient-record-stat">

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


        {/* ===================================================
            TABS
        ==================================================== */}

        <div className="patient-medical-tabs">

          <button
            type="button"
            className={
              activeTab ===
              "records"
                ? "active"
                : ""
            }
            onClick={
              () => {

                setActiveTab(
                  "records"
                );

                setSearch("");

              }
            }
          >

            <FileHeart
              size={17}
            />

            <span>
              Consultation Records
            </span>

            <strong>
              {records.length}
            </strong>

          </button>


          <button
            type="button"
            className={
              activeTab ===
              "files"
                ? "active"
                : ""
            }
            onClick={
              () => {

                setActiveTab(
                  "files"
                );

                setSearch("");

              }
            }
          >

            <FileText
              size={17}
            />

            <span>
              Medical Files
            </span>

            <strong>
              {medicalFiles.length}
            </strong>

          </button>

        </div>


        {/* ===================================================
            TOOLBAR
        ==================================================== */}

        <div className="card patient-record-toolbar">

          <div className="search-box">

            <Search
              size={18}
            />


            <input
              type="text"
              placeholder={
                activeTab ===
                  "records"
                  ? "Search diagnosis, symptoms, doctor or notes..."
                  : "Search medical files, doctor or document type..."
              }
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
            activeTab ===
            "records" ? (

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
                  All Records
                </option>

                <option value="FOLLOW_UP">
                  Upcoming Follow-up
                </option>

                <option value="NO_FOLLOW_UP">
                  No Upcoming Follow-up
                </option>

              </select>

            ) : (

              <select
                value={
                  fileTypeFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setFileTypeFilter(
                      event.target.value
                    )
                }
              >

                {
                  FILE_TYPES.map(
                    (
                      type
                    ) => (

                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                      >

                        {
                          type.label
                        }

                      </option>

                    )
                  )
                }

              </select>

            )
          }

        </div>


        {/* ===================================================
            LOADING
        ==================================================== */}

        {
          loading ? (

            <div className="card patient-record-loading">

              <Loader2
                size={24}
                className="spin"
              />

              <span>
                Loading medical records...
              </span>

            </div>

          ) : activeTab ===
            "records" ? (


            /* ===============================================
               CONSULTATION RECORDS
            ================================================ */

            filteredRecords.length ===
            0 ? (

              <div className="card empty-state patient-record-empty">

                <FileHeart
                  size={38}
                />


                <h3>

                  {
                    records.length ===
                    0
                      ? "No consultation records yet"
                      : "No matching records"
                  }

                </h3>


                <p>

                  {
                    records.length ===
                    0
                      ? "Consultation records will appear here after your doctor completes a consultation."
                      : "Try changing your search or follow-up filter."
                  }

                </p>

              </div>

            ) : (

              <div className="medical-record-grid patient-medical-record-grid">

                {
                  filteredRecords.map(
                    (
                      record
                    ) => (

                      <article
                        className="medical-record-card patient-medical-record-card"
                        key={
                          record.id
                        }
                      >

                        <div className="medical-record-card-header">

                          <div className="medical-record-icon">

                            <FileHeart
                              size={22}
                            />

                          </div>


                          <div className="patient-record-title">

                            <h3>

                              {
                                record.diagnosis ||
                                "Consultation Record"
                              }

                            </h3>


                            <span>

                              <CalendarDays
                                size={14}
                              />

                              {
                                formatDate(
                                  record.appointment_date
                                )
                              }

                            </span>

                          </div>


                          {
                            hasUpcomingFollowUp(
                              record
                            ) && (

                              <span className="status-badge status-pending">
                                Follow-up
                              </span>

                            )
                          }

                        </div>


                        <div className="medical-record-doctor">

                          <Stethoscope
                            size={16}
                          />

                          Dr. {
                            record.doctor_name ||
                            "Doctor"
                          }

                        </div>


                        <div className="record-section">

                          <span>
                            Symptoms
                          </span>

                          <p>

                            {
                              record.symptoms ||
                              "Not recorded."
                            }

                          </p>

                        </div>


                        <div className="record-section">

                          <span>
                            Diagnosis
                          </span>

                          <p>

                            {
                              record.diagnosis ||
                              "Not recorded."
                            }

                          </p>

                        </div>


                        <div className="record-section">

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


                        <div className="patient-record-footer">

                          <div>

                            <span>
                              Follow-up Date
                            </span>

                            <strong>

                              {
                                record.follow_up_date
                                  ? formatDate(
                                      record.follow_up_date
                                    )
                                  : "Not required"
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Record Created
                            </span>

                            <strong>

                              {
                                record.created_at_display ||
                                "-"
                              }

                            </strong>

                          </div>

                        </div>

                      </article>

                    )
                  )
                }

              </div>

            )


          ) : (


            /* ===============================================
               MEDICAL FILES
            ================================================ */

            filteredFiles.length ===
            0 ? (

              <div className="card empty-state patient-record-empty">

                <FileText
                  size={38}
                />


                <h3>

                  {
                    medicalFiles.length ===
                    0
                      ? "No medical files yet"
                      : "No matching medical files"
                  }

                </h3>


                <p>

                  {
                    medicalFiles.length ===
                    0
                      ? "Medical documents uploaded to your account will appear here."
                      : "Try changing your search or document type filter."
                  }

                </p>

              </div>

            ) : (

              <div className="patient-medical-file-grid">

                {
                  filteredFiles.map(
                    (
                      item
                    ) => (

                      <article
                        className="patient-medical-file-card"
                        key={
                          item.id
                        }
                      >

                        {/* HEADER */}

                        <div className="patient-medical-file-header">

                          <div className="patient-medical-file-icon">

                            {
                              getFileIcon(
                                item.file_type
                              )
                            }

                          </div>


                          <div className="patient-medical-file-title">

                            <h3>
                              {
                                item.title ||
                                "Medical Document"
                              }
                            </h3>

                            <span>

                              {
                                item.file_type_display ||
                                item.file_type ||
                                "Medical Document"
                              }

                            </span>

                          </div>

                        </div>


                        {/* DESCRIPTION */}

                        <div className="patient-medical-file-description">

                          <p>

                            {
                              item.description ||
                              "No additional description was provided for this document."
                            }

                          </p>

                        </div>


                        {/* DETAILS */}

                        <div className="patient-medical-file-details">


                          <div>

                            <CalendarDays
                              size={15}
                            />

                            <span>

                              <small>
                                Document Date
                              </small>

                              <strong>

                                {
                                  formatDate(
                                    item.document_date
                                  )
                                }

                              </strong>

                            </span>

                          </div>


                          <div>

                            <Stethoscope
                              size={15}
                            />

                            <span>

                              <small>
                                Doctor
                              </small>

                              <strong>

                                {
                                  item.doctor_name
                                    ? `Dr. ${item.doctor_name}`
                                    : "Not linked"
                                }

                              </strong>

                            </span>

                          </div>


                          <div>

                            <UserRound
                              size={15}
                            />

                            <span>

                              <small>
                                Uploaded By
                              </small>

                              <strong>

                                {
                                  item.uploaded_by_name ||
                                  "SmartCare"
                                }

                              </strong>

                            </span>

                          </div>


                          <div>

                            <CalendarCheck
                              size={15}
                            />

                            <span>

                              <small>
                                Uploaded
                              </small>

                              <strong>

                                {
                                  item.created_at_display ||
                                  "-"
                                }

                              </strong>

                            </span>

                          </div>


                        </div>


                        {/* DOWNLOAD */}

                        <div className="patient-medical-file-footer">

                          <span className="patient-medical-file-secure">

                            Secure patient document

                          </span>


                          <button
                            type="button"
                            className="btn-primary patient-medical-download-btn"
                            disabled={
                              downloadingId ===
                              item.id
                            }
                            onClick={
                              () =>
                                downloadMedicalFile(
                                  item
                                )
                            }
                          >

                            {
                              downloadingId ===
                              item.id ? (

                                <Loader2
                                  size={16}
                                  className="spin"
                                />

                              ) : (

                                <Download
                                  size={16}
                                />

                              )
                            }


                            {
                              downloadingId ===
                              item.id
                                ? "Downloading..."
                                : "Download"
                            }

                          </button>

                        </div>

                      </article>

                    )
                  )
                }

              </div>

            )

          )
        }


      </div>

    </Layout>

  );

}


export default MedicalRecords;
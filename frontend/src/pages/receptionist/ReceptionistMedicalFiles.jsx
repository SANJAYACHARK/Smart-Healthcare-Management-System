import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Download,
  FileHeart,
  FileImage,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import api from "../../api/axios";


const INITIAL_FORM = {
  patient: "",
  file_type: "OTHER",
  title: "",
  description: "",
  document_date: "",
  doctor: "",
  file: null,
};


const FILE_TYPES = [
  {
    value: "LAB_REPORT",
    label: "Lab Report",
  },
  {
    value: "SCAN_REPORT",
    label: "Scan / Imaging Report",
  },
  {
    value: "PRESCRIPTION",
    label: "Prescription",
  },
  {
    value: "DISCHARGE_SUMMARY",
    label: "Discharge Summary",
  },
  {
    value: "REFERRAL",
    label: "Referral",
  },
  {
    value: "OTHER",
    label: "Other Medical Document",
  },
];


function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


function getErrorMessage(
  error,
  fallback
) {
  const data =
    error?.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (data && typeof data === "object") {
    const firstKey =
      Object.keys(data)[0];

    const value =
      firstKey
        ? data[firstKey]
        : null;

    if (Array.isArray(value)) {
      return value[0];
    }

    if (typeof value === "string") {
      return value;
    }
  }

  return fallback;
}


function getPersonName(person) {
  if (!person) {
    return "Unknown";
  }

  const fullName =
    `${person.first_name || ""} ${
      person.last_name || ""
    }`.trim();

  return (
    fullName ||
    person.username ||
    person.email ||
    `User #${person.id}`
  );
}


function formatDate(value) {
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

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function ReceptionistMedicalFiles() {

  const [
    files,
    setFiles,
  ] = useState([]);

  const [
    patients,
    setPatients,
  ] = useState([]);

  const [
    doctors,
    setDoctors,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    downloadingId,
    setDownloadingId,
  ] = useState(null);

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
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("ALL");

  const [
    patientFilter,
    setPatientFilter,
  ] = useState("ALL");

  const [
    showUpload,
    setShowUpload,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );


  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadFiles = async () => {

    try {

      const response =
        await api.get(
          "/medical-records/receptionist/files/"
        );

      setFiles(
        normalizeList(
          response.data
        )
      );

    } catch (err) {

      console.error(
        "Medical files error:",
        err
      );

      throw err;
    }

  };


  const loadPatients = async () => {

    try {

      const response =
        await api.get(
          "/accounts/receptionist/patients/"
        );

      setPatients(
        normalizeList(
          response.data
        )
      );

    } catch (err) {

      console.error(
        "Patients error:",
        err
      );

      throw err;
    }

  };


  const loadDoctors = async () => {

    try {

      const response =
        await api.get(
          "/accounts/receptionist/doctors/"
        );

      setDoctors(
        normalizeList(
          response.data
        )
      );

    } catch (err) {

      console.error(
        "Doctors error:",
        err
      );

      throw err;
    }

  };


  const loadAll = async (
    showLoader = true
  ) => {

    try {

      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const results =
        await Promise.allSettled([
          loadFiles(),
          loadPatients(),
          loadDoctors(),
        ]);

      const rejected =
        results.find(
          (result) =>
            result.status ===
            "rejected"
        );

      if (rejected) {
        setError(
          getErrorMessage(
            rejected.reason,
            "Some medical-file data could not be loaded."
          )
        );
      }

    } finally {

      setLoading(false);
    }

  };


  useEffect(() => {
    loadAll();
  }, []);


  // =========================================================
  // FILTER
  // =========================================================

  const filteredFiles =
    useMemo(() => {

      const text =
        search
          .trim()
          .toLowerCase();

      return files.filter(
        (item) => {

          const matchesSearch =
            !text ||
            [
              item.title,
              item.description,
              item.patient_name,
              item.doctor_name,
              item.uploaded_by_name,
              item.file_type_display,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(text);

          const matchesType =
            typeFilter === "ALL" ||
            item.file_type ===
              typeFilter;

          const matchesPatient =
            patientFilter === "ALL" ||
            String(
              item.patient
            ) ===
              String(
                patientFilter
              );

          return (
            matchesSearch &&
            matchesType &&
            matchesPatient
          );
        }
      );

    }, [
      files,
      search,
      typeFilter,
      patientFilter,
    ]);


  // =========================================================
  // COUNTS
  // =========================================================

  const stats =
    useMemo(
      () => ({
        total:
          files.length,

        lab:
          files.filter(
            (item) =>
              item.file_type ===
              "LAB_REPORT"
          ).length,

        imaging:
          files.filter(
            (item) =>
              item.file_type ===
              "SCAN_REPORT"
          ).length,

        other:
          files.filter(
            (item) =>
              ![
                "LAB_REPORT",
                "SCAN_REPORT",
              ].includes(
                item.file_type
              )
          ).length,
      }),
      [files]
    );


  // =========================================================
  // FORM
  // =========================================================

  const openUpload = () => {

    setForm(
      INITIAL_FORM
    );

    setError("");
    setSuccess("");
    setShowUpload(true);
  };


  const closeUpload = () => {

    if (saving) {
      return;
    }

    setShowUpload(false);

    setForm(
      INITIAL_FORM
    );
  };


  const handleChange =
    (event) => {

      const {
        name,
        value,
        files: inputFiles,
      } = event.target;

      setForm(
        (current) => ({
          ...current,
          [name]:
            name === "file"
              ? inputFiles?.[0] ||
                null
              : value,
        })
      );
    };


  const handleUpload =
    async (event) => {

      event.preventDefault();

      if (!form.patient) {

        setError(
          "Please select a patient."
        );

        return;
      }

      if (
        !form.title.trim()
      ) {

        setError(
          "Please enter a document title."
        );

        return;
      }

      if (!form.file) {

        setError(
          "Please select a PDF, JPG, JPEG or PNG file."
        );

        return;
      }


      try {

        setSaving(true);
        setError("");
        setSuccess("");

        const data =
          new FormData();

        data.append(
          "patient",
          form.patient
        );

        data.append(
          "file_type",
          form.file_type
        );

        data.append(
          "title",
          form.title.trim()
        );

        data.append(
          "description",
          form.description.trim()
        );

        if (
          form.document_date
        ) {
          data.append(
            "document_date",
            form.document_date
          );
        }

        if (form.doctor) {
          data.append(
            "doctor",
            form.doctor
          );
        }

        data.append(
          "file",
          form.file
        );


        await api.post(
          "/medical-records/receptionist/files/",
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


        setSuccess(
          "Medical file uploaded successfully."
        );

        setShowUpload(false);

        setForm(
          INITIAL_FORM
        );

        await loadFiles();

      } catch (err) {

        console.error(
          "Upload medical file error:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to upload medical file."
          )
        );

      } finally {

        setSaving(false);
      }
    };


  // =========================================================
  // DOWNLOAD
  // =========================================================

  const handleDownload =
    async (item) => {

      try {

        setDownloadingId(
          item.id
        );

        setError("");

        const response =
          await api.get(
            `/medical-records/receptionist/files/${item.id}/download/`,
            {
              responseType:
                "blob",
            }
          );

        const disposition =
          response.headers[
            "content-disposition"
          ] || "";

        const match =
          disposition.match(
            /filename="?([^"]+)"?/i
          );

        const extension =
          item.file_type ===
          "LAB_REPORT"
            ? "pdf"
            : "file";

        const filename =
          match?.[1] ||
          `${item.title || "medical-document"}.${extension}`;

        const url =
          window.URL.createObjectURL(
            response.data
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;
        link.download = filename;

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
          "Download medical file error:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to download medical file."
          )
        );

      } finally {

        setDownloadingId(
          null
        );
      }
    };


  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete =
    async (item) => {

      const confirmed =
        window.confirm(
          `Delete "${item.title}"? This will remove the uploaded document.`
        );

      if (!confirmed) {
        return;
      }


      try {

        setDeletingId(
          item.id
        );

        setError("");
        setSuccess("");

        await api.delete(
          `/medical-records/receptionist/files/${item.id}/`
        );

        setFiles(
          (current) =>
            current.filter(
              (file) =>
                file.id !==
                item.id
            )
        );

        setSuccess(
          "Medical file deleted successfully."
        );

      } catch (err) {

        console.error(
          "Delete medical file error:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to delete medical file."
          )
        );

      } finally {

        setDeletingId(
          null
        );
      }
    };


  // =========================================================
  // PAGE
  // =========================================================

  return (

    <Layout>

      <div className="page-content receptionist-medical-files-page">

        {/* HEADER */}

        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              RECEPTIONIST · PATIENT RECORDS
            </p>

            <h1>
              Medical Files
            </h1>

            <p className="page-description">
              Upload and manage patient medical documents.
              Patients can securely download documents from
              their own SmartCare account.
            </p>

          </div>


          <div className="medical-files-header-actions">

            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                loadAll(false)
              }
              disabled={loading}
            >
              <RefreshCw
                size={17}
              />
              Refresh
            </button>


            <button
              type="button"
              className="btn-primary"
              onClick={
                openUpload
              }
            >
              <Plus size={18} />
              Upload Medical File
            </button>

          </div>

        </div>


        {/* MESSAGES */}

        {error && (

          <div className="error-message medical-files-message">
            {error}
          </div>

        )}


        {success && (

          <div className="success-message medical-files-message">
            {success}
          </div>

        )}


        {/* STATS */}

        <div className="medical-files-stats">

          <div className="card medical-file-stat">

            <div className="medical-file-stat-icon">
              <FileHeart size={21} />
            </div>

            <div>
              <strong>
                {stats.total}
              </strong>
              <span>
                Total Files
              </span>
            </div>

          </div>


          <div className="card medical-file-stat">

            <div className="medical-file-stat-icon">
              <FileText size={21} />
            </div>

            <div>
              <strong>
                {stats.lab}
              </strong>
              <span>
                Lab Reports
              </span>
            </div>

          </div>


          <div className="card medical-file-stat">

            <div className="medical-file-stat-icon">
              <FileImage size={21} />
            </div>

            <div>
              <strong>
                {stats.imaging}
              </strong>
              <span>
                Imaging / Scans
              </span>
            </div>

          </div>


          <div className="card medical-file-stat">

            <div className="medical-file-stat-icon">
              <Upload size={21} />
            </div>

            <div>
              <strong>
                {stats.other}
              </strong>
              <span>
                Other Documents
              </span>
            </div>

          </div>

        </div>


        {/* TABLE */}

        <div className="card medical-files-card">

          <div className="medical-files-toolbar">

            <div className="search-box medical-files-search">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search patient, title, doctor or document type..."
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value
                    )
                }
              />

            </div>


            <select
              className="medical-files-filter"
              value={
                patientFilter
              }
              onChange={
                (event) =>
                  setPatientFilter(
                    event.target.value
                  )
              }
            >

              <option value="ALL">
                All Patients
              </option>

              {patients.map(
                (patient) => (

                  <option
                    key={
                      patient.id
                    }
                    value={
                      patient.id
                    }
                  >
                    {
                      getPersonName(
                        patient
                      )
                    }
                  </option>

                )
              )}

            </select>


            <select
              className="medical-files-filter"
              value={
                typeFilter
              }
              onChange={
                (event) =>
                  setTypeFilter(
                    event.target.value
                  )
              }
            >

              <option value="ALL">
                All Document Types
              </option>

              {FILE_TYPES.map(
                (type) => (

                  <option
                    key={
                      type.value
                    }
                    value={
                      type.value
                    }
                  >
                    {type.label}
                  </option>

                )
              )}

            </select>

          </div>


          <div className="table-responsive">

            <table className="data-table medical-files-table">

              <thead>

                <tr>
                  <th>Patient</th>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Document Date</th>
                  <th>Doctor</th>
                  <th>Uploaded By</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="medical-files-empty"
                    >
                      Loading medical files...
                    </td>

                  </tr>

                ) : filteredFiles.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="medical-files-empty"
                    >

                      <div className="medical-files-empty-state">

                        <FileHeart
                          size={34}
                        />

                        <strong>
                          No medical files found
                        </strong>

                        <span>
                          Upload a patient document or change your filters.
                        </span>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredFiles.map(
                    (item) => (

                      <tr key={item.id}>

                        <td>

                          <div className="medical-file-patient">

                            <div className="medical-file-avatar">
                              <UserRound
                                size={17}
                              />
                            </div>

                            <div>

                              <strong>
                                {
                                  item.patient_name ||
                                  `Patient #${item.patient}`
                                }
                              </strong>

                              <span>
                                ID: {
                                  item.patient
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="medical-file-document">

                            <strong>
                              {
                                item.title
                              }
                            </strong>

                            <span>
                              {
                                item.description ||
                                "No description"
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <span className="medical-file-type-badge">
                            {
                              item.file_type_display ||
                              item.file_type
                            }
                          </span>

                        </td>


                        <td>
                          {
                            formatDate(
                              item.document_date
                            )
                          }
                        </td>


                        <td>
                          {
                            item.doctor_name ||
                            "-"
                          }
                        </td>


                        <td>
                          {
                            item.uploaded_by_name ||
                            "-"
                          }
                        </td>


                        <td>

                          <div className="medical-file-actions">

                            <button
                              type="button"
                              className="medical-file-action download"
                              title="Download"
                              aria-label={`Download ${item.title}`}
                              disabled={
                                downloadingId ===
                                item.id
                              }
                              onClick={() =>
                                handleDownload(
                                  item
                                )
                              }
                            >
                              <Download
                                size={16}
                              />
                            </button>


                            <button
                              type="button"
                              className="medical-file-action delete"
                              title="Delete"
                              aria-label={`Delete ${item.title}`}
                              disabled={
                                deletingId ===
                                item.id
                              }
                              onClick={() =>
                                handleDelete(
                                  item
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* UPLOAD MODAL */}

        {showUpload && (

          <div
            className="modal-overlay medical-file-modal-overlay"
            onMouseDown={
              (event) => {

                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closeUpload();
                }
              }
            }
          >

            <div
              className="modal medical-file-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="medical-file-modal-title"
            >

              <div className="medical-file-modal-header">

                <div>

                  <p className="page-eyebrow">
                    PATIENT DOCUMENT
                  </p>

                  <h2 id="medical-file-modal-title">
                    Upload Medical File
                  </h2>

                  <p>
                    PDF, JPG, JPEG or PNG.
                    Maximum file size: 10 MB.
                  </p>

                </div>


                <button
                  type="button"
                  className="medical-file-modal-close"
                  onClick={
                    closeUpload
                  }
                  disabled={saving}
                  aria-label="Close upload form"
                >
                  <X size={20} />
                </button>

              </div>


              <form
                onSubmit={
                  handleUpload
                }
              >

                <div className="medical-file-form-grid">

                  <div className="form-group">

                    <label htmlFor="medical-patient">
                      Patient *
                    </label>

                    <select
                      id="medical-patient"
                      name="patient"
                      value={
                        form.patient
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >

                      <option value="">
                        Select patient
                      </option>

                      {patients.map(
                        (patient) => (

                          <option
                            key={
                              patient.id
                            }
                            value={
                              patient.id
                            }
                          >
                            {
                              getPersonName(
                                patient
                              )
                            }
                            {
                              patient.username
                                ? ` (${patient.username})`
                                : ""
                            }
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="form-group">

                    <label htmlFor="medical-type">
                      Document Type *
                    </label>

                    <select
                      id="medical-type"
                      name="file_type"
                      value={
                        form.file_type
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >

                      {FILE_TYPES.map(
                        (type) => (

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
                      )}

                    </select>

                  </div>


                  <div className="form-group medical-file-form-full">

                    <label htmlFor="medical-title">
                      Document Title *
                    </label>

                    <input
                      id="medical-title"
                      name="title"
                      type="text"
                      placeholder="Example: MRI Brain Report"
                      value={
                        form.title
                      }
                      onChange={
                        handleChange
                      }
                      maxLength="200"
                      required
                    />

                  </div>


                  <div className="form-group">

                    <label htmlFor="medical-date">
                      Document Date
                    </label>

                    <input
                      id="medical-date"
                      name="document_date"
                      type="date"
                      value={
                        form.document_date
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  <div className="form-group">

                    <label htmlFor="medical-doctor">
                      Doctor
                    </label>

                    <select
                      id="medical-doctor"
                      name="doctor"
                      value={
                        form.doctor
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="">
                        Not linked to a doctor
                      </option>

                      {doctors.map(
                        (doctor) => (

                          <option
                            key={
                              doctor.id
                            }
                            value={
                              doctor.id
                            }
                          >
                            {
                              getPersonName(
                                doctor
                              )
                            }
                            {
                              doctor.specialization
                                ? ` — ${doctor.specialization}`
                                : ""
                            }
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="form-group medical-file-form-full">

                    <label htmlFor="medical-description">
                      Description
                    </label>

                    <textarea
                      id="medical-description"
                      name="description"
                      rows="4"
                      placeholder="Optional notes about this document..."
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  <div className="form-group medical-file-form-full">

                    <label htmlFor="medical-upload">
                      Medical File *
                    </label>

                    <label
                      className="medical-file-dropzone"
                      htmlFor="medical-upload"
                    >

                      <Upload
                        size={25}
                      />

                      <strong>
                        {
                          form.file
                            ? form.file.name
                            : "Choose medical document"
                        }
                      </strong>

                      <span>
                        PDF, JPG, JPEG or PNG · Maximum 10 MB
                      </span>

                    </label>

                    <input
                      id="medical-upload"
                      className="medical-file-hidden-input"
                      name="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                </div>


                <div className="medical-file-modal-actions">

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={
                      closeUpload
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    <Upload
                      size={17}
                    />

                    {
                      saving
                        ? "Uploading..."
                        : "Upload File"
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


export default ReceptionistMedicalFiles;

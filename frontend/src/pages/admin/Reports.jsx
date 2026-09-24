import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  LoaderCircle,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../api/axios";
import Layout from "../../components/layout/Layout";


const types = [
  {
    value: "appointments",
    label: "Appointments",
    icon: CalendarDays,
  },
  {
    value: "billing",
    label: "Billing & Payments",
    icon: WalletCards,
  },
  {
    value: "laboratory",
    label: "Laboratory",
    icon: FlaskConical,
  },
  {
    value: "patients",
    label: "Patients",
    icon: Users,
  },
  {
    value: "doctors",
    label: "Doctors",
    icon: Stethoscope,
  },
];


const dateISO = (date) => {
  return date
    .toISOString()
    .slice(0, 10);
};


const startDefault = () => {

  const date = new Date();

  date.setDate(
    date.getDate() - 29
  );

  return dateISO(date);
};


function Reports() {

  const [
    type,
    setType,
  ] = useState(
    "appointments"
  );


  const [
    start,
    setStart,
  ] = useState(
    startDefault
  );


  const [
    end,
    setEnd,
  ] = useState(
    () => dateISO(
      new Date()
    )
  );


  const [
    summary,
    setSummary,
  ] = useState(null);


  const [
    preview,
    setPreview,
  ] = useState({
    rows: [],
    count: 0,
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    exporting,
    setExporting,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  // ======================================================
  // DATE PARAMETERS
  // ======================================================

  const params = useMemo(
    () => ({
      start_date: start,
      end_date: end,
    }),
    [
      start,
      end,
    ]
  );


  // ======================================================
  // LOAD REPORT DATA
  // ======================================================

  const load = useCallback(
    async () => {

      try {

        setLoading(true);
        setError("");


        const [
          summaryResponse,
          previewResponse,
        ] = await Promise.all([
          api.get(
            "/reports/admin/summary/",
            {
              params,
            }
          ),

          api.get(
            "/reports/admin/preview/",
            {
              params: {
                ...params,
                type,
              },
            }
          ),
        ]);


        setSummary(
          summaryResponse.data
        );

        setPreview(
          previewResponse.data
        );

      } catch (err) {

        console.error(
          "Report loading error:",
          err
        );

        setError(
          err.response?.data?.detail ||
          "Unable to load reports."
        );

      } finally {

        setLoading(false);

      }

    },
    [
      params,
      type,
    ]
  );


  useEffect(
    () => {
      load();
    },
    [
      load,
    ]
  );


  // ======================================================
  // DOWNLOAD REPORT
  // ======================================================

  const download = async (
    exportFormat
  ) => {

    try {

      setExporting(
        exportFormat
      );

      setError("");


      const response =
        await api.get(
          "/reports/admin/export/",
          {
            params: {
              ...params,
              type,

              // IMPORTANT:
              // Do not use "format".
              export_format:
                exportFormat,
            },

            responseType:
              "blob",
          }
        );


      // ---------------------------------------------------
      // Detect API errors returned as Blob
      // ---------------------------------------------------

      const contentType =
        response.headers[
          "content-type"
        ] || "";


      if (
        contentType.includes(
          "application/json"
        )
      ) {

        const text =
          await response.data.text();

        const data =
          JSON.parse(text);

        throw new Error(
          data.detail ||
          "Unable to export report."
        );

      }


      // ---------------------------------------------------
      // Create browser download
      // ---------------------------------------------------

      const blobUrl =
        window.URL.createObjectURL(
          response.data
        );


      const link =
        document.createElement(
          "a"
        );


      link.href = blobUrl;


      // ---------------------------------------------------
      // Get filename from backend
      // ---------------------------------------------------

      const disposition =
        response.headers[
          "content-disposition"
        ] || "";


      const filenameMatch =
        disposition.match(
          /filename="?([^"]+)"?/i
        );


      link.download =
        filenameMatch?.[1] ||
        `smartcare_${type}.${exportFormat}`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.URL.revokeObjectURL(
        blobUrl
      );

    } catch (err) {

      console.error(
        "Report export error:",
        err
      );


      // Axios error response may also be a Blob.
      let message =
        "Unable to export report.";


      if (
        err.response?.data
        instanceof Blob
      ) {

        try {

          const text =
            await err.response.data.text();

          const data =
            JSON.parse(text);

          message =
            data.detail ||
            message;

        } catch {
          // Keep fallback message.
        }

      } else if (
        err.response?.data?.detail
      ) {

        message =
          err.response.data.detail;

      } else if (
        err.message
      ) {

        message =
          err.message;

      }


      setError(message);

    } finally {

      setExporting("");

    }

  };


  const k =
    summary?.kpis || {};


  const currentReport =
    types.find(
      (item) =>
        item.value === type
    );


  return (

    <Layout>

      <div className="page-content reports-page">

        {/* ===============================================
            HEADER
        ================================================ */}

        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              ADMINISTRATION
            </p>

            <h1>
              Reports & Exports
            </h1>

            <p className="page-description">
              Generate operational reports from live
              SmartCare data and export them as Excel,
              CSV or PDF.
            </p>

          </div>


          <button
            type="button"
            className="btn-secondary"
            onClick={load}
            disabled={loading}
          >

            {loading ? (
              <LoaderCircle
                className="spin"
                size={16}
              />
            ) : (
              <RefreshCw
                size={16}
              />
            )}

            Refresh

          </button>

        </div>


        {/* ===============================================
            ERROR
        ================================================ */}

        {error && (

          <div className="error-message">

            {error}

          </div>

        )}


        {/* ===============================================
            FILTERS
        ================================================ */}

        <div className="reports-filter card">

          <label>

            <span>
              Report
            </span>

            <select
              value={type}
              onChange={
                (event) =>
                  setType(
                    event.target.value
                  )
              }
            >

              {types.map(
                (item) => (

                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>

                )
              )}

            </select>

          </label>


          <label>

            <span>
              From
            </span>

            <input
              type="date"
              value={start}
              max={end}
              onChange={
                (event) =>
                  setStart(
                    event.target.value
                  )
              }
            />

          </label>


          <label>

            <span>
              To
            </span>

            <input
              type="date"
              value={end}
              min={start}
              onChange={
                (event) =>
                  setEnd(
                    event.target.value
                  )
              }
            />

          </label>


          <div className="reports-export-actions">

            <button
              type="button"
              className="btn-secondary"
              disabled={
                !!exporting
              }
              onClick={
                () =>
                  download("xlsx")
              }
            >

              <FileSpreadsheet
                size={16}
              />

              {exporting === "xlsx"
                ? "Exporting..."
                : "Excel"}

            </button>


            <button
              type="button"
              className="btn-secondary"
              disabled={
                !!exporting
              }
              onClick={
                () =>
                  download("csv")
              }
            >

              <Download
                size={16}
              />

              {exporting === "csv"
                ? "Exporting..."
                : "CSV"}

            </button>


            <button
              type="button"
              className="btn-primary"
              disabled={
                !!exporting
              }
              onClick={
                () =>
                  download("pdf")
              }
            >

              <FileText
                size={16}
              />

              {exporting === "pdf"
                ? "Exporting..."
                : "PDF"}

            </button>

          </div>

        </div>


        {/* ===============================================
            KPI CARDS
        ================================================ */}

        <div className="reports-kpis">

          <div className="card">

            <span>
              Appointments
            </span>

            <strong>
              {k.appointments ?? 0}
            </strong>

            <small>
              {k.completed_appointments ?? 0}
              {" "}completed
            </small>

          </div>


          <div className="card">

            <span>
              Collected
            </span>

            <strong>
              ₹
              {Number(
                k.collected_amount || 0
              ).toLocaleString(
                "en-IN"
              )}
            </strong>

            <small>
              ₹
              {Number(
                k.billed_amount || 0
              ).toLocaleString(
                "en-IN"
              )}
              {" "}billed
            </small>

          </div>


          <div className="card">

            <span>
              Lab Requests
            </span>

            <strong>
              {k.lab_requests ?? 0}
            </strong>

            <small>
              {k.completed_labs ?? 0}
              {" "}completed
            </small>

          </div>


          <div className="card">

            <span>
              New Patients
            </span>

            <strong>
              {k.new_patients ?? 0}
            </strong>

            <small>
              {k.new_doctors ?? 0}
              {" "}new doctors
            </small>

          </div>

        </div>


        {/* ===============================================
            PREVIEW TABLE
        ================================================ */}

        <div className="card reports-table-card">

          <div className="reports-table-head">

            <div>

              <h2>
                {currentReport?.label}
                {" "}Preview
              </h2>

              <p>
                {preview.count || 0}
                {" "}record(s) in selected period.
                Preview shows up to 100.
              </p>

            </div>

            <Search size={18} />

          </div>


          {loading ? (

            <div className="loading-screen">

              <LoaderCircle
                className="spin"
                size={22}
              />

              Loading report...

            </div>

          ) : preview.rows?.length ? (

            <div className="table-responsive">

              <table className="data-table">

                <thead>

                  <tr>

                    {Object.keys(
                      preview.rows[0]
                    ).map(
                      (heading) => (

                        <th
                          key={heading}
                        >
                          {heading}
                        </th>

                      )
                    )}

                  </tr>

                </thead>


                <tbody>

                  {preview.rows.map(
                    (row, index) => (

                      <tr key={index}>

                        {Object.keys(
                          preview.rows[0]
                        ).map(
                          (heading) => (

                            <td
                              key={heading}
                            >
                              {String(
                                row[
                                  heading
                                ] ?? ""
                              )}
                            </td>

                          )
                        )}

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="empty-state">

              No records found for the
              selected period.

            </div>

          )}

        </div>

      </div>

    </Layout>

  );

}


export default Reports;
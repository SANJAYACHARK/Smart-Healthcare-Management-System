import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Clock3,
  FileSearch,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import api from "../../api/axios";


const ROLES = [
  "ALL",
  "ADMIN",
  "DOCTOR",
  "RECEPTIONIST",
  "PATIENT",
];

const ACTIONS = [
  "ALL",
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "OTHER",
];

const DAYS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
  { value: "ALL", label: "All time" },
];


function AuditLogs() {

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [module, setModule] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [days, setDays] = useState("30");

  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 25;


  const modules = useMemo(
    () => [
      "ALL",
      ...(summary?.modules || []),
    ],
    [summary]
  );


  const loadSummary = async () => {
    const response = await api.get(
      "/audit-logs/admin/summary/"
    );
    setSummary(response.data);
  };


  const loadLogs = async ({
    showRefresh = false,
    requestedPage = page,
  } = {}) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {
        page: requestedPage,
        page_size: pageSize,
        days,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (role !== "ALL") {
        params.role = role;
      }

      if (module !== "ALL") {
        params.module = module;
      }

      if (action !== "ALL") {
        params.action = action;
      }

      const response = await api.get(
        "/audit-logs/admin/",
        { params }
      );

      setLogs(response.data?.results || []);
      setCount(response.data?.count || 0);

    } catch (err) {

      console.error(
        "Audit log load error:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to load audit logs."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  useEffect(() => {

    const timer = setTimeout(
      () => {
        setPage(1);
        loadLogs({
          requestedPage: 1,
        });
      },
      300
    );

    return () => clearTimeout(timer);

  }, [
    search,
    role,
    module,
    action,
    days,
  ]);


  useEffect(() => {

    loadSummary().catch(
      (err) => {
        console.error(
          "Audit summary error:",
          err
        );
      }
    );

  }, []);


  const totalPages = Math.max(
    1,
    Math.ceil(count / pageSize)
  );


  const changePage = (
    nextPage
  ) => {

    const safePage = Math.min(
      Math.max(nextPage, 1),
      totalPages
    );

    setPage(safePage);

    loadLogs({
      requestedPage: safePage,
    });

  };


  const refresh = async () => {

    await Promise.all([
      loadLogs({
        showRefresh: true,
        requestedPage: page,
      }),
      loadSummary(),
    ]);

  };


  const clearFilters = () => {
    setSearch("");
    setRole("ALL");
    setModule("ALL");
    setAction("ALL");
    setDays("30");
  };


  const actionClass = (
    value
  ) =>
    `audit-action audit-action-${String(
      value || "OTHER"
    ).toLowerCase()}`;


  const roleClass = (
    value
  ) =>
    `audit-role audit-role-${String(
      value || "SYSTEM"
    ).toLowerCase()}`;


  return (

    <Layout>

      <div className="page-content admin-audit-page">

        <div className="page-header page-header-actions">

          <div>

            <p className="page-eyebrow">
              ADMINISTRATION
            </p>

            <h1>
              Audit Logs
            </h1>

            <p className="page-description">
              Review authenticated write activity across hospital modules.
            </p>

          </div>

          <button
            type="button"
            className="btn-secondary"
            disabled={refreshing}
            onClick={refresh}
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


        <div className="audit-stat-grid">

          <div className="card audit-stat-card">
            <ShieldCheck size={20} />
            <div>
              <strong>
                {summary?.total ?? 0}
              </strong>
              <span>Total Events</span>
            </div>
          </div>

          <div className="card audit-stat-card">
            <Clock3 size={20} />
            <div>
              <strong>
                {summary?.today ?? 0}
              </strong>
              <span>Today</span>
            </div>
          </div>

          <div className="card audit-stat-card">
            <Activity size={20} />
            <div>
              <strong>
                {summary?.updates ?? 0}
              </strong>
              <span>Updates</span>
            </div>
          </div>

          <div className="card audit-stat-card">
            <Trash2 size={20} />
            <div>
              <strong>
                {summary?.deletes ?? 0}
              </strong>
              <span>Deletes</span>
            </div>
          </div>

        </div>


        <div className="card audit-filter-card">

          <div className="audit-filter-title">
            <Filter size={17} />
            <strong>Filters</strong>
          </div>

          <div className="audit-filter-grid">

            <div className="search-box audit-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search user, description, path, object or IP..."
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
              value={role}
              onChange={
                (event) =>
                  setRole(
                    event.target.value
                  )
              }
            >
              {
                ROLES.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {
                        item === "ALL"
                          ? "All Roles"
                          : item
                      }
                    </option>
                  )
                )
              }
            </select>

            <select
              value={module}
              onChange={
                (event) =>
                  setModule(
                    event.target.value
                  )
              }
            >
              {
                modules.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {
                        item === "ALL"
                          ? "All Modules"
                          : item.replaceAll(
                              "_",
                              " "
                            )
                      }
                    </option>
                  )
                )
              }
            </select>

            <select
              value={action}
              onChange={
                (event) =>
                  setAction(
                    event.target.value
                  )
              }
            >
              {
                ACTIONS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {
                        item === "ALL"
                          ? "All Actions"
                          : item
                      }
                    </option>
                  )
                )
              }
            </select>

            <select
              value={days}
              onChange={
                (event) =>
                  setDays(
                    event.target.value
                  )
              }
            >
              {
                DAYS.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  )
                )
              }
            </select>

            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
            >
              Clear
            </button>

          </div>

        </div>


        <div className="card audit-table-card">

          <div className="audit-table-heading">

            <div>
              <h2>Activity History</h2>
              <p>
                {count} matching event{count === 1 ? "" : "s"}
              </p>
            </div>

            <FileSearch size={21} />

          </div>


          <div className="table-responsive">

            <table className="data-table audit-table">

              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Request</th>
                  <th>IP Address</th>
                </tr>
              </thead>

              <tbody>

                {
                  loading ? (

                    <tr>
                      <td
                        colSpan="8"
                        className="audit-empty-cell"
                      >
                        <Loader2
                          size={19}
                          className="spin"
                        />
                        Loading audit logs...
                      </td>
                    </tr>

                  ) : logs.length === 0 ? (

                    <tr>
                      <td
                        colSpan="8"
                        className="audit-empty-cell"
                      >
                        No audit events match the selected filters.
                      </td>
                    </tr>

                  ) : (

                    logs.map(
                      (log) => (

                        <tr key={log.id}>

                          <td className="audit-time-cell">
                            <strong>
                              {log.created_at_display}
                            </strong>
                          </td>

                          <td>
                            <div className="table-user">
                              <div className="table-avatar">
                                <UserRound size={15} />
                              </div>
                              <div>
                                <strong>
                                  {log.actor_display}
                                </strong>
                                {
                                  log.actor_username &&
                                  log.actor_display !==
                                    log.actor_username && (
                                    <span className="table-secondary">
                                      @{log.actor_username}
                                    </span>
                                  )
                                }
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={
                                roleClass(
                                  log.role
                                )
                              }
                            >
                              {log.role || "SYSTEM"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                actionClass(
                                  log.action
                                )
                              }
                            >
                              {log.action}
                            </span>
                          </td>

                          <td>
                            <strong className="audit-module">
                              {
                                String(
                                  log.module || "-"
                                ).replaceAll(
                                  "_",
                                  " "
                                )
                              }
                            </strong>
                          </td>

                          <td className="audit-description">
                            {log.description}
                          </td>

                          <td>
                            <div className="audit-request">
                              <strong>
                                {log.request_method}
                              </strong>
                              <span>
                                {log.request_path}
                              </span>
                              {
                                log.response_status && (
                                  <small>
                                    HTTP {log.response_status}
                                  </small>
                                )
                              }
                            </div>
                          </td>

                          <td>
                            <span className="table-secondary">
                              {log.ip_address || "-"}
                            </span>
                          </td>

                        </tr>

                      )
                    )

                  )
                }

              </tbody>

            </table>

          </div>


          <div className="audit-pagination">

            <button
              type="button"
              className="btn-secondary"
              disabled={
                page <= 1 ||
                loading
              }
              onClick={
                () =>
                  changePage(
                    page - 1
                  )
              }
            >
              Previous
            </button>

            <span>
              Page <strong>{page}</strong> of{" "}
              <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              className="btn-secondary"
              disabled={
                page >= totalPages ||
                loading
              }
              onClick={
                () =>
                  changePage(
                    page + 1
                  )
              }
            >
              Next
            </button>

          </div>

        </div>

      </div>

    </Layout>

  );

}


export default AuditLogs;

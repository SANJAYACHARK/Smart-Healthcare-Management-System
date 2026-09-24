import axios from "axios";


// ==========================================================
// API INSTANCE
// ==========================================================

const API_BASE_URL =
  "http://127.0.0.1:8000/api";


const api = axios.create({

  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },

});


// ==========================================================
// TOKEN HELPERS
// ==========================================================

const getAccessToken = () =>
  localStorage.getItem(
    "access_token"
  );


const getRefreshToken = () =>
  localStorage.getItem(
    "refresh_token"
  );


const clearTokens = () => {

  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

};


// ==========================================================
// REQUEST INTERCEPTOR
// Attach JWT access token
// ==========================================================

api.interceptors.request.use(

  (config) => {

    const accessToken =
      getAccessToken();


    if (accessToken) {

      config.headers =
        config.headers || {};


      config.headers.Authorization =
        `Bearer ${accessToken}`;

    }


    return config;

  },

  (error) =>
    Promise.reject(error)

);


// ==========================================================
// REFRESH CONTROL
// Prevent multiple simultaneous refresh requests
// ==========================================================

let isRefreshing = false;

let refreshSubscribers = [];


// ==========================================================
// RUN WAITING REQUESTS AFTER REFRESH
// ==========================================================

const processSubscribers =
  (newAccessToken) => {

    refreshSubscribers.forEach(
      (callback) => {

        callback(
          newAccessToken
        );

      }
    );


    refreshSubscribers = [];

  };


// ==========================================================
// RESPONSE INTERCEPTOR
// Refresh expired access token automatically
// ==========================================================

api.interceptors.response.use(

  (response) =>
    response,


  async (error) => {

    const originalRequest =
      error.config;


    if (!originalRequest) {

      return Promise.reject(
        error
      );

    }


    const status =
      error.response?.status;


    // ------------------------------------------------------
    // NOT AUTHENTICATION ERROR
    // ------------------------------------------------------

    if (status !== 401) {

      return Promise.reject(
        error
      );

    }


    // ------------------------------------------------------
    // DON'T REFRESH THESE AUTH REQUESTS
    // ------------------------------------------------------

    const requestUrl =
      originalRequest.url || "";


    const isLoginRequest =
      requestUrl.includes(
        "/accounts/login/"
      );


    const isRefreshRequest =
      requestUrl.includes(
        "/accounts/token/refresh/"
      );


    const isRegisterRequest =
      requestUrl.includes(
        "/accounts/register/"
      );


    if (
      isLoginRequest ||
      isRegisterRequest
    ) {

      return Promise.reject(
        error
      );

    }


    if (isRefreshRequest) {

      clearTokens();

      return Promise.reject(
        error
      );

    }


    // ------------------------------------------------------
    // ALREADY RETRIED
    // ------------------------------------------------------

    if (
      originalRequest._retry
    ) {

      return Promise.reject(
        error
      );

    }


    const refreshToken =
      getRefreshToken();


    // ------------------------------------------------------
    // NO REFRESH TOKEN
    // ------------------------------------------------------

    if (!refreshToken) {

      clearTokens();

      window.location.replace(
        "/login"
      );


      return Promise.reject(
        error
      );

    }


    // ------------------------------------------------------
    // ANOTHER REQUEST IS ALREADY REFRESHING
    // ------------------------------------------------------

    if (isRefreshing) {

      return new Promise(
        (resolve) => {

          refreshSubscribers.push(
            (newAccessToken) => {

              originalRequest.headers =
                originalRequest.headers ||
                {};


              originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;


              resolve(
                api(originalRequest)
              );

            }
          );

        }
      );

    }


    // ------------------------------------------------------
    // REFRESH TOKEN
    // ------------------------------------------------------

    originalRequest._retry =
      true;

    isRefreshing =
      true;


    try {

      const response =
        await axios.post(

          `${API_BASE_URL}/accounts/token/refresh/`,

          {
            refresh:
              refreshToken,
          }

        );


      const newAccessToken =
        response.data?.access;


      if (!newAccessToken) {

        throw new Error(
          "No access token returned."
        );

      }


      localStorage.setItem(
        "access_token",
        newAccessToken
      );


      processSubscribers(
        newAccessToken
      );


      originalRequest.headers =
        originalRequest.headers ||
        {};


      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;


      return api(
        originalRequest
      );

    } catch (refreshError) {

      console.error(
        "Token refresh failed:",
        refreshError
      );


      refreshSubscribers =
        [];


      clearTokens();


      window.location.replace(
        "/login"
      );


      return Promise.reject(
        refreshError
      );

    } finally {

      isRefreshing =
        false;

    }

  }

);


export default api;
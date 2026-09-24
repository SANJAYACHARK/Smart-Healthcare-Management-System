import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";


// =========================================================
// CONTEXT
// =========================================================

const AuthContext =
  createContext(null);


// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({
  children,
}) {

  const [
    user,
    setUser,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(
    Boolean(
      localStorage.getItem(
        "access_token"
      )
    )
  );


  // =======================================================
  // CLEAR AUTH
  // =======================================================

  const clearAuth = () => {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );


    setUser(null);

    setIsAuthenticated(
      false
    );

  };


  // =======================================================
  // REFRESH CURRENT USER
  // =======================================================

  const refreshUser =
    async () => {

      const response =
        await api.get(
          "/accounts/profile/"
        );


      setUser(
        response.data
      );


      setIsAuthenticated(
        true
      );


      return response.data;

    };


  // =======================================================
  // LOGIN
  // =======================================================

  const login =
    async (
      username,
      password
    ) => {

      const response =
        await api.post(
          "/accounts/login/",
          {
            username,
            password,
          }
        );


      const {
        access,
        refresh,
      } = response.data;


      if (
        !access ||
        !refresh
      ) {

        throw new Error(
          "Authentication tokens were not returned by the server."
        );

      }


      localStorage.setItem(
        "access_token",
        access
      );


      localStorage.setItem(
        "refresh_token",
        refresh
      );


      setIsAuthenticated(
        true
      );


      try {

        const profile =
          await refreshUser();


        return profile;

      } catch (error) {

        // Login succeeded but profile endpoint failed.
        // Remove tokens because we cannot safely establish
        // the logged-in user's role.

        clearAuth();

        throw error;

      }

    };


  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = () => {

    clearAuth();

  };


  // =======================================================
  // REGISTER PATIENT
  // =======================================================

  const register =
    async (data) => {

      const response =
        await api.post(
          "/accounts/register/",
          data
        );


      return response.data;

    };


  // =======================================================
  // LOAD USER WHEN APP STARTS
  // =======================================================

  useEffect(() => {

    let mounted =
      true;


    const loadUser =
      async () => {

        const accessToken =
          localStorage.getItem(
            "access_token"
          );


        const refreshToken =
          localStorage.getItem(
            "refresh_token"
          );


        // No session stored.

        if (
          !accessToken &&
          !refreshToken
        ) {

          if (mounted) {

            setUser(null);

            setIsAuthenticated(
              false
            );

            setLoading(
              false
            );

          }


          return;

        }


        try {

          const response =
            await api.get(
              "/accounts/profile/"
            );


          if (!mounted) {
            return;
          }


          setUser(
            response.data
          );


          setIsAuthenticated(
            true
          );

        } catch (error) {

          console.error(
            "Initial profile loading error:",
            error
          );


          if (!mounted) {
            return;
          }


          const status =
            error.response?.status;


          // Only explicitly clear auth if
          // authentication really failed.
          //
          // axios.js already attempts token
          // refresh before this final 401
          // reaches here.

          if (status === 401) {

            clearAuth();

          } else {

            // Do NOT remove valid tokens for
            // 403, 404, 500, network problems, etc.

            setUser(null);

            setIsAuthenticated(
              Boolean(
                localStorage.getItem(
                  "access_token"
                ) ||
                localStorage.getItem(
                  "refresh_token"
                )
              )
            );

          }

        } finally {

          if (mounted) {

            setLoading(
              false
            );

          }

        }

      };


    loadUser();


    return () => {

      mounted =
        false;

    };

  }, []);


  // =======================================================
  // PROVIDER
  // =======================================================

  return (

    <AuthContext.Provider
      value={{
        user,
        setUser,

        loading,

        isAuthenticated,

        login,

        logout,

        register,

        refreshUser,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}


// =========================================================
// AUTH HOOK
// =========================================================

export function useAuth() {

  const context =
    useContext(
      AuthContext
    );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider."
    );

  }


  return context;

}
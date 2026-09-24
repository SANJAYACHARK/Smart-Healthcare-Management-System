import { useState } from "react";
import {
  HeartPulse,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


function Login() {

  const navigate = useNavigate();

  const {
    login,
  } = useAuth();


  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    if (!username || !password) {
      setError(
        "Please enter username and password."
      );

      return;
    }

    try {

      setLoading(true);

      const user =
        await login(
          username,
          password
        );


      switch (user.role) {

        case "ADMIN":
          navigate("/admin/dashboard");
          break;

        case "DOCTOR":
          navigate("/doctor/dashboard");
          break;

        case "RECEPTIONIST":
          navigate(
            "/receptionist/dashboard"
          );
          break;

        case "PATIENT":
        default:
          navigate("/patient/dashboard");
          break;
      }

    } catch (error) {

      const message =
        error.response?.data?.detail ||
        "Invalid username or password.";

      setError(message);

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="auth-page">

      <div className="auth-brand-panel">

        <div className="auth-brand">

          <div className="auth-logo">
            <HeartPulse size={30} />
          </div>

          <h1>SmartCare</h1>

        </div>


        <div className="auth-brand-content">

          <h2>
            Your Health.
            <br />
            Smarter.
          </h2>

          <p>
            Manage appointments, medical
            records, prescriptions and
            healthcare communication
            from one secure platform.
          </p>

        </div>

      </div>


      <div className="auth-form-panel">

        <div className="auth-form-container">

          <div className="auth-mobile-logo">

            <div className="auth-logo">
              <HeartPulse size={26} />
            </div>

            <h2>SmartCare</h2>

          </div>


          <div className="auth-heading">

            <h1>
              Welcome Back
            </h1>

            <p>
              Sign in to your SmartCare
              account.
            </p>

          </div>


          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}


          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            <div className="form-group">

              <label>
                Username
              </label>

              <input
                className="form-control"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Enter your username"
              />

            </div>


            <div className="form-group">

              <label>
                Password
              </label>

              <div className="password-wrapper">

                <input
                  className="form-control"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />

                  Signing in...
                </>
              ) : (
                "Sign In"
              )}

            </button>

          </form>


          <div className="auth-register">

            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create Patient Account
            </Link>

          </div>


          <p className="auth-security">
            Your healthcare information
            is protected by secure
            authentication.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;
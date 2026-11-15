
import { Link } from 'react-router-dom';

export default function Login() {
  const handleLogin = (e) => {
    e.preventDefault();
    alert('Login functionality will be connected to the backend.');
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>ElectroSL</h1>
        <p className="login-subtitle">Welcome Back!</p>
        <p className="login-description">
          Sign in to your electrician account
        </p>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            required
          />

          <button type="submit">Login</button>
        </form>

        <p className="login-signup-link">
          Don't have an account?{' '}
          <Link to="/electrician/signup">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

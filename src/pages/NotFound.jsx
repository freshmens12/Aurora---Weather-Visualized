import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="card notfound-card">
        <span className="nf-code">404</span>
        <h1>This page drifted away</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link className="btn-primary" to="/today">
          Back to Today
        </Link>
      </div>
    </div>
  );
}
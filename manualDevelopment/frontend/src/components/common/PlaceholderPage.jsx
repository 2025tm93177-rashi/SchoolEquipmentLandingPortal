import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './PlaceholderPage.css';

const PlaceholderPage = ({ title, description, backPath }) => {
  const navigate = useNavigate();

  return (
    <div className="placeholder-page">
      <Header />
      <div className="placeholder-container">
        <div className="placeholder-content">
          <div className="placeholder-icon">🚧</div>
          <h1>{title}</h1>
          <p>{description}</p>
          <p className="coming-soon">Coming Soon!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate(backPath)}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;

// components/ReviewEditor/SpecificationsForm.js
import React from 'react';

const SpecificationsForm = ({ specifications, onChange, errors }) => {
  const transmissionTypes = [
    'Manual',
    'Automatic',
    'CVT',
    'DCT',
    'Semi-Automatic'
  ];

  const drivetrainTypes = [
    'FWD',
    'RWD',
    'AWD',
    '4WD'
  ];

  return (
    <div className="form-section">
      <div className="specs-grid">
        <div className="form-group">
          <label className="form-label">Make</label>
          <input
            type="text"
            name="make"
            value={specifications.make}
            onChange={onChange}
            className={`form-input ${errors.make ? 'error' : ''}`}
            placeholder="e.g., BMW"
          />
          {errors.make && <span className="error-message">{errors.make}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Model</label>
          <input
            type="text"
            name="model"
            value={specifications.model}
            onChange={onChange}
            className={`form-input ${errors.model ? 'error' : ''}`}
            placeholder="e.g., M4"
          />
          {errors.model && <span className="error-message">{errors.model}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Year</label>
          <input
            type="number"
            name="year"
            value={specifications.year}
            onChange={onChange}
            className="form-input"
            placeholder="e.g., 2024"
            min="1900"
            max={new Date().getFullYear() + 1}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Engine</label>
          <input
            type="text"
            name="engine"
            value={specifications.engine}
            onChange={onChange}
            className="form-input"
            placeholder="e.g., 3.0L Twin-Turbo Inline-6"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Power (hp)</label>
          <input
            type="text"
            name="power"
            value={specifications.power}
            onChange={onChange}
            className="form-input"
            placeholder="e.g., 503"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Torque (lb-ft)</label>
          <input
            type="text"
            name="torque"
            value={specifications.torque}
            onChange={onChange}
            className="form-input"
            placeholder="e.g., 479"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Transmission</label>
          <select
            name="transmission"
            value={specifications.transmission}
            onChange={onChange}
            className="form-input"
          >
            <option value="">Select Transmission</option>
            {transmissionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Drivetrain</label>
          <select
            name="drivetrain"
            value={specifications.drivetrain}
            onChange={onChange}
            className="form-input"
          >
            <option value="">Select Drivetrain</option>
            {drivetrainTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">0-60 mph (seconds)</label>
          <input
            type="text"
            name="acceleration"
            value={specifications.acceleration}
            onChange={onChange}
            className="form-input"
            placeholder="e.g., 3.8"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Top Speed (mph)</label>
          <input
            type="text"
            name="topSpeed"
            value={specifications.topSpeed}
            onChange={onChange}
            className="form-input"
            placeholder="e.g., 155"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Fuel Economy (mpg)</label>
          <input
            type="text"
            name="fuelEconomy"
            value={specifications.fuelEconomy}
            onChange={onChange}
            className="form-input"
            placeholder="e.g., 16 city / 23 highway"
          />
        </div>
      </div>

      <div className="additional-specs">
        <button 
          type="button" 
          className="add-spec-button"
          onClick={() => {/* Add custom specification field */}}
        >
          + Add Custom Specification
        </button>
      </div>
    </div>
  );
};

export default SpecificationsForm;
import React, { useState } from 'react';
import axios from 'axios';
import './DashboardApp.css'; 

function App() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [detectedDomain, setDetectedDomain] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [insights, setInsights] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  // const [domainInsightsAvailable, setDomainInsightsAvailable] = useState(false);
  // const [insightsEnabled, setInsightsEnabled] = useState(false);


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadStatus('');
  };

const handleFileUpload = async () => {
  if (!file) {
    setUploadStatus('Please select a file first');
    return;
  }

  setIsLoading(true);
  setUploadStatus('Uploading file...');
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('https://analyser-backend-3ija.onrender.com/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('Complete response data:', response.data);
    
    // Check for columns - this is available
    if (response.data.columns) {
      setColumns(response.data.columns);
      
      // Try different possible field names for domain
      // Check for detected_domain first, then fallback to other possible names
      let domainValue = response.data.detected_domain;
      if (!domainValue) {
        // Try alternate field names that might contain the domain
        domainValue = response.data.domain || 
                     (response.data.domain_scores ? Object.keys(response.data.domain_scores)[0] : null) || 
                     'others';
        console.log('Using fallback domain:', domainValue);
      }
      
      setDetectedDomain(domainValue);
      setAvailableDomains(response.data.all_domains || []);
      setSelectedDomain(domainValue);
      setData(response.data.data);
      
      console.log('Using domain:', domainValue);
      setUploadStatus('File uploaded successfully!');
    } else {
      setUploadStatus('Error: No columns detected in file');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error response:', error.response?.data);
    setUploadStatus(`Error: ${error.response?.data?.error || 'Upload failed'}`);
  } finally {
    setIsLoading(false);
  }
};

  const handleDomainConfirm = async () => {
    setGeneratingVisuals(true);
    setInsights([]);
    setVisualizations([]);

    try {
      const response = await axios.post('https://analyser-backend-3ija.onrender.com/insights', {
        domain: selectedDomain,
        data: data,
      });

      if (response.data.insights) {
        setInsights(response.data.insights);
      }

      if (response.data.visualizations) {
        setVisualizations(response.data.visualizations);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setUploadStatus('Error generating insights and visualizations');
    } finally {
      setGeneratingVisuals(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Data Analytics Dashboard</h1>
      </header>

      <div className="uploadSection">
        <input 
          type="file" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <button 
          onClick={handleFileUpload}
          disabled={isLoading || !file}
          className="button"
        >
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
        {uploadStatus && (
          <div className={`status ${uploadStatus.includes('Error') ? 'error' : ''}`}>{uploadStatus}</div>
        )}
      </div>

      {columns.length > 0 && (
        <div className="dataAnalysis">
          <h3>Data Analysis</h3>
          <p><strong>Columns Detected:</strong> {columns.join(', ')}</p>
          <p><strong>Detected Domain:</strong> {detectedDomain}</p>
          <div className="domainSelector">
            <label>Select Domain: </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="select"
              disabled={generatingVisuals}
            >
              {availableDomains.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleDomainConfirm}
            disabled={generatingVisuals}
            className="button"
          >
            {generatingVisuals ? 'Generating...' : 'Generate Insights & Visualizations'}
          </button>
          
          {/* <button 
            onClick={handleDomainConfirm}
            disabled={!insightsEnabled || generatingVisuals}
            className="button"
        >
            {generatingVisuals ? 'Generating...' : 'Domain related insights '}
        </button> */}

        </div>
      )}

      {generatingVisuals && (
        <div className="loadingMessage">
          Generating visualizations... This may take a moment.
        </div>
      )}
      
      {insights.length > 0 && (
        <div className="insightsSection">
          <h3>Insights</h3>
          <ul className="insightsList">
            {insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {visualizations.length > 0 && (
        <div className="visualizationsSection">
          <h3>Visualizations</h3>
          <div className="visualizationsGrid">
            {visualizations.map((visual, index) => (
              <div key={index} className="visualizationCard">
                <h4>{visual.title}</h4>
                <img
                  src={`data:image/png;base64,${visual.image}`}
                  alt={visual.title}
                  className="visualization"
                />
                {visual.xAxis && <p><strong>X-Axis:</strong> {visual.xAxis}</p>}
                {visual.yAxis && <p><strong>Y-Axis:</strong> {visual.yAxis}</p>}
                {visual.type && <p><strong>Type:</strong> {visual.type}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import axios from 'axios';

const BatchConvert = () => {
  const [filesData, setFilesData] = useState([
    { file: null, targetFormat: '' },
    { file: null, targetFormat: '' },
    { file: null, targetFormat: '' },
    { file: null, targetFormat: '' },
    { file: null, targetFormat: '' },
  ]);

  const [results, setResults] = useState([]);

  const handleFileChange = (index, file) => {
    const updated = [...filesData];
    updated[index].file = file;
    setFilesData(updated);
  };

  const handleFormatChange = (index, format) => {
    const updated = [...filesData];
    updated[index].targetFormat = format;
    setFilesData(updated);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    filesData.forEach((item, idx) => {
      if (item.file && item.targetFormat) {
        formData.append('files', item.file);
        formData.append('formats', item.targetFormat);
      }
    });

    try {
      const res = await axios.post('http://localhost:4000/convert/batch-convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(res.data.results);
      alert('Conversion Successful!');
    } catch (err) {
      alert('Conversion failed');
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Batch Convert - 5 Different Files</h2>

      {filesData.map((fileData, index) => (
        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <h4>File {index + 1}</h4>
          <input
            type="file"
            onChange={(e) => handleFileChange(index, e.target.files[0])}
          />
          <select
            onChange={(e) => handleFormatChange(index, e.target.value)}
            value={fileData.targetFormat}
          >
            <option value="">Select format</option>
            <option value="jpg">PDF → JPG</option>
            <option value="txt">PDF/DOCX → TXT</option>
            <option value="pdf">DOCX/JPG → PDF</option>
            <option value="docx">PDF → DOCX</option>
          </select>
        </div>
      ))}

      <button onClick={handleSubmit}>Convert Files</button>

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Converted Files:</h3>
          <ul>
            {results.map((item, index) => (
              <li key={index}>
                <strong>{item.file}</strong>
                <ul>
                  {item.outputs?.map((out, i) => (
                    <li key={i}>
                      <a
                        href={`http://localhost:4000/${out.output.replace(/^.*\/(images|converted|epubs|edited|uploads)\//, '$1/')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {out.format.toUpperCase()} File
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BatchConvert;

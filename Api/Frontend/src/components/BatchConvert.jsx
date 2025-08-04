import React, { useState } from 'react';
import axios from 'axios';

const BatchConvert = () => {
    const [files, setFiles] = useState([]);
    const [targetFormat, setTargetFormat] = useState('');
    const [result, setResult] = useState([]);

    const handleFileChange = (e) => setFiles([...e.target.files]);

    const handleSubmit = async () => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('targetFormat', targetFormat);

        try {
            const res = await axios.post('http://localhost:4000/convert/batch-convert', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(res.data.results);
        } catch (err) {
            alert('Upload failed!');
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Batch File Converter</h2>
            <input type="file" multiple onChange={handleFileChange} />
            <br /><br />
            <select onChange={(e) => setTargetFormat(e.target.value)} defaultValue="">
                <option value="" disabled>Select format</option>
                <option value="jpg">PDF → JPG</option>
                <option value="txt">PDF/DOCX → TXT</option>
                <option value="pdf">DOCX → PDF / JPG → PDF</option>
                <option value="docx">PDF → DOCX</option>
            </select>
            <br /><br />
            <button onClick={handleSubmit}>Upload & Convert</button>

            {result.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Converted Files:</h3>
                    <ul>
                        {result.map((item, index) => (
                            <li key={index}>
                                <strong>{item.file}</strong>
                                <ul>
                                    {item.outputs?.map((out, i) => (
                                        <li key={i}>
                                            <a
                                                href={`http://localhost:4000/${out.output.replace(/^.*\/(images|converted|epubs|edited|uploads)\//, '$1/')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                download
                                            >
                                                Download {out.format.toUpperCase()} File
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

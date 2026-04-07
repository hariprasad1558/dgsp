import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Modal, Button } from 'react-bootstrap';

const DispatchTable = ({ isAdmin, onOpenRec }) => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ department: '', rec_ids: '' });
  
  // Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);

  const [historyRec, setHistoryRec] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/recs/allocations');
      setAllocations(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching allocations:', err);
      setLoading(false);
    }
  };

  const handleEdit = (alloc) => {
    setEditingId(alloc._id);
    setEditFormData({
      department: alloc.department,
      rec_ids: [...alloc.rec_ids].sort((a, b) => a - b).join(', ')
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        department: editFormData.department,
        rec_ids: editFormData.rec_ids.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)).sort((a, b) => a - b),
        month: '2025 Conference'
      };
      
      if (editingId && editingId !== 'new') {
        await axios.put(`http://localhost:5000/api/recs/allocations/${editingId}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/recs/allocations', payload);
      }
      
      setEditingId(null);
      fetchAllocations();
    } catch (err) {
      alert('Failed to save allocation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/recs/allocations/${id}`);
      fetchAllocations();
    } catch (err) {
      alert('Failed to delete allocation');
    }
  };

  const addNewAllocation = () => {
    setEditingId('new');
    setEditFormData({ department: '', rec_ids: '' });
  };

  const handleRecClick = async (recNo) => {
    if (onOpenRec) {
      onOpenRec(recNo);
      return;
    }
    // Fallback if not in Dashboard context or onOpenRec not passed
    navigate(`/dashboard?selectRec=${recNo}`);
  };

  // Download CSV
  const handleDownloadCSV = () => {
    if (!historyRows || !historyRows.length) return;
    const headers = ["Period", "Frequency", "Signed Copy", "Uploaded At", "Submitted By", "Implementation Details", "Related photos/videos"];
    const rows = historyRows.map(row => {
      return headers.map(h => {
        let val = row[h];
        if (Array.isArray(val)) return `"${val.join(', ')}"`;
        return `"${String(val || '').replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rec_${historyRec?.recNo || 'Details'}_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download ZIP
  const handleDownloadRowZip = async (row, recNo) => {
    const zip = new JSZip();
    let filenames = [];
    
    // Explicitly add Signed Copy and Implementation Details if they exist
    if (typeof row["Signed Copy"] === 'string' && row["Signed Copy"]) filenames.push(row["Signed Copy"]);
    if (typeof row["Implementation Details"] === 'string' && row["Implementation Details"]) filenames.push(row["Implementation Details"]);
    
    // Related photos/videos could be an array of strings or a single string
    if (Array.isArray(row["Related photos/videos"])) {
        filenames.push(...row["Related photos/videos"]);
    } else if (typeof row["Related photos/videos"] === 'string' && row["Related photos/videos"]) {
        filenames.push(row["Related photos/videos"]);
    }
    
    // Also include any other string fields that look like files just in case
    Object.entries(row).forEach(([k, v]) => {
      if (k !== "Signed Copy" && k !== "Implementation Details" && k !== "Related photos/videos") {
         if (typeof v === 'string' && v.match(/\.(jpg|jpeg|png|gif|pdf|docx?|txt)$/i)) {
             filenames.push(v);
         }
      }
    });

    // Make filenames unique and valid
    filenames = [...new Set(filenames)].filter(Boolean);

    if (filenames.length === 0) {
      alert('No files to download in this row.');
      return;
    }

    let filesAdded = 0;
    for (const filename of filenames) {
      try {
        const url = `http://localhost:5000/uploads/${filename}`;
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(filename, blob);
          filesAdded++;
        }
      } catch (e) { /* skip file if error */ }
    }
    
    if (filesAdded === 0) {
      alert('Could not fetch any files for this row.');
      return;
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `Recommendation_${recNo || 'Details'}_HistoryRow.zip`);
  };

  if (loading) return <div className="mt-3">Loading Dispatch Data...</div>;

  return (
    <div className="dispatch-table-component bg-white p-3 rounded shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Dispatch Control Table</h4>
        {isAdmin && (
          <button className="btn btn-sm btn-primary" onClick={addNewAllocation}>+ New Assignment</button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: '50px' }}>S.No</th>
              <th style={{ width: '300px' }}>Officer / Department</th>
              <th>Recommendation Numbers</th>
              {isAdmin && <th style={{ width: '150px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc, index) => (
              <tr key={alloc._id}>
                <td>{index + 1}</td>
                <td>
                  {editingId === alloc._id ? (
                    <input 
                      className="form-control form-control-sm" 
                      value={editFormData.department} 
                      onChange={e => setEditFormData({...editFormData, department: e.target.value})} 
                    />
                  ) : (
                    <strong>{alloc.department}</strong>
                  )}
                </td>
                <td>
                  {editingId === alloc._id ? (
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="e.g. 1, 2, 3"
                      value={editFormData.rec_ids} 
                      onChange={e => setEditFormData({...editFormData, rec_ids: e.target.value})} 
                    />
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {[...alloc.rec_ids].sort((a, b) => a - b).map(id => (
                        <button 
                          key={id} 
                          className="btn btn-xs btn-outline-primary py-0 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleRecClick(id)}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    {editingId === alloc._id ? (
                      <>
                        <button className="btn btn-success btn-xs me-1" onClick={handleSave}>Save</button>
                        <button className="btn btn-secondary btn-xs" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-outline-primary btn-xs me-1" onClick={() => handleEdit(alloc)}>Edit</button>
                        <button className="btn btn-outline-danger btn-xs" onClick={() => handleDelete(alloc._id)}>Delete</button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {editingId === 'new' && (
              <tr className="table-primary">
                <td>New</td>
                <td>
                  <input 
                    className="form-control form-control-sm" 
                    placeholder="Officer Name"
                    value={editFormData.department} 
                    onChange={e => setEditFormData({...editFormData, department: e.target.value})} 
                  />
                </td>
                <td>
                  <input 
                    className="form-control form-control-sm" 
                    placeholder="Rec numbers (1, 2, 3...)"
                    value={editFormData.rec_ids} 
                    onChange={e => setEditFormData({...editFormData, rec_ids: e.target.value})} 
                  />
                </td>
                <td>
                  <button className="btn btn-success btn-xs me-1" onClick={handleSave}>Save</button>
                  <button className="btn btn-secondary btn-xs" onClick={() => setEditingId(null)}>Cancel</button>
                </td>
              </tr>
            )}
            {allocations.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center text-muted">No dispatch records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Recommendation {historyRec ? historyRec.recNo : ''} Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{maxHeight:'80vh',overflowY:'auto'}}>
          {historyLoading ? (
            <div>Loading history...</div>
          ) : (
            <>
              {/* STATUS & DETAILS */}
              <div className="mb-4 d-flex gap-4">
                <div>
                    <div className="text-secondary fw-bold small mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>STATUS</div>
                    <span className={`badge ${historyRec?.status === 'Completed' ? 'bg-success text-success' : 'bg-info text-primary'} bg-opacity-25 px-3 py-2 rounded-pill`} style={{ fontSize: '0.85rem' }}>
                      {historyRec?.status || 'In Progress'}
                    </span>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-secondary fw-bold small mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>DATA ENTERED / DETAILS</div>
                <div className="border rounded p-2 text-dark bg-light shadow-sm" style={{ fontSize: '0.9rem' }}>
                    Last updated by: {historyRec?.last_updated_by || 'Unknown'}
                </div>
              </div>

              {/* IMPLEMENTATION HISTORY TABLE */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="text-secondary fw-bold small" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>IMPLEMENTATION HISTORY (ENTRIES)</div>
                  <button className="btn btn-success btn-sm shadow-sm" style={{ fontSize: '0.8rem', backgroundColor: '#198754', borderColor: '#198754' }} onClick={handleDownloadCSV}>
                    📊 Download CSV
                  </button>
                </div>
                <div className="table-responsive border rounded shadow-sm bg-white">
                  <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="fw-semibold">Period</th>
                        <th className="fw-semibold">Frequency</th>
                        <th className="fw-semibold">Signed Copy</th>
                        <th className="fw-semibold">Uploaded At</th>
                        <th className="fw-semibold">Submitted By</th>
                        <th className="fw-semibold">Implementation Details</th>
                        <th className="fw-semibold">Related photos/videos</th>
                        <th className="fw-semibold text-center">Row Files</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.Period}</td>
                          <td>{row.Frequency}</td>
                          <td>
                            {row["Signed Copy"] ? (
                              <div className="d-flex flex-column gap-2 align-items-start">
                                <span className="text-truncate" style={{ maxWidth: '120px', fontSize: '0.8rem' }} title={row["Signed Copy"]}>{row["Signed Copy"]}</span>
                                <a href={`http://localhost:5000/uploads/${row["Signed Copy"]}`} download className="btn btn-outline-success btn-sm py-1 px-2" style={{ fontSize: '0.75rem' }}>Download</a>
                              </div>
                            ) : null}
                          </td>
                          <td>{row["Uploaded At"]}</td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1" style={{ fontSize: '0.75rem' }}>
                              {row["Submitted By"] || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {row["Implementation Details"] ? (
                              <div className="d-flex flex-column gap-1 align-items-start">
                                <span className="text-truncate" style={{ maxWidth: '120px', fontSize: '0.8rem' }} title={row["Implementation Details"]}>{row["Implementation Details"]}</span>
                                <a href={`http://localhost:5000/uploads/${row["Implementation Details"]}`} download className="btn btn-outline-success btn-sm py-1 px-2" style={{ fontSize: '0.75rem' }}>Download</a>
                              </div>
                            ) : null}
                          </td>
                          <td>
                            {row["Related photos/videos"] && row["Related photos/videos"].length > 0 ? (
                              <div className="d-flex flex-column gap-2 align-items-start">
                                {row["Related photos/videos"].map((photo, pIdx) => (
                                  <div key={pIdx} className="d-flex flex-column gap-1 align-items-start mb-2">
                                    <img src={`http://localhost:5000/uploads/${photo}`} alt="preview" className="shadow-sm" style={{ width: 50, height: 35, objectFit: 'cover', border: '1px solid #dee2e6' }} />
                                    <a href={`http://localhost:5000/uploads/${photo}`} download className="btn btn-outline-primary btn-sm py-1 px-2" style={{ fontSize: '0.75rem' }}>Download</a>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </td>
                          <td className="text-center">
                            <Button size="sm" variant="outline-primary" className="shadow-sm fw-bold d-flex flex-column align-items-center justify-content-center mx-auto" onClick={() => handleDownloadRowZip(row, historyRec?.recNo)} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                              <span style={{ fontSize: '1.2rem', color: '#c38755' }}>📦</span>
                              <span>ZIP<br/>Download</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {historyRows.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">No history entries found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>


            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DispatchTable;

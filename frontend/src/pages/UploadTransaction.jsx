// ==============================================================================
// Fraud Detection and Risk Assessment System
// Upload Transactions Page (OCR Screenshots, Statement Parsing & Manual Entry)
// ==============================================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Image as ImageIcon, PlusCircle, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import PulseRingLoader from '../components/common/PulseRingLoader';

export default function UploadTransaction() {
  const navigate = useNavigate();
  const { currentMode, setOCRResult, setCurrentTransaction, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState('screenshot');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [statementPreview, setStatementPreview] = useState([]);
  const [statementVerified, setStatementVerified] = useState(false);

  // Manual Form State with all required fields
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    time: '',
    receiver: '',
    receiver_upi: '',
    transaction_id: '',
    category: '',
    device: '',
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setUploadError('');
    setStatementPreview([]);
    setStatementVerified(false);

    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }

    // 1. File size validation (Max 16MB)
    const MAX_SIZE = 16 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('File size exceeds 16MB. Please upload a smaller file.');
      return;
    }

    // 2. Format validation
    if (activeTab === 'screenshot') {
      const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      const fileExt = file.name?.split('.').pop()?.toLowerCase();
      const validExtensions = ['png', 'jpg', 'jpeg', 'webp'];
      const isMimeValid = file.type && allowedImageTypes.includes(file.type.toLowerCase());
      const isExtValid = fileExt && validExtensions.includes(fileExt);

      if (!isMimeValid && !isExtValid) {
        setUploadError('Unsupported image format. Please upload a PNG, JPG, or WebP screenshot.');
        return;
      }
    }

    setIsUploading(true);

    try {
      const formPayload = new FormData();
      formPayload.append('file', file);
      formPayload.append('upload_type', activeTab === 'screenshot' ? 'screenshot' : 'statement');
      formPayload.append('mode', currentMode);

      const res = await api.uploadFile(formPayload);
      if (res && res.success) {
        if (activeTab === 'screenshot') {
          setOCRResult({
            fileName: file.name,
            extracted: res.extracted,
          });
          navigate('/extraction');
        } else {
          if (!res.transactions?.length) {
            setUploadError('No transaction rows were found in this statement.');
          } else {
            setStatementPreview(res.transactions);
          }
        }
      } else {
        setUploadError('The upload could not be processed. Please try another file.');
      }
    } catch (err) {
      console.error('[UploadTransaction] OCR / Upload Error:', err);
      const friendlyMessage =
        err?.message ||
        (typeof err === 'string' ? err : 'OCR extraction failed. Please ensure the screenshot is clear and try again.');
      setUploadError(friendlyMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const updateStatementField = (index, field, value) => {
    setStatementPreview((rows) => rows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
    setStatementVerified(false);
  };

  const saveVerifiedStatement = async () => {
    setUploadError('');
    setIsUploading(true);
    try {
      const verifiedRows = statementPreview.map((row) => ({
        ...row,
        amount: Number(row.amount),
      }));
      await api.batchConfirmTransactions(verifiedRows, currentMode);
      await refreshData(currentMode);
      setStatementPreview([]);
      setStatementVerified(false);
      navigate('/history');
    } catch (error) {
      setUploadError(error?.response?.data?.detail || 'Could not save the reviewed statement.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const txn = {
      amount: parseFloat(formData.amount) || 0,
      date: formData.date,
      date_iso: formData.date,
      time: formData.time,
      receiver: formData.receiver,
      receiver_upi: formData.receiver_upi,
      transaction_id: formData.transaction_id,
      category: formData.category,
      device: formData.device,
      source_type: 'manual',
      validated: false,
    };

    setCurrentTransaction(txn);
    navigate('/confirm');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Upload Transaction Data</h1>
        <p>Upload your UPI transaction screenshots, passbook statements, or enter details manually.</p>
      </div>

      {/* Privacy Notice */}
      <div className="notice-box privacy mb-6">
        <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Privacy:</strong> Screenshots are processed temporarily and saved only after you verify the extracted details.
        </div>
      </div>

      {uploadError && (
        <div className="notice-box security mb-6">
          <div>{uploadError}</div>
        </div>
      )}

      {/* Upload Type Tabs */}
      <div className="tab-group">
        <button
          className={`tab-item ${activeTab === 'screenshot' ? 'active' : ''}`}
          onClick={() => setActiveTab('screenshot')}
        >
          <ImageIcon size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          A. Upload Screenshot (OCR)
        </button>
        <button
          className={`tab-item ${activeTab === 'statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          <FileText size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          B. Upload Statement (PDF/CSV/XLSX)
        </button>
        <button
          className={`tab-item ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <PlusCircle size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          C. Enter Manually
        </button>
      </div>

      {/* Tab A: Screenshot Upload */}
      {activeTab === 'screenshot' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title">Upload UPI Transaction Screenshot</div>
            <span className="badge badge-pink">PNG, JPG, JPEG, WEBP</span>
          </div>

          <div
            className={`upload-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileInput} />
            {isUploading ? (
              <PulseRingLoader
                variant="section"
                size="md"
                message="Processing UPI Payment Screenshot…"
                subtitle="Tesseract.js WASM OCR extracting layout, amount, UTR & counterparty details…"
              />
            ) : (
              <>
                <div className="upload-icon">
                  <Upload size={28} />
                </div>
                <div className="upload-text">
                  {selectedFile ? selectedFile.name : 'Drag & drop UPI payment screenshot here, or click to browse'}
                </div>
                <div className="upload-hint">
                  Supports Google Pay, PhonePe, Paytm, BHIM and standard banking UPI receipts
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
            <span className="text-xs text-tertiary">Max file size: 16MB • Tesseract.js WASM OCR</span>
          </div>
        </div>
      )}

      {/* Tab B: Statement Upload */}
      {activeTab === 'statement' && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title">Upload Account or Passbook Statement</div>
            <span className="badge badge-pink">PDF, CSV, XLSX</span>
          </div>

          <div
            className={`upload-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input type="file" accept=".pdf, .csv, .xlsx" onChange={handleFileInput} />
            {isUploading ? (
              <PulseRingLoader
                variant="section"
                size="md"
                message="Parsing Transaction Statement…"
                subtitle="Reading statement rows & validating tabular structure…"
              />
            ) : (
              <>
                <div className="upload-icon">
                  <FileText size={28} />
                </div>
                <div className="upload-text">
                  {selectedFile ? selectedFile.name : 'Drag & drop transaction passbook statement file here'}
                </div>
                <div className="upload-hint">
                  Review extracted rows before saving transaction details
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
            <span className="text-xs text-tertiary">Max file size: 16MB • PDF, CSV, XLSX</span>
          </div>
        </div>
      )}

      {statementPreview.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <div className="card-title">Review statement rows</div>
            <span className="badge">{statementPreview.length} rows</span>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Recipient</th>
                  <th>Transaction ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {statementPreview.map((row, index) => (
                  <tr key={`${row.transaction_id || 'row'}-${index}`}>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min="0.01"
                        step="0.01"
                        aria-label={`Row ${index + 1} amount`}
                        value={row.amount ?? ''}
                        onChange={(event) => updateStatementField(index, 'amount', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="text"
                        aria-label={`Row ${index + 1} recipient`}
                        value={row.receiver || ''}
                        onChange={(event) => updateStatementField(index, 'receiver', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="text"
                        aria-label={`Row ${index + 1} transaction ID`}
                        value={row.transaction_id || ''}
                        onChange={(event) => updateStatementField(index, 'transaction_id', event.target.value)}
                      />
                    </td>
                    <td>{row.date || 'Not extracted'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="flex items-center gap-2 text-sm mt-4">
            <input
              type="checkbox"
              checked={statementVerified}
              onChange={(event) => setStatementVerified(event.target.checked)}
            />
            I reviewed these rows and confirm they may be saved.
          </label>
          <div className="flex justify-end mt-4">
            <button
              className="btn btn-primary"
              disabled={!statementVerified || isUploading}
              onClick={saveVerifiedStatement}
            >
              {isUploading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PulseRingLoader variant="inline" size={16} />
                  <span>Saving verified rows…</span>
                </span>
              ) : (
                'Save verified rows'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab C: Manual Entry Form */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="card animate-fade-in">
          <div className="card-header">
            <div className="card-title">Enter Transaction Details Manually</div>
            <span className="badge badge-info">Manual Entry</span>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Transaction Amount (₹)*</label>
              <input
                type="number"
                step="0.01"
                className="form-input font-mono"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Recipient / Merchant Name*</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.receiver}
                onChange={e => setFormData({ ...formData, receiver: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Recipient UPI ID</label>
              <input
                type="text"
                className="form-input font-mono"
                placeholder="merchant@okhdfcbank"
                value={formData.receiver_upi}
                onChange={e => setFormData({ ...formData, receiver_upi: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction ID / UTR*</label>
              <input
                type="text"
                className="form-input font-mono"
                required
                value={formData.transaction_id}
                onChange={e => setFormData({ ...formData, transaction_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Date*</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Time*</label>
              <input
                type="text"
                className="form-input font-mono"
                placeholder="10:42 AM"
                required
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Shopping">Shopping / Retail</option>
                <option value="Groceries">Groceries & Essentials</option>
                <option value="Dining">Dining & Food Delivery</option>
                <option value="Utilities">Utilities & Bills</option>
                <option value="Transfer">Peer-to-Peer Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Device Information (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Samsung Galaxy S23"
                value={formData.device}
                onChange={e => setFormData({ ...formData, device: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="submit" className="btn btn-primary">
              <CheckCircle size={16} /> Proceed to Verify Extracted Data <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

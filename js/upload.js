/* ============================================
   VaultDrop — Upload Page Logic
   Handles: drag-drop, file selection, upload,
            expiry/password options, share link, QR code
   ============================================ */

/* ── Utility: show toast notification ── */
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

/* ── Utility: human-readable file size ── */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

/* ── Utility: file-type SVG icon ── */
function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  
  const getSvg = (color, pathData) => `
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: ${color}">
      ${pathData}
    </svg>
  `;

  const map = {
    pdf: getSvg('#ff4757', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15v-4"></path><path d="M12 15v-4"></path><path d="M15 15v-4"></path>'),
    doc: getSvg('#2e86de', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'),
    docx: getSvg('#2e86de', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'),
    xls: getSvg('#10ac84', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2"></path><path d="M8 17h2"></path><path d="M14 13h2"></path><path d="M14 17h2"></path>'),
    xlsx: getSvg('#10ac84', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2"></path><path d="M8 17h2"></path><path d="M14 13h2"></path><path d="M14 17h2"></path>'),
    csv: getSvg('#10ac84', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line>'),
    zip: getSvg('#feca57', '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'),
    rar: getSvg('#feca57', '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'),
    '7z': getSvg('#feca57', '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'),
    jpg: getSvg('#0abde3', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>'),
    jpeg: getSvg('#0abde3', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>'),
    png: getSvg('#0abde3', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>'),
    gif: getSvg('#0abde3', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>'),
    webp: getSvg('#0abde3', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>'),
    svg: getSvg('#f368e0', '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>'),
    mp4: getSvg('#ee5253', '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>'),
    mov: getSvg('#ee5253', '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>'),
    avi: getSvg('#ee5253', '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>'),
    mkv: getSvg('#ee5253', '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>'),
    mp3: getSvg('#9b59b6', '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>'),
    wav: getSvg('#9b59b6', '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>'),
    txt: getSvg('#95a5a6', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'),
    json: getSvg('#f1c40f', '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>'),
    xml: getSvg('#f1c40f', '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>'),
    html: getSvg('#e17055', '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>'),
    css: getSvg('#0984e3', '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>'),
    js: getSvg('#fdcb6e', '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>'),
  };
  return map[ext] || getSvg('#a4b0be', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>');
}

/* ── Utility: sanitize filename for storage paths ── */
function sanitizeFileName(name) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';

  // Remove path separators/control chars and keep a predictable filename for storage.
  const safeBase = base
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'file';

  return `${safeBase}${ext}`;
}

/* ── Utility: detect retryable network/storage errors ── */
function isTransientError(err) {
  const msg = String((err && err.message) || err || '').toLowerCase();
  
  // Non-retryable user/auth/limit errors
  if (msg.includes('403') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('row level security') || msg.includes('exceeds limit') || msg.includes('payload too large')) {
    return false;
  }
  
  // Treat everything else (network drops, timeout, DNS failure on wake) as transient on mobile
  return true;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Utility: direct upload with duplicate check ── */
async function uploadWithFallback(path, file) {
  try {
    const result = await supabaseClient
      .storage
      .from(BUCKET_NAME)
      .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type || undefined });

    if (!result.error) return result;

    // If a request timed out locally but succeeded on the server, retries will hit a conflict.
    const duplicateObject = /already exists|duplicate|conflict/i.test(String((result.error && result.error.message) || ''));
    if (duplicateObject) {
      return { data: { path }, error: null };
    }

    return result;
  } catch (err) {
    // Network failures often THROW natively instead of returning an error object.
    return { data: null, error: err };
  }
}

/* ── Utility: generate unique ID ── */
function generateId() {
  return Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36);
}

/* ── State ── */
let selectedFiles = [];
let isUploading = false;

/* ── DOM refs ── */
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileOptions = document.getElementById('fileOptions');
const selectedFilesEl = document.getElementById('selectedFiles');
const filesSummaryEl = document.getElementById('filesSummary');
const uploadBtn = document.getElementById('uploadBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressFileName = document.getElementById('progressFileName');
const progressStatus = document.getElementById('progressStatus');
const progressBatch = document.getElementById('progressBatch');
const successWrap = document.getElementById('successWrap');
const shareLink = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const newUploadBtn = document.getElementById('newUploadBtn');
const qrCode = document.getElementById('qrCode');
const expirySelect = document.getElementById('expirySelect');
const passwordInput = document.getElementById('passwordInput');
const highLoadModal = document.getElementById('highLoadModal');
const closeHighLoadModal = document.getElementById('closeHighLoadModal');
const ackHighLoadModal = document.getElementById('ackHighLoadModal');

/* ── High-load advisory popup ── */
function closeAdvisoryModal() {
  if (!highLoadModal) return;
  highLoadModal.classList.remove('is-open');
}

if (highLoadModal) {
  // Small delay avoids sudden pop-in at first paint.
  setTimeout(() => {
    highLoadModal.classList.add('is-open');
  }, 280);

  closeHighLoadModal?.addEventListener('click', closeAdvisoryModal);
  ackHighLoadModal?.addEventListener('click', closeAdvisoryModal);

  highLoadModal.addEventListener('click', (e) => {
    if (e.target === highLoadModal) closeAdvisoryModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAdvisoryModal();
  });
}

/* ── Drag & Drop handlers ── */
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length) handleFileSelect(files);
});

/* Click-to-browse also triggers from the dropzone */
dropZone.addEventListener('click', (e) => {
  // Prevent double-triggering if the user clicked the label natively.
  // This causes mobile browsers to cancel the file picker selection.
  if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
    fileInput.click();
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFileSelect(fileInput.files);
});

/* ── Handle file selection ── */
function handleFileSelect(files) {
  // Convert FileList to array and filter
  const newFiles = Array.from(files).filter(file => {
    // 50 MB limit per file
    if (file.size > 50 * 1024 * 1024) {
      showToast(`${file.name} exceeds 50MB limit.`, 'error');
      return false;
    }
    return true;
  });

  if (!newFiles.length) return;

  // Add to selected files
  selectedFiles = [...selectedFiles, ...newFiles];

  // Render all selected files
  renderSelectedFiles();

  // Hide dropzone, show options
  dropZone.style.display = 'none';
  fileOptions.style.display = 'block';
}

/* ── Render all selected files ── */
function renderSelectedFiles() {
  selectedFilesEl.innerHTML = '';
  
  selectedFiles.forEach((file, index) => {
    const fileRow = document.createElement('div');
    fileRow.className = 'sf-row';
    fileRow.innerHTML = `
      <div class="sf-icon">${fileIcon(file.name)}</div>
      <div class="sf-info">
        <div class="sf-name" title="${file.name}">${file.name}</div>
        <div class="sf-size">${formatSize(file.size)}</div>
      </div>
      <button class="sf-remove" data-index="${index}" title="Remove">✕</button>
    `;
    
    const removeBtn = fileRow.querySelector('.sf-remove');
    removeBtn.addEventListener('click', () => removeFile(index));
    selectedFilesEl.appendChild(fileRow);
  });

  // Update summary
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  filesSummaryEl.innerHTML = `
    <div class="files-count">${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected · ${formatSize(totalSize)} total</div>
  `;
}

/* ── Remove individual file ── */
function removeFile(index) {
  selectedFiles.splice(index, 1);
  
  if (selectedFiles.length === 0) {
    resetUpload();
  } else {
    renderSelectedFiles();
  }
}

/* ── Reset to initial drop-zone state ── */
function resetUpload() {
  selectedFiles = [];
  isUploading = false;
  uploadBtn.disabled = false;
  fileInput.value = '';
  dropZone.style.display = '';
  fileOptions.style.display = 'none';
  progressWrap.style.display = 'none';
  successWrap.style.display = 'none';
  passwordInput.value = '';
  expirySelect.value = '24';
  qrCode.innerHTML = '';
  selectedFilesEl.innerHTML = '';
  filesSummaryEl.innerHTML = '';
}

/* ── Upload handler ── */
uploadBtn.addEventListener('click', async () => {
  if (!selectedFiles.length || isUploading) return;

  // Validate Supabase config
  if (SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_')) {
    showToast('Please configure Supabase in js/config.js first!', 'error');
    return;
  }

  isUploading = true;
  uploadBtn.disabled = true;

  const batchId = generateId();
  const expiry = expirySelect.value;
  const password = passwordInput.value.trim();

  // Calculate expiry timestamp (null = never)
  let expiresAt = null;
  if (expiry !== 'never' && !expiry.startsWith('downloads')) {
    expiresAt = new Date(Date.now() + parseInt(expiry) * 3600 * 1000).toISOString();
  }
  const maxDownloads = expiry === 'downloads1' ? 1 : null;

  /* ── Switch to progress view ── */
  fileOptions.style.display = 'none';
  progressWrap.style.display = 'block';
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStatus.textContent = 'Starting upload...';

  const uploadedFiles = [];
  let totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  let uploadedSize = 0;

  try {
    /* ── Upload each file sequentially ── */
    for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex++) {
      const file = selectedFiles[fileIndex];
      progressFileName.textContent = file.name;
      progressBatch.textContent = `File ${fileIndex + 1} of ${selectedFiles.length}`;

      const fileId = generateId();
      const safeFileName = sanitizeFileName(file.name);
      const storagePath = `${batchId}/${fileId}/${safeFileName}`;

      // Progress for this file
      let fileProgress = 0;
      const progressInterval = setInterval(() => {
        fileProgress = Math.min(fileProgress + Math.random() * 15, 88);
        const totalProgress = ((uploadedSize + file.size * fileProgress / 100) / totalSize) * 100;
        progressBar.style.width = totalProgress + '%';
        progressPercent.textContent = Math.round(totalProgress) + '%';
      }, 200);

      try {
        /* ── 1. Upload file to Supabase Storage ── */
        let storageError = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const { error } = await uploadWithFallback(storagePath, file);
          storageError = error;
          if (!storageError) break;

          if (!isTransientError(storageError) || attempt === 3) {
            throw storageError;
          }

          progressStatus.textContent = `Retrying upload (${attempt}/2)...`;
          await wait(350 * attempt);
        }

        /* ── 2. Get public URL ── */
        const { data: urlData } = supabaseClient
          .storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;

        /* ── 3. Store metadata in database ── */
        const metadata = {
          id: fileId,
          name: file.name,
          size: file.size,
          url: publicUrl,
          storage_path: storagePath,
          password: password || null,
          expires_at: expiresAt,
          max_downloads: maxDownloads,
          download_count: 0,
        };

        let dbError = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            const { error } = await supabaseClient
              .from('files')
              .upsert(metadata, { onConflict: 'id' });
            
            dbError = error;
          } catch (err) {
            dbError = err;
          }

          if (!dbError) break;

          if (!isTransientError(dbError) || attempt === 3) {
            throw dbError;
          }

          progressStatus.textContent = `Finalizing link (${attempt}/2)...`;
          await wait(300 * attempt);
        }

        uploadedFiles.push({
          id: fileId,
          name: file.name,
          size: file.size,
          url: publicUrl
        });

        clearInterval(progressInterval);
        uploadedSize += file.size;
        progressStatus.textContent = `Uploaded ${fileIndex + 1}/${selectedFiles.length}`;
        progressBar.style.width = (uploadedSize / totalSize * 100) + '%';
        progressPercent.textContent = Math.round(uploadedSize / totalSize * 100) + '%';

      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }
    }

    /* ── Finalize progress ── */
    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';
    progressStatus.textContent = 'Done!';

    /* ── 4. Show success & generate link ── */
    setTimeout(() => {
      progressWrap.style.display = 'none';
      successWrap.style.display = 'block';

      const link = `${BASE_URL}/file.html?batch=${batchId}`;
      shareLink.value = link;

      // Display uploaded files list
      const uploadedFilesList = document.getElementById('uploadedFilesList');
      uploadedFilesList.innerHTML = uploadedFiles.map((file, idx) => `
        <div class="uploaded-file-item">
          <div class="ufi-icon">${fileIcon(file.name)}</div>
          <div class="ufi-info">
            <div class="ufi-name" title="${file.name}">${file.name}</div>
            <div class="ufi-size">${formatSize(file.size)}</div>
          </div>
        </div>
      `).join('');

      // Generate QR Code
      qrCode.innerHTML = '';
      new QRCode(qrCode, {
        text: link,
        width: 100,
        height: 100,
        colorDark: '#f5a623',
        colorLight: '#111115',
      });

      showToast(`Successfully uploaded ${uploadedFiles.length} file(s)!`, 'success');
      isUploading = false;
    }, 600);

  } catch (err) {
    console.error('Upload error:', err);
    progressStatus.textContent = 'Upload failed. Please try again.';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    showToast(err.message || 'Upload failed.', 'error');

    // Go back to options after 2s
    setTimeout(() => {
      progressWrap.style.display = 'none';
      fileOptions.style.display = 'block';
      isUploading = false;
      uploadBtn.disabled = false;
    }, 2000);
  }
});

/* ── Copy link ── */
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    showToast('Link copied!', 'success');
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    }, 2500);
  } catch {
    showToast('Could not copy — try manually.', 'error');
  }
});

/* ── Upload another file ── */
newUploadBtn.addEventListener('click', resetUpload);
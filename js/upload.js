/* ============================================
   VaultDrop — Upload Page Logic
   Handles: drag-drop, file selection, upload,
            expiry/password options, share link, QR code
   ============================================ */

/* ── Utility: show toast notification ── */
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

/* ── Utility: human-readable file size ── */
function formatSize(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

/* ── Utility: file-type emoji icon ── */
function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📑', pptx: '📑', zip: '🗜', rar: '🗜', '7z': '🗜',
    jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', webp: '🖼',
    svg: '🖼', mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    txt: '📃', csv: '📊', json: '🗂', xml: '🗂', html: '🌐',
    css: '🎨', js: '⚡', py: '🐍', rb: '💎',
  };
  return map[ext] || '📦';
}

/* ── Utility: generate unique ID ── */
function generateId() {
  return Math.random().toString(36).substring(2, 10) +
         Date.now().toString(36);
}

/* ── State ── */
let selectedFile = null;

/* ── DOM refs ── */
const dropZone     = document.getElementById('dropZone');
const fileInput    = document.getElementById('fileInput');
const fileOptions  = document.getElementById('fileOptions');
const selectedFileEl = document.getElementById('selectedFile');
const uploadBtn    = document.getElementById('uploadBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar  = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressFileName = document.getElementById('progressFileName');
const progressStatus = document.getElementById('progressStatus');
const successWrap  = document.getElementById('successWrap');
const shareLink    = document.getElementById('shareLink');
const copyBtn      = document.getElementById('copyBtn');
const newUploadBtn = document.getElementById('newUploadBtn');
const qrCode       = document.getElementById('qrCode');
const expirySelect = document.getElementById('expirySelect');
const passwordInput = document.getElementById('passwordInput');

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
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});

/* Click-to-browse also triggers from the dropzone */
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
});

/* ── Handle file selection ── */
function handleFileSelect(file) {
  // 50 MB limit
  if (file.size > 50 * 1024 * 1024) {
    showToast('File exceeds the 50MB limit.', 'error');
    return;
  }

  selectedFile = file;

  // Render the selected file row
  selectedFileEl.innerHTML = `
    <div class="sf-icon">${fileIcon(file.name)}</div>
    <div class="sf-info">
      <div class="sf-name" title="${file.name}">${file.name}</div>
      <div class="sf-size">${formatSize(file.size)}</div>
    </div>
    <button class="sf-remove" id="removeFileBtn" title="Remove">✕</button>
  `;

  // Hide dropzone, show options
  dropZone.style.display = 'none';
  fileOptions.style.display = 'block';

  document.getElementById('removeFileBtn').addEventListener('click', resetUpload);
}

/* ── Reset to initial drop-zone state ── */
function resetUpload() {
  selectedFile = null;
  fileInput.value = '';
  dropZone.style.display = '';
  fileOptions.style.display = 'none';
  progressWrap.style.display = 'none';
  successWrap.style.display = 'none';
  passwordInput.value = '';
  expirySelect.value = '24';
  qrCode.innerHTML = '';
}

/* ── Upload handler ── */
uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  // Validate Supabase config
  if (SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_')) {
    showToast('Please configure Supabase in js/config.js first!', 'error');
    return;
  }

  const fileId   = generateId();
  const expiry   = expirySelect.value;
  const password = passwordInput.value.trim();
  const storagePath = `${fileId}/${selectedFile.name}`;

  // Calculate expiry timestamp (null = never)
  let expiresAt = null;
  if (expiry !== 'never' && !expiry.startsWith('downloads')) {
    expiresAt = new Date(Date.now() + parseInt(expiry) * 3600 * 1000).toISOString();
  }
  const maxDownloads = expiry === 'downloads1' ? 1 : null;

  /* ── Switch to progress view ── */
  fileOptions.style.display = 'none';
  progressWrap.style.display = 'block';
  progressFileName.textContent = selectedFile.name;
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStatus.textContent = 'Uploading...';

  // Simulate progress (Supabase JS v2 doesn't expose XHR progress natively)
  let fakeProgress = 0;
  const progressInterval = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.random() * 15, 88);
    progressBar.style.width = fakeProgress + '%';
    progressPercent.textContent = Math.round(fakeProgress) + '%';
  }, 200);

  try {
    /* ── 1. Upload file to Supabase Storage ── */
    const { data: storageData, error: storageError } = await supabaseClient
      .storage
      .from(BUCKET_NAME)
      .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: false });

    if (storageError) throw storageError;

    /* ── 2. Get public URL ── */
    const { data: urlData } = supabaseClient
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    /* ── 3. Store metadata in database ── */
    const { error: dbError } = await supabaseClient
      .from('files')
      .insert({
        id:             fileId,
        name:           selectedFile.name,
        size:           selectedFile.size,
        url:            publicUrl,
        storage_path:   storagePath,
        password:       password || null,
        expires_at:     expiresAt,
        max_downloads:  maxDownloads,
        download_count: 0,
      });

    if (dbError) throw dbError;

    /* ── Finalize progress ── */
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';
    progressStatus.textContent = 'Done!';

    /* ── 4. Show success & generate link ── */
    setTimeout(() => {
      progressWrap.style.display = 'none';
      successWrap.style.display = 'block';

      const link = `${BASE_URL}/file.html?id=${fileId}`;
      shareLink.value = link;

      // Generate QR Code
      qrCode.innerHTML = '';
      new QRCode(qrCode, {
        text:   link,
        width:  100,
        height: 100,
        colorDark:  '#f5a623',
        colorLight: '#111115',
      });

      showToast('File uploaded successfully!', 'success');
    }, 600);

  } catch (err) {
    clearInterval(progressInterval);
    console.error('Upload error:', err);
    progressStatus.textContent = 'Upload failed. Please try again.';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    showToast(err.message || 'Upload failed.', 'error');

    // Go back to options after 2s
    setTimeout(() => {
      progressWrap.style.display = 'none';
      fileOptions.style.display = 'block';
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
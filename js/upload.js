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

/* ── Utility: file-type emoji icon ── */
function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📑', pptx: '📑', zip: '🗜', rar: '🗜', '7z': '🗜',
    jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', webp: '🖼',
    heic: '🖼', heif: '🖼',
    svg: '🖼', mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    txt: '📃', csv: '📊', json: '🗂', xml: '🗂', html: '🌐',
    css: '🎨', js: '⚡', py: '🐍', rb: '💎',
  };
  return map[ext] || '📦';
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

/* ── Utility: cross-browser file to ArrayBuffer ── */
function toArrayBuffer(file) {
  if (file && typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function onLoad() { resolve(reader.result); };
    reader.onerror = function onError() { reject(new Error('Could not read file data.')); };
    reader.readAsArrayBuffer(file);
  });
}

/* ── Utility: detect retryable network/storage errors ── */
function isTransientError(err) {
  const msg = String((err && err.message) || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('timeout') ||
    msg.includes('load failed') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Utility: upload with mobile-browser fallback ── */
async function uploadWithFallback(path, file) {
  const tryPrimary = await supabaseClient
    .storage
    .from(BUCKET_NAME)
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type || undefined });

  if (!tryPrimary.error) return tryPrimary;

  // Some mobile browsers are flaky with direct File uploads; retry as Blob.
  const arr = await toArrayBuffer(file);
  const blob = new Blob([arr], { type: file.type || 'application/octet-stream' });
  const tryFallback = await supabaseClient
    .storage
    .from(BUCKET_NAME)
    .upload(path, blob, { cacheControl: '3600', upsert: true, contentType: file.type || 'application/octet-stream' });

  if (!tryFallback.error) return tryFallback;

  // If the first request actually succeeded server-side, retry can fail as duplicate.
  const duplicateObject = /already exists|duplicate|conflict/i.test(String((tryFallback.error && tryFallback.error.message) || ''));
  if (duplicateObject) {
    return { data: { path }, error: null };
  }

  return tryFallback;
}

/* ── Utility: generate unique ID ── */
function generateId() {
  return Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36);
}

/* ── State ── */
let selectedFile = null;
let isUploading = false;

/* ── DOM refs ── */
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileOptions = document.getElementById('fileOptions');
const selectedFileEl = document.getElementById('selectedFile');
const uploadBtn = document.getElementById('uploadBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressFileName = document.getElementById('progressFileName');
const progressStatus = document.getElementById('progressStatus');
const successWrap = document.getElementById('successWrap');
const shareLink = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const newUploadBtn = document.getElementById('newUploadBtn');
const qrCode = document.getElementById('qrCode');
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
}

/* ── Upload handler ── */
uploadBtn.addEventListener('click', async () => {
  if (!selectedFile || isUploading) return;

  // Validate Supabase config
  if (SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_')) {
    showToast('Please configure Supabase in js/config.js first!', 'error');
    return;
  }

  isUploading = true;
  uploadBtn.disabled = true;

  const fileId = generateId();
  const expiry = expirySelect.value;
  const password = passwordInput.value.trim();
  const safeFileName = sanitizeFileName(selectedFile.name);
  const storagePath = `${fileId}/${safeFileName}`;

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
    let storageError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const { error } = await uploadWithFallback(storagePath, selectedFile);
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
      name: selectedFile.name,
      size: selectedFile.size,
      url: publicUrl,
      storage_path: storagePath,
      password: password || null,
      expires_at: expiresAt,
      max_downloads: maxDownloads,
      download_count: 0,
    };

    let dbError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const { error } = await supabaseClient
        .from('files')
        .upsert(metadata, { onConflict: 'id' });

      dbError = error;
      if (!dbError) break;

      if (!isTransientError(dbError) || attempt === 3) {
        throw dbError;
      }

      progressStatus.textContent = `Finalizing link (${attempt}/2)...`;
      await wait(300 * attempt);
    }

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
        text: link,
        width: 100,
        height: 100,
        colorDark: '#f5a623',
        colorLight: '#111115',
      });

      showToast('File uploaded successfully!', 'success');
      isUploading = false;
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
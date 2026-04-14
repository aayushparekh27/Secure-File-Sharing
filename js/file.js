/* ============================================
   VaultDrop — File Download Page Logic
   Handles: loading file metadata, password gate,
            expiry checks, preview, download tracking
   ============================================ */

/* ── Utility: show toast ── */
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

/* ── Utility: human-readable file size ── */
function formatSize(bytes) {
  if (bytes < 1024)     return bytes + ' B';
  if (bytes < 1048576)  return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

/* ── Utility: friendly date ── */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
         ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── Utility: file-type emoji ── */
function fileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📑', pptx: '📑', zip: '🗜', rar: '🗜', '7z': '🗜',
    jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', webp: '🖼',
    svg: '🖼', mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    txt: '📃', csv: '📊', json: '🗂', xml: '🗂', html: '🌐',
  };
  return map[ext] || '📦';
}

/* ── Utility: determine previewable type ── */
function getPreviewType(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (['mp4','webm','ogg','mov'].includes(ext))  return 'video';
  if (['mp3','wav','flac','ogg','aac'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'text';
  return null;
}

/* ── DOM Refs ── */
const loadingState  = document.getElementById('loadingState');
const errorState    = document.getElementById('errorState');
const passwordState = document.getElementById('passwordState');
const fileCard      = document.getElementById('fileCard');
const errorMsg      = document.getElementById('errorMsg');
const pwInput       = document.getElementById('pwInput');
const pwSubmit      = document.getElementById('pwSubmit');
const pwError       = document.getElementById('pwError');

/* ── State ── */
let fileRecord = null; // will hold the DB row

/* ── Extract file ID from URL ── */
const params   = new URLSearchParams(window.location.search);
const fileId   = params.get('id');

/* ── Entry point ── */
(async function init() {
  if (!fileId) {
    showError('No file ID provided in the URL.');
    return;
  }

  // Validate Supabase config
  if (SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_')) {
    showError('Supabase is not configured yet. See js/config.js.');
    return;
  }

  try {
    /* ── 1. Fetch metadata from DB ── */
    const { data, error } = await supabaseClient
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !data) {
      showError('This file does not exist or the link is invalid.');
      return;
    }

    fileRecord = data;

    /* ── 2. Check expiry (time-based) ── */
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      showError('This file link has expired and is no longer available.');
      return;
    }

    /* ── 3. Check download limit ── */
    if (data.max_downloads !== null && data.download_count >= data.max_downloads) {
      showError('This file has reached its maximum download limit.');
      return;
    }

    /* ── 4. Password gate ── */
    if (data.password) {
      loadingState.style.display = 'none';
      passwordState.style.display = 'block';
      return; // wait for password submission
    }

    /* ── 5. Show file directly ── */
    renderFileCard(data);

  } catch (err) {
    console.error(err);
    showError('Something went wrong. Please try again.');
  }
})();

/* ── Password submission ── */
pwSubmit.addEventListener('click', checkPassword);
pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPassword(); });

function checkPassword() {
  if (!fileRecord) return;
  const entered = pwInput.value.trim();

  if (entered === fileRecord.password) {
    pwError.style.display = 'none';
    passwordState.style.display = 'none';
    renderFileCard(fileRecord);
  } else {
    pwError.style.display = 'block';
    pwInput.value = '';
    pwInput.focus();
    pwInput.classList.add('shake');
    setTimeout(() => pwInput.classList.remove('shake'), 500);
  }
}

/* ── Render file card ── */
function renderFileCard(data) {
  loadingState.style.display = 'none';
  passwordState.style.display = 'none';
  fileCard.style.display = 'block';

  // Icon
  document.getElementById('fileTypeBadge').textContent = fileIcon(data.name);

  // Name, size, upload time
  document.getElementById('fileName').textContent        = data.name;
  document.getElementById('fileSize').textContent        = formatSize(data.size);
  document.getElementById('fileUploaded').textContent    = formatDate(data.created_at);
  document.getElementById('fileDownloads').textContent   = `${data.download_count} download${data.download_count !== 1 ? 's' : ''}`;

  // Expiry badge
  const expiryEl = document.getElementById('fileExpiry');
  if (data.expires_at) {
    expiryEl.textContent = `Expires ${formatDate(data.expires_at)}`;
    expiryEl.style.display = '';
  } else if (data.max_downloads) {
    expiryEl.textContent = `${data.max_downloads - data.download_count} download${data.max_downloads - data.download_count !== 1 ? 's' : ''} left`;
    expiryEl.style.display = '';
  } else {
    expiryEl.style.display = 'none';
  }

  // Preview
  buildPreview(data);

  // Download button
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.href     = data.url;
  downloadBtn.download = data.name;
  downloadBtn.removeAttribute('target');

  downloadBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      await forceDownload(data.url, data.name);
    } catch {
      // Fallback for stricter browser policies.
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }

    // Increment download counter in DB after click/download attempt.
    try {
      await supabaseClient
        .from('files')
        .update({ download_count: (data.download_count || 0) + 1 })
        .eq('id', data.id);
    } catch (e) {
      console.warn('Could not update download count:', e);
    }
  });
}

/* ── Build preview element ── */
async function buildPreview(data) {
  const previewArea = document.getElementById('previewArea');
  const type = getPreviewType(data.name);

  if (!type) {
    previewArea.innerHTML = `
      <div class="no-preview">
        <span>${fileIcon(data.name)}</span>
        <p>No preview available for this file type.</p>
      </div>`;
    return;
  }

  if (type === 'image') {
    const img = document.createElement('img');
    img.src = data.url;
    img.alt = data.name;
    img.loading = 'lazy';
    previewArea.appendChild(img);
    return;
  }

  if (type === 'video') {
    const vid = document.createElement('video');
    vid.src = data.url;
    vid.controls = true;
    vid.playsInline = true;
    previewArea.appendChild(vid);
    return;
  }

  if (type === 'audio') {
    const aud = document.createElement('audio');
    aud.src = data.url;
    aud.controls = true;
    previewArea.appendChild(aud);
    return;
  }

  if (type === 'pdf') {
    const iframe = document.createElement('iframe');
    iframe.src = data.url;
    iframe.title = data.name;
    previewArea.appendChild(iframe);
    return;
  }

  if (type === 'text') {
    // Fetch and display text content
    try {
      const res  = await fetch(data.url);
      const text = await res.text();
      const pre  = document.createElement('pre');
      pre.textContent = text.substring(0, 5000) + (text.length > 5000 ? '\n\n[truncated]' : '');
      pre.style.cssText = 'padding:1.25rem; font-size:0.8rem; color:#a0a0b0; overflow:auto; max-height:320px; white-space:pre-wrap; font-family:monospace;';
      previewArea.appendChild(pre);
    } catch {
      previewArea.innerHTML = `<div class="no-preview"><span>📃</span><p>Could not load text preview.</p></div>`;
    }
  }
}

/* ── Error display ── */
function showError(msg) {
  loadingState.style.display  = 'none';
  passwordState.style.display = 'none';
  fileCard.style.display      = 'none';
  errorMsg.textContent        = msg;
  errorState.style.display    = 'block';
}

/* ── Force browser download (avoid inline preview for images/PDF) ── */
async function forceDownload(url, fileName) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not fetch file for download.');

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(objectUrl);
}
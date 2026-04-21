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

/* ── Utility: file-type SVG icon ── */
function fileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();

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
  document.getElementById('fileTypeBadge').innerHTML = fileIcon(data.name);

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
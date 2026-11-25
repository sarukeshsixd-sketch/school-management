/* ==========================================================================
   SchoolPro — Utility Helpers (Formatting, Modals, Toasts, CSV & PDF Print)
   ========================================================================== */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function uid(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function formatCurrency(val) {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function renderAvatar(name, photo) {
  if (photo) {
    return `<img src="${escapeHTML(photo)}" alt="${escapeHTML(name)}" class="avatar-sm" />`;
  }
  return `<span class="avatar-sm">${escapeHTML(getInitials(name))}</span>`;
}

function calcLetterGrade(pct) {
  if (pct >= 90) return { letter: 'A+', badge: 'badge-success' };
  if (pct >= 80) return { letter: 'A', badge: 'badge-success' };
  if (pct >= 70) return { letter: 'B', badge: 'badge-info' };
  if (pct >= 60) return { letter: 'C', badge: 'badge-warning' };
  if (pct >= 50) return { letter: 'D', badge: 'badge-warning' };
  return { letter: 'F', badge: 'badge-danger' };
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function openModal(title, bodyHTML, onMount) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  overlay.classList.remove('hidden');
  if (typeof onMount === 'function') {
    onMount(document.getElementById('modal-body'));
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = '';
}

function exportToCSV(filename, headers, rows) {
  const csvEscape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((r) => r.map(csvEscape).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`Exported ${filename}`, 'success');
}

function printHTML(htmlContent) {
  const area = document.getElementById('print-area');
  area.innerHTML = htmlContent;
  window.print();
}

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

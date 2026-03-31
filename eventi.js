/* ============================================================
   GALLERIES — lettura dinamica da Cloudinary
   Per aggiungere galleries usa il pannello admin (/admin.html)
   FALLBACK: se Cloudinary non risponde usa EVENTI_FALLBACK
   ============================================================ */

const CLOUD_NAME = 'djbb8ffbu';
const API_KEY = '656277484675249';

function cloudImgUrl(publicId, w = 800) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${w},f_auto,q_auto/${publicId}`;
}

const EVENTI_FALLBACK = [
  {
    id: 'redline-2026-1',
    nome: "Redline - Itria Road Tour 29.03.2026",
    data: 'Marzo 2026',
    luogo: "Valle d'Itria",
    copertina: 'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896850/VID-20260304-WA0016_-_frame_at_0m7s_ogxym6.jpg',
    foto: [
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896933/sito5_clwejh.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896924/sito3_ajfkxl.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896924/sito4_x3tbe8.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896923/sito1_lfnoyx.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896923/sito2_dbvtqx.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896923/IMGP6719_copia_dsrh6r.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774896922/IMGP6753_copia_khiujw.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774899464/IMGP6707_copia_e9gb4x.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774899469/IMGP6706_copia_tsqf45.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774900370/IMGP6757_copia_ygf8qh.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774900933/IMGP6765_copia_sdistc.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774901579/IMGP6788_copia_mfocgb.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774956580/IMGP6977_nzepou.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774956580/IMGP6767_copia_htfuaz.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774973891/IMGP6794_copia_pjnrbr.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774973891/IMGP6715_copia_nebeeo.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774973891/IMGP6828_copia_qqwhrc.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774987254/IMGP6769_copia_qhpoe2.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774987254/IMGP6724_copia_tupx5d.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774987254/IMGP6900_h8ejvd.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774995248/IMGP6824_copia_baeqpw.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774995248/IMGP6867_copia_soyqci.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774995248/IMGP6775_copia_waftrx.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774995248/IMGP6945_copia_is8qiu.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774995248/IMGP6955_copia_ibznlu.jpg',
      'https://res.cloudinary.com/djbb8ffbu/image/upload/v1774995248/IMGP6835_sigfcv.jpg',
    ]
  },
];

async function loadEventiFromCloudinary() {
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(API_KEY + ':') },
      body: JSON.stringify({ expression: 'folder:galleries/*', max_results: 500, sort_by: [{ created_at: 'asc' }] })
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const resources = data.resources || [];
    if (!resources.length) return null;

    const grouped = {};
    resources.forEach(r => {
      const parts = r.public_id.split('/');
      if (parts.length < 3) return;
      const galleryId = parts[1];
      if (!grouped[galleryId]) grouped[galleryId] = [];
      grouped[galleryId].push(r);
    });

    const savedMeta = JSON.parse(localStorage.getItem('ferroph_galleries') || '{}');
    const eventi = Object.entries(grouped).map(([id, photos]) => {
      const meta = savedMeta[id] || { nome: id, data: '', luogo: '' };
      const cover = photos.find(p => p.public_id.includes('copertina')) || photos[0];
      return {
        id,
        nome: meta.nome || id,
        data: meta.data || '',
        luogo: meta.luogo || '',
        copertina: cover ? cloudImgUrl(cover.public_id, 600) : '',
        foto: photos.map(p => cloudImgUrl(p.public_id, 1200))
      };
    });
    return eventi.length ? eventi : null;
  } catch(e) {
    console.warn('Cloudinary fallback:', e);
    return null;
  }
}

/* ── OVERLAY LOGIC ── */
let eventiLbItems = [], eventiLbIdx = 0;

function buildEventiOverlay(eventi) {
  const grid = document.getElementById('eventiGrid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!eventi.length) {
    grid.innerHTML = '<div style="text-align:center;padding:60px;color:#777;font-size:14px">Nessuna gallery disponibile</div>';
    return;
  }
  eventi.forEach(evento => {
    const card = document.createElement('div');
    card.className = 'ev-card';
    card.innerHTML = `
      <div class="ev-card-img" style="background-image: url('${evento.copertina}')"></div>
      <div class="ev-card-info">
        <div class="ev-card-nome">${evento.nome}</div>
        <div class="ev-card-meta">${evento.data}${evento.luogo ? ' · ' + evento.luogo : ''}</div>
      </div>
    `;
    card.addEventListener('click', () => openEvento(evento));
    grid.appendChild(card);
  });
}

function openEventiOverlay() {
  document.getElementById('eventiOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  showEventiList();
}

function closeEventiOverlay() {
  document.getElementById('eventiOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function showEventiList() {
  document.getElementById('eventiGrid').style.display = 'grid';
  document.getElementById('eventoDetail').style.display = 'none';
  document.getElementById('eventiBackBtn').style.display = 'none';
  document.getElementById('eventiTitle').textContent = 'Galleries';
}

function openEvento(evento) {
  document.getElementById('eventiGrid').style.display = 'none';
  document.getElementById('eventoDetail').style.display = 'block';
  document.getElementById('eventiBackBtn').style.display = 'flex';
  document.getElementById('eventiTitle').textContent = evento.nome;
  const masonry = document.getElementById('eventoMasonry');
  masonry.innerHTML = '';
  eventiLbItems = evento.foto;
  evento.foto.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'ev-masonry-item';
    item.innerHTML = `<img src="${src}" loading="lazy">`;
    item.addEventListener('click', () => openEventiLb(i));
    masonry.appendChild(item);
  });
}

function openEventiLb(idx) {
  eventiLbIdx = idx;
  document.getElementById('eventiLbImg').src = eventiLbItems[eventiLbIdx];
  document.getElementById('eventiLb').classList.add('open');
}

function closeEventiLb() {
  document.getElementById('eventiLb').classList.remove('open');
  document.getElementById('eventiLbImg').src = '';
}

function navigateEventiLb(dir) {
  eventiLbIdx = (eventiLbIdx + dir + eventiLbItems.length) % eventiLbItems.length;
  document.getElementById('eventiLbImg').src = eventiLbItems[eventiLbIdx];
}

document.addEventListener('DOMContentLoaded', async () => {
  buildEventiOverlay(EVENTI_FALLBACK);
  const live = await loadEventiFromCloudinary();
  if (live) buildEventiOverlay(live);

  document.getElementById('eventiCloseBtn').addEventListener('click', closeEventiOverlay);
  document.getElementById('eventiBackBtn').addEventListener('click', showEventiList);
  document.getElementById('eventiOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('eventiOverlay')) closeEventiOverlay();
  });
  document.getElementById('eventiLbClose').addEventListener('click', closeEventiLb);
  document.getElementById('eventiLbPrev').addEventListener('click', () => navigateEventiLb(-1));
  document.getElementById('eventiLbNext').addEventListener('click', () => navigateEventiLb(1));
  document.getElementById('eventiLb').addEventListener('click', e => {
    if (e.target === document.getElementById('eventiLb')) closeEventiLb();
  });
  document.addEventListener('keydown', e => {
    if (document.getElementById('eventiLb').classList.contains('open')) {
      if (e.key === 'Escape') closeEventiLb();
      if (e.key === 'ArrowLeft') navigateEventiLb(-1);
      if (e.key === 'ArrowRight') navigateEventiLb(1);
      return;
    }
    if (document.getElementById('eventiOverlay').classList.contains('open') && e.key === 'Escape') closeEventiOverlay();
  });
});
import QRCode from 'qrcode';
import JSZip from 'jszip';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function createCardPng({ section, id, name, nik, desa, desil }) {
  const width = 1100;
  const height = 700;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, 160);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px Inter, sans-serif';
  ctx.fillText('Kartu Identitas DESIL', 48, 72);
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText('Simpan dan bagikan hanya pada pengguna terautentikasi.', 48, 110);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText(section == 'keluarga' ? 'Nama Kepala Keluarga' : 'Nama Lengkap', 48, 200);
  ctx.font = '600 26px Inter, sans-serif';
  ctx.fillText(name || '-', 48, 245);

  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText(section == 'keluarga' ? 'Nomor KK' : 'NIK', 48, 310);
  ctx.font = '600 26px Inter, sans-serif';
  ctx.fillText(nik || '-', 48, 355);

  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText('Desa/Kelurahan', 48, 420);
  ctx.font = '600 26px Inter, sans-serif';
  ctx.fillText(desa || '-', 48, 465);

  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText('Desil', 48, 530);
  ctx.font = '600 26px Inter, sans-serif';
  ctx.fillText(desil || '-', 48, 575);

  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText('Tipe', 48, 640);
  ctx.font = '600 26px Inter, sans-serif';
  ctx.fillText(section === 'keluarga' ? 'Keluarga' : 'Individu', 48, 685);

  const qrLink = `${window.location.origin}/detail/${section}/${id}`;
  const qrDataUrl = await QRCode.toDataURL(qrLink, { margin: 1, width: 320 });
  const qrImage = await loadImage(qrDataUrl);

  const qrX = width - 380;
  const qrY = 180;
  const qrSize = 320;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 120);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText('Scan untuk lihat detail', qrX, qrY + qrSize + 40);
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText(qrLink, qrX, qrY + qrSize + 75);

  return canvas.toDataURL('image/png');
}

export async function downloadCardPng(data, fileName = 'kartu-desil.png') {
  const dataUrl = await createCardPng(data);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}

export async function downloadCardsZip(items = [], zipName = 'kartu-desil.zip') {
  const zip = new JSZip();

  for (const item of items) {
    try {
      const dataUrl = await createCardPng(item);
      // convert dataURL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const safeId = (item.id || item._id || item.nik || item.nomor_kk || item.name || 'item').toString().replace(/[^a-z0-9-_]/gi, '_');
      const fileName = `kartu-desil-${item.section || 'item'}-${safeId}.png`;
      zip.file(fileName, blob);
    } catch (err) {
      console.error('Gagal buat kartu untuk', item, err);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

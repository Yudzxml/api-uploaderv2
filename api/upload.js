const formidable = require('formidable');
const fs = require('fs');
const { fromBuffer } = require('file-type');
const axios = require('axios');

// Vercel config to disable default body parser
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const form = new formidable.IncomingForm();

  // Mengatur lokasi penyimpanan file sementara
  form.uploadDir = '/tmp'; // Tempatkan file sementara di /tmp untuk Vercel

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error('Error parsing form:', err); // Log error parsing form
        return res.status(500).json({ error: 'Gagal parsing form' });
      }

      const file = files.file;
      if (!file) {
        console.error('File tidak ditemukan');
        return res.status(400).json({ error: 'File tidak ditemukan' });
      }

      // Baca buffer file yang diupload
      const buffer = fs.readFileSync(file.filepath);
      const result = await fromBuffer(buffer);
      const mime = result?.mime;

      if (!mime) {
        console.error('Mime tidak valid');
        return res.status(400).json({ error: 'Mime tidak valid' });
      }

      // Membuat nama file baru dengan extension sesuai mime
      const fileName = Date.now() + '.' + mime.split('/')[1];
      const folder = 'uploads';

      // Dapatkan URL signed untuk upload ke CDN
      const getSigned = await axios.post("https://pxpic.com/getSignedUrl", {
        folder, fileName
      }, {
        headers: { "Content-Type": "application/json" }
      });

      // Upload file ke CDN menggunakan URL yang didapat
      await axios.put(getSigned.data.presignedUrl, buffer, {
        headers: { "Content-Type": mime }
      });

      // URL file yang berhasil diupload
      const fileUrl = `https://files.fotoenhancer.com/uploads/${fileName}`;
      console.log('File berhasil diupload:', fileUrl); // Log URL file yang berhasil diupload
      res.json({ status: 200, fileUrl, mime });
    } catch (e) {
      console.error('Error selama proses upload:', e); // Log error jika terjadi kesalahan
      res.status(500).json({ error: e.message });
    }
  });
};
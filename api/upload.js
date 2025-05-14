const fs = require('fs');
const axios = require('axios');
const { fromBuffer } = require('file-type');

module.exports.config = {
  api: {
    bodyParser: false, // Disable bodyParser from Vercel
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('Invalid method received:', req.method); // Log method yang diterima
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const chunks = [];

  // Menerima data chunk per chunk dari request
  req.on('data', chunk => {
    console.log('Received chunk of data:', chunk.length); // Log ukuran chunk yang diterima
    chunks.push(chunk); // Menyimpan chunk dalam array
  });

  req.on('error', (err) => {
    console.error('Error while receiving data:', err); // Log jika terjadi error saat menerima data
    return res.status(500).json({ error: 'Error receiving file data' });
  });

  req.on('end', async () => {
    try {
      console.log('End of data stream reached. Processing file...'); // Log saat data selesai diterima

      const buffer = Buffer.concat(chunks); // Menggabungkan semua chunk menjadi buffer

      console.log('Buffer created, size:', buffer.length); // Log ukuran buffer yang sudah dibuat

      // Mendapatkan MIME type dari file menggunakan file-type
      const result = await fromBuffer(buffer);
      const mime = result?.mime;

      if (!mime) {
        console.log('Mime type not found or invalid.'); // Log jika mime tidak valid
        return res.status(400).json({ error: 'Mime tidak valid' });
      }

      const fileName = Date.now() + '.' + mime.split('/')[1];
      const folder = 'uploads';

      console.log('Generated file name:', fileName); // Log nama file yang dihasilkan

      // Mendapatkan URL signed untuk upload file
      const getSigned = await axios.post("https://pxpic.com/getSignedUrl", {
        folder, fileName
      }, {
        headers: { "Content-Type": "application/json" }
      });

      console.log('Received signed URL from server:', getSigned.data.presignedUrl); // Log URL signed yang diterima

      // Upload file ke server tujuan menggunakan URL signed
      await axios.put(getSigned.data.presignedUrl, buffer, {
        headers: { "Content-Type": mime }
      });

      const fileUrl = `https://files.fotoenhancer.com/uploads/${fileName}`;
      console.log('File successfully uploaded. File URL:', fileUrl); // Log URL file yang di-upload

      res.json({ status: 200, fileUrl, mime });

    } catch (e) {
      console.error("Error during file processing:", e); // Log error jika terjadi saat pemrosesan file
      res.status(500).json({ error: e.message });
    }
  });
};
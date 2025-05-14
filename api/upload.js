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
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Gagal parsing form' });
    }

    try {
      const file = files.file;
      if (!file) {
        console.error('File not found in form submission:', files);
        return res.status(400).json({ error: 'File tidak ditemukan' });
      }

      const buffer = fs.readFileSync(file.filepath);
      const result = await fromBuffer(buffer);
      const mime = result?.mime;

      if (!mime) {
        console.error('Invalid mime type for file:', file);
        return res.status(400).json({ error: 'Mime tidak valid' });
      }

      const fileName = Date.now() + '.' + mime.split('/')[1];
      const folder = 'uploads';

      let getSigned;
      try {
        getSigned = await axios.post("https://pxpic.com/getSignedUrl", {
          folder, fileName
        }, {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error('Error getting signed URL:', error);
        return res.status(500).json({ error: 'Gagal mendapatkan signed URL' });
      }

      let uploadResult;
      try {
        uploadResult = await axios.put(getSigned.data.presignedUrl, buffer, {
          headers: { "Content-Type": mime }
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Gagal meng-upload file' });
      }

      const fileUrl = `https://files.fotoenhancer.com/uploads/${fileName}`;
      console.log('File uploaded successfully:', fileUrl);
      res.json({ status: 200, fileUrl, mime });
    } catch (e) {
      console.error('Unexpected error:', e);
      res.status(500).json({ error: e.message });
    }
  });
};
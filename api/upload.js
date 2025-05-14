const Busboy = require('busboy');
const axios = require('axios');
const { fromBuffer } = require('file-type');

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const busboy = Busboy({ headers: req.headers });
  const chunks = [];
  let mimeType = '';
  let fileName = '';

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    fileName = filename;
    mimeType = mimetype;

    file.on('data', (data) => {
      chunks.push(data);
    });

    file.on('end', () => {
      console.log(`File [${filename}] upload selesai.`);
    });
  });

  busboy.on('finish', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const type = await fromBuffer(buffer);
      if (!type) return res.status(400).json({ error: 'MIME tidak valid' });

      const finalName = Date.now() + '.' + type.ext;
      const folder = 'uploads';

      const getSigned = await axios.post("https://pxpic.com/getSignedUrl", {
        folder,
        fileName: finalName,
      });

      await axios.put(getSigned.data.presignedUrl, buffer, {
        headers: { "Content-Type": type.mime }
      });

      const fileUrl = `https://files.fotoenhancer.com/uploads/${finalName}`;
      res.status(200).json({ fileUrl, mime: type.mime });
    } catch (e) {
      console.error('Upload error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  req.pipe(busboy);
};
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { File } = require('./models');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const URL_EXPIRATION_SECONDS = parseInt(process.env.S3_URL_EXPIRATION_SECONDS || '3600', 10);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'file field is required' });
    }

    const file = req.file;
    const decodedOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const key = `uploads/${Date.now()}-${decodedOriginalName}`;

    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }).promise();

    const saved = await File.create({
      originalName: decodedOriginalName,
      mimeType: file.mimetype,
      size: file.size,
      s3Key: key
    });

    return res.status(201).json({
      id: saved.id,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      size: saved.size,
      createdAt: saved.createdAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const files = await File.findAll({
      order: [['createdAt', 'DESC']]
    });

    return res.json(
      files.map((f) => ({
        id: f.id,
        originalName: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
        createdAt: f.createdAt
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch files', error: err.message });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const url = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: file.s3Key,
      Expires: URL_EXPIRATION_SECONDS
    });

    return res.json({
      id: file.id,
      originalName: file.originalName,
      downloadUrl: url,
      expiresInSeconds: URL_EXPIRATION_SECONDS
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to generate download URL', error: err.message });
  }
});

// 파일 삭제: S3 객체 삭제 + DB 레코드 삭제
router.delete('/:id', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: file.s3Key
      })
      .promise();

    await file.destroy();

    return res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete file', error: err.message });
  }
});

module.exports = router;


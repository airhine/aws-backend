const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUploadRouter = require('./uploadRoutes');
const { sequelize } = require('./models');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 브라우저에서 IP로 접속 시 정상 접속 확인용
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Backend</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:40px;background:#1a1a2e;color:#eee;">
      <h1>서버 정상 접속</h1>
      <p>Backend is running.</p>
      <p><a href="/health" style="color:#06b6d4;">/health</a> - 헬스체크</p>
    </body>
    </html>
  `);
});

// 헬스체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ok', db: 'up' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'error', db: 'down', message: err.message });
  }
});

app.use('/files', fileUploadRouter);

const PORT = process.env.PORT || 80;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

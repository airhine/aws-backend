const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUploadRouter = require('./uploadRoutes');
const { sequelize } = require('./models');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'File upload backend is running' });
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

const PORT = process.env.PORT || 4000;

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

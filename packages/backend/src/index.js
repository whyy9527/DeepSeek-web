const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const stream = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const data = JSON.stringify(chunk);
      res.write(`data: ${data}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('请求处理出错');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`后端运行在端口 ${PORT}`));
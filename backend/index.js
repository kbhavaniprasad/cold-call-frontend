require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Retell = require('retell-sdk');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Retell SDK lazily to avoid crash on startup when API key is missing
let retellClient;
try {
  retellClient = new Retell({
    apiKey: process.env.RETELL_API_KEY || 'dummy_key_to_prevent_crash',
  });
} catch (error) {
  console.error('Failed to initialize Retell SDK:', error);
}

app.post('/api/create-web-call', async (req, res) => {
  try {
    const agentId = process.env.RETELL_AGENT_ID;

    if (!process.env.RETELL_API_KEY || process.env.RETELL_API_KEY === 'your_retell_api_key_here') {
      return res.status(500).json({ error: 'Retell API Key is not configured in backend.' });
    }

    if (!agentId || agentId === 'your_retell_agent_id_here') {
      return res.status(500).json({ error: 'Retell Agent ID is not configured in backend.' });
    }

    const callResponse = await retellClient.call.createWebCall({
      agent_id: agentId,
    });

    res.json(callResponse);
  } catch (error) {
    console.error('Error creating web call:', error);
    res.status(500).json({ error: 'Failed to create web call', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

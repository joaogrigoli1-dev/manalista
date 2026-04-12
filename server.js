const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API: List available simulations
app.get('/api/simulations', (req, res) => {
  const simDir = path.join(__dirname, 'data', 'simulations');
  try {
    const files = fs.readdirSync(simDir).filter(f => f.endsWith('.json'));
    const simulations = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(simDir, f), 'utf8'));
      return { id: f.replace('.json', ''), nome: data.paciente.nome, idade: data.paciente.idade };
    });
    res.json(simulations);
  } catch (err) {
    res.json([]);
  }
});

// API: Get specific simulation
app.get('/api/simulations/:id', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'simulations', `${req.params.id}.json`);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Simulação não encontrada' });
  }
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MAnalista server running on port ${PORT}`);
});

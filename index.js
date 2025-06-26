require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('./routes'));
app.use((err, req, res, next) => res.status(500).send({ error: err.message }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/conscious-cart')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));

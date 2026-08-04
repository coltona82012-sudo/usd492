const mongoose = require('mongoose');
const dbUrl = 'mongodb://localhost:27017/usd492';

mongoose.connect(dbUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

module.exports = {
  News: mongoose.model('News', {
    title: String,
    content: String,
    date: Date,
    category: String,
    link: String
  }),

  Event: mongoose.model('Event', {
    title: String,
    description: String,
    date: Date,
    location: String,
    status: String,
    cancelledReason: String,
    participants: [{name: String, role: String}]
  })
};
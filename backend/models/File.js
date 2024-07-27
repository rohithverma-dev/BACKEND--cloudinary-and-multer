const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  resumeUrl: String,
  profilePhotoUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);

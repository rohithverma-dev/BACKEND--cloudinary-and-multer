const express = require('express');
const multer = require('multer');
const Datauri = require('datauri/parser');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const File = require('./models/File');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for the frontend URL
app.use(cors({
    origin: process.env.FRONTEND_URL
}));

// Connect to MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Datauri
const datauri = new Datauri();

// Set up Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handle file upload with PUT method
app.put('/upload/:id', upload.array('files'), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length !== 2) {
            return res.status(400).json({ message: 'Please upload exactly 2 files.' });
        }

        const [resume, profilePhoto] = files;

        // Check if originalname is present
        if (!resume.originalname || !profilePhoto.originalname) {
            return res.status(400).json({ message: 'File metadata is missing.' });
        }

        // Convert file buffers to data URIs
        const resumeDataUri = datauri.format(path.extname(resume.originalname), resume.buffer).content;
        const profilePhotoDataUri = datauri.format(path.extname(profilePhoto.originalname), profilePhoto.buffer).content;

        // Find the existing file record
        const fileId = req.params.id;
        const existingFile = await File.findById(fileId);

        if (!existingFile) {
            return res.status(404).json({ message: 'File record not found' });
        }

        // Delete previous files from Cloudinary
        if (existingFile.resumeUrl) {
            const resumePublicId = existingFile.resumeUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`myfolder/${resumePublicId}`);
        }
        if (existingFile.profilePhotoUrl) {
            const profilePhotoPublicId = existingFile.profilePhotoUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`myfolder/${profilePhotoPublicId}`);
        }

        // Upload new files to Cloudinary
        const resumeUpload = await cloudinary.uploader.upload(resumeDataUri, {
            folder: 'myfolder',
        });

        const profilePhotoUpload = await cloudinary.uploader.upload(profilePhotoDataUri, {
            folder: 'myfolder',
        });

        // Update file URLs in MongoDB
        const updatedFile = await File.findByIdAndUpdate(
            fileId,
            {
                resumeUrl: resumeUpload.secure_url,
                profilePhotoUrl: profilePhotoUpload.secure_url,
            },
            { new: true, runValidators: true }  
        );

        if (!updatedFile) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.status(200).json({
            message: 'Files uploaded and record updated successfully',
            updatedFile
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading files', error });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

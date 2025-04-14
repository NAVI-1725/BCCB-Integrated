const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/')); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const fileTypes = /pdf/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf files are allowed!'));
        }
    },
});

// Handle File Upload and API Call Without Await
router.post('/admin/upload_file', upload.single('file'), (req, res) => {
    const { vectorStoreName } = req.body;

    if (!req.file || !vectorStoreName) {
        return res.status(400).send('Both file and vector store name are required.');
    }

    // Log the uploaded file information
    console.log(`File uploaded: ${req.file.path}`);
    console.log(`Vector Store Name: ${vectorStoreName}`);

    // Prepare data for API call to the Python server
    const filePath = req.file.path;

    // Make API call to the Python server
    fetch('http://127.0.0.1:5050/process_file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filePath: filePath,
            vectorStoreName: vectorStoreName,
        })
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to process file: ${response.statusText}`);
            }
            return response.json();
        })
        .then((pythonResponse) => {
            // Check if the success in the Python response is true
            if (pythonResponse.success) {
                res.send({
                    success: true,
                    message: 'File uploaded and processed successfully!',
                    pythonResponse: pythonResponse,
                });
            } else {
                res.send({
                    success: false,
                    message: 'File uploaded, but processing failed.',
                    pythonResponse: pythonResponse,
                });
            }
        })
        .catch((error) => {
            console.error('Error calling Python API:', error.message);
            res.status(500).send({
                success: false,
                message: 'File upload succeeded, but processing failed.',
                error: error.message,
            });
        });
});

module.exports = router;

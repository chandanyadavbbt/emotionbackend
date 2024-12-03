

const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit'); // Import pdfkit
const fs = require('fs');
const port = 4000;

const corsOptions = {
    origin: ['https://emotionaiui.netlify.app','http://localhost:3000','http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const questions = [
    {
        id: 1,
        text: "As a child, I was (or had) concentration problems, easily distracted?",
        options: [
            { id: 'a', text: 'Not at all' },
            { id: 'b', text: 'Mildly' },
            { id: 'c', text: 'Moderately' },
            { id: 'd', text: 'Quite a Bit' },
            { id: 'e', text: 'Very Much' },
        ]
    },
    {
        id: 2,
        text: "How often do you lose track of time when working on tasks?",
        options: [
            { id: 'a', text: 'Never' },
            { id: 'b', text: 'Rarely' },
            { id: 'c', text: 'Sometimes' },
            { id: 'd', text: 'Often' },
            { id: 'e', text: 'Always' },
        ]
    },
    {
        id: 3,
        text: "How well do you manage your time when juggling multiple tasks?",
        options: [
            { id: 'a', text: 'Very Poorly' },
            { id: 'b', text: 'Poorly' },
            { id: 'c', text: 'Adequately' },
            { id: 'd', text: 'Well' },
            { id: 'e', text: 'Very Well' },
        ]
    },
    {
        id: 4,
        text: "How often do you experience difficulty sleeping?",
        options: [
            { id: 'a', text: 'Never' },
            { id: 'b', text: 'Rarely' },
            { id: 'c', text: 'Sometimes' },
            { id: 'd', text: 'Often' },
            { id: 'e', text: 'Always' },
        ]
    },
    {
        id: 5,
        text: "How frequently do you experience stress in your daily life?",
        options: [
            { id: 'a', text: 'Never' },
            { id: 'b', text: 'Rarely' },
            { id: 'c', text: 'Sometimes' },
            { id: 'd', text: 'Often' },
            { id: 'e', text: 'Always' },
        ]
    },
    // {
    //     id: 6,
    //     text: "How often do you engage in physical exercise each week?",
    //     options: [
    //         { id: 'a', text: 'Not at all' },
    //         { id: 'b', text: 'Once or twice' },
    //         { id: 'c', text: 'Three to four times' },
    //         { id: 'd', text: 'Five to six times' },
    //         { id: 'e', text: 'Daily' },
    //     ]
    // }
];

// Endpoint to add a new question
// Endpoint to add a new question
app.post('/api/questions', (req, res) => {
    const newQuestion = req.body;
    
    // Ensure new question has a unique ID based on the current questions array length
    newQuestion.id = questions.length + 1;

    // Ensure options have correct structure with incremental ids (a, b, c, etc.)
    newQuestion.options = newQuestion.options.map((option, index) => ({
        id: String.fromCharCode(97 + index), // 'a', 'b', 'c', etc.
        text: option.text
    }));

    questions.push(newQuestion); // Add the new question to the array

    res.status(201).json({ message: 'Question added successfully', questions });
});


// Endpoint to edit an existing question
app.put('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    const updatedQuestion = req.body;
    const questionIndex = questions.findIndex(q => q.id == id);

    if (questionIndex !== -1) {
        questions[questionIndex] = updatedQuestion;
        res.status(200).json({ message: 'Question updated successfully', questions });
    } else {
        res.status(404).json({ message: 'Question not found' });
    }
});


// Endpoint to get questions
app.get('/api/questions', (req, res) => {
    res.json(questions);
});

// Endpoint to handle the incoming quiz summary and generate a PDF
app.post('/api/save-summary', (req, res) => {
    const summaryData = req.body;

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set the headers to indicate a file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quiz_summary.pdf');

    // Pipe the PDF stream to the response
    doc.pipe(res);

    // Add title with custom styling
    doc.fontSize(20)
        .fillColor('#2E86C1')  // Blue color for title
        .text('Quiz Summary', { align: 'center', underline: true })
        .moveDown(1.5);

    // Loop through each question
    summaryData.questions.forEach((question, index) => {
        // Add question title with bold styling
        doc.fontSize(14)
            .fillColor('#000000')  // Black color for question text
            .text(`Question ${index + 1}: ${question.question}`, { bold: true })
            .moveDown(0.5);

        // Add selected option and time taken
        doc.fontSize(12)
            .fillColor('#424949')  // Dark grey for details
            .text(`Selected Option: ${question.selectedOption || 'N/A'}`)
            .moveDown(0.3);

        doc.fontSize(12)
            .fillColor('#424949')  // Dark grey for details
            .text(`Time Taken: ${question.timeTaken || 'N/A'}`)
            .moveDown(1);

        // Add emotion percentages if they are greater than 0
        const emotionColors = {
            Happy: '#F4D03F',  // Yellow
            Sad: '#5DADE2',    // Blue
            Angry: '#E74C3C',  // Red
            Disgust: '#28B463',// Green
            Fear: '#9B59B6',   // Purple
            Surprise: '#F39C12',// Orange
            Neutral: '#95A5A6' // Grey
        };

        doc.fontSize(12)
            .fillColor('#2E86C1')  // Blue color for emotions heading
            .text('Emotions:', { underline: true });

        for (const [emotion, percentage] of Object.entries(question.percentages)) {
            if (percentage > 0) {
                doc.fillColor(emotionColors[emotion] || '#000000')  // Apply specific emotion color
                    .text(`  - ${emotion}: ${percentage}%`);
            }
        }

        doc.moveDown(1);  // Add spacing between questions
    });

    // Finalize the PDF and end the stream
    doc.end();
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

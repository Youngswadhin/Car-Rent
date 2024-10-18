import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

const generatePDF = (bookingDetails) => {
    const doc = new PDFDocument();
    const buffers = [];

    return new Promise((resolve) => {
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // Document structure
        doc.fontSize(25).text('Booking Invoice', { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        doc.text(`Details:`);
        for (const [key, value] of Object.entries(bookingDetails)) {
            doc.text(`${key}: ${value}`);
        }

        doc.end();
    });
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, bookingDetails } = req.body;

    try {
        // Generate the PDF
        const pdfData = await generatePDF(bookingDetails);

        // Configure your email transporter using environment variables
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // Replace with your email service
            auth: {
                user: process.env.EMAIL_USER, // Accessing the user from .env file
                pass: process.env.EMAIL_PASS, // Accessing the password from .env file
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Booking Confirmation',
            text: `Your booking has been confirmed!`,
            attachments: [{
                filename: 'invoice.pdf',
                content: pdfData,
                contentType: 'application/pdf',
            }],
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error sending email' });
    }
}

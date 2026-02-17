const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000; // Порт, на котором будет работать Node.js

// Middleware для чтения JSON
app.use(bodyParser.json());

// Настройка почтового транспорта (SMTP)
// ВАЖНО: Заполните данные вашего почтового сервера (Gmail, Яндекс, или от хостинга)
const transporter = nodemailer.createTransport({
    host: 'smtp.your-hosting.com', // Адрес SMTP сервера (например smtp.gmail.com)
    port: 465, // Или 587
    secure: true, // true для 465, false для 587
    auth: {
        user: 'info@yas.wine', // Ваша почта
        pass: 'YOUR_EMAIL_PASSWORD' // Ваш пароль от почты
    }
});

// Роут для отправки письма
app.post('/api/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const mailOptions = {
        from: `"MyUGC Site" <info@yas.wine>`, // От кого
        to: 'info@yas.wine', // Кому (себе)
        replyTo: email, // Чтобы отвечать клиенту нажав "Ответить"
        subject: `New Request from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.status(200).json({ message: 'Email sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
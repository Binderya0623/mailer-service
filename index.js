const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;
app.use(express.json());
app.use(cors());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const EmailLog = mongoose.model('EmailLog', new mongoose.Schema({ to: String, subject: String, body: String, timestamp: { type: Date, default: Date.now } }));

app.post('/send-email', async (req, res) => {
  const { to, subject, body } = req.body;
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html: body,
    };
    await sgMail.send(msg);
    await EmailLog.create({ to, subject, body });
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email', error: error.response ? error.response.body : error });
  }
});

app.get('/emails', async (req, res) => {
  const { search } = req.query;
  let emails;
  if (search) {
    emails = await EmailLog.find({
      $or: [
        { to: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ]
    });
  } else {
    emails = await EmailLog.find();
  }
  res.json(emails);
});

app.listen(PORT, () => console.log(`Mail Service running on port ${PORT}`));

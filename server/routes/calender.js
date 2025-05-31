import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-event', async (req, res) => {
  const { accessToken, title, description, startTime, endTime } = req.body;

  try {
    const response = await axios.post(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        summary: title,
        description,
        start: {
          dateTime: startTime,
          timeZone: 'Asia/Kolkata', // Change based on user
        },
        end: {
          dateTime: endTime,
          timeZone: 'Asia/Kolkata',
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          conferenceDataVersion: 1, // Required for Meet link
        },
      }
    );

    const event = response.data;

    return res.json({
      message: 'Event created successfully!',
      eventLink: event.htmlLink,
      meetLink: event.conferenceData?.entryPoints?.[0]?.uri || null,
    });
  } catch (error) {
    console.error('Error creating event:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

export default router;
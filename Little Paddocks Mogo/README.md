# Little Paddocks Mogo Website

This version includes a Vercel backend function for real booking enquiry emails using Resend.

## Email receiver
Booking emails are configured to go to:

Shoebkhan1497@gmail.com

## Required Vercel Environment Variables
Add these in Vercel Project Settings > Environment Variables:

- RESEND_API_KEY
- BOOKING_TO_EMAIL = Shoebkhan1497@gmail.com
- FROM_EMAIL = Little Paddocks Mogo <onboarding@resend.dev>

## Files added for backend email
- api/send-booking-email.js
- package.json
- .env.example

## Important
Do not place the Resend API key inside HTML, CSS or browser JavaScript files.
Only store it in Vercel Environment Variables.


## Backend email fix
This version uses the Resend REST API directly inside `api/send-booking-email.js`.
It does not require importing the `resend` package, which avoids module/dependency errors in Vercel Functions.

Required Vercel Environment Variables:
- RESEND_API_KEY
- BOOKING_TO_EMAIL = Shoebkhan1497@gmail.com
- FROM_EMAIL = Little Paddocks Mogo <onboarding@resend.dev>

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import GMAIL_USER, GMAIL_APP_PASSWORD

logger = logging.getLogger("sevamitra_api")

def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Sends an email using Gmail SMTP and App Password loaded from environment variables.
    Logs safe error messages without exposing credentials.
    """
    if not to_email or "@" not in to_email:
        logger.warning(f"[EMAIL] Invalid recipient email address provided: {to_email}")
        return False

    if not GMAIL_USER or not GMAIL_APP_PASSWORD or GMAIL_USER == "your-email@gmail.com":
        logger.warning("[EMAIL] Gmail credentials (GMAIL_USER / GMAIL_APP_PASSWORD) not configured in environment.")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = GMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Connect to Gmail SMTP server on port 587 with STARTTLS
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=10)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()

        logger.info(f"[EMAIL SUCCESS] Reminder email sent to {to_email} | Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send email to {to_email}. Error: {str(e)}")
        return False


def send_provider_booking_reminder(
    provider_email: str,
    provider_name: str,
    customer_name: str,
    service_name: str,
    booking_date: str,
    booking_time: str,
    booking_address: str,
    notes: str = ""
) -> bool:
    """
    Sends reminder email to the service provider.
    """
    subject = "Reminder: Service Booking Scheduled for Tomorrow"
    notes_clause = f"\nNotes: {notes}" if notes and notes.strip() else ""
    
    body = (
        f"Hello {provider_name},\n\n"
        f"This is a reminder that you have a service booking scheduled for tomorrow.\n\n"
        f"Customer: {customer_name}\n"
        f"Service: {service_name}\n"
        f"Date: {booking_date}\n"
        f"Time: {booking_time}\n"
        f"Service Address: {booking_address}"
        f"{notes_clause}\n\n"
        f"Please be prepared to provide the booked service at the scheduled time.\n\n"
        f"Thank you,\n"
        f"LocalService"
    )

    return send_email(provider_email, subject, body)


def send_customer_booking_reminder(
    customer_email: str,
    customer_name: str,
    provider_name: str,
    service_name: str,
    booking_date: str,
    booking_time: str,
    booking_address: str,
    notes: str = ""
) -> bool:
    """
    Sends reminder email to the customer.
    """
    subject = "Reminder: Your Service Booking is Tomorrow"
    notes_clause = f"\nNotes: {notes}" if notes and notes.strip() else ""

    body = (
        f"Hello {customer_name},\n\n"
        f"This is a reminder that your booked service is scheduled for tomorrow.\n\n"
        f"Service: {service_name}\n"
        f"Service Provider: {provider_name}\n"
        f"Date: {booking_date}\n"
        f"Time: {booking_time}\n"
        f"Service Address: {booking_address}"
        f"{notes_clause}\n\n"
        f"Please be available at the scheduled time.\n\n"
        f"Thank you,\n"
        f"LocalService"
    )

    return send_email(customer_email, subject, body)

# SevaMitra — Required Changes & Missing Functionality

This document outlines the code modifications and missing features identified during the system audit.

---

## A. Existing Functionalities That Require Changes

### 1. User Registration State Bug
* **Module**: Authentication
* **Functionality**: Account Approval State
* **Current Implementation**: The user registration service writes `"account_status": "pending"` and `"status": "pending"` globally for all registrations.
* **Problem**: Customers (role `User`) are blocked from logging in immediately after sign up, incorrectly prompting them that they must await administrator review. Only providers should be placed in a pending state.
* **Required Change**: Modify the registration logic to check the user's role. If the role is `"User"`, set `account_status` and `status` to `"approved"` (or `"active"`) and `is_active` to `True`. Keep it `"pending"` and `False` only for `"Provider"` accounts.
* **Priority**: **Critical**
* **Files Involved**:
  * [backend/app/auth/service.py](file:///d:/Local-service-finder/backend/app/auth/service.py#L34-L38)

---

### 2. Duplicate Phone Registration API Crash
* **Module**: Authentication
* **Functionality**: Unique Contact Verification
* **Current Implementation**: Unique validation is only programmatically executed on `email`. The unique index on `phone` is enforced by MongoDB.
* **Problem**: Registering an account with a duplicate phone number triggers a PyMongo `DuplicateKeyError` which crashes the API with an HTTP 500 error.
* **Required Change**: Query the database in the service layer using `repository.get_user_by_phone(phone)` before calling insert. If a document matches, return a clean validation error: `{"success": False, "message": "Phone number already exists"}`.
* **Priority**: **High**
* **Files Involved**:
  * [backend/app/auth/service.py](file:///d:/Local-service-finder/backend/app/auth/service.py#L6-L50)
  * [backend/app/auth/repository.py](file:///d:/Local-service-finder/backend/app/auth/repository.py)

---

### 3. Settings Preferences Not Saved
* **Module**: Settings
* **Functionality**: Preferences Persistence
* **Current Implementation**: Frontend Settings page manages switches (language, currency, notification channels, security toggles) in local React states only.
* **Problem**: All configuration edits are discarded whenever the session terminates, the user signs out, or the page is refreshed.
* **Required Change**: Create database fields in the user schema to store user preferences. Add a `PUT /users/settings` endpoint in the backend, and update [SettingsPage.jsx](file:///d:/Local-service-finder/frontend/src/pages/SettingsPage.jsx) to sync changes to the database.
* **Priority**: **Medium**
* **Files Involved**:
  * [frontend/src/pages/SettingsPage.jsx](file:///d:/Local-service-finder/frontend/src/pages/SettingsPage.jsx)
  * [backend/app/users/routes.py](file:///d:/Local-service-finder/backend/app/users/routes.py)
  * [backend/app/users/schema.py](file:///d:/Local-service-finder/backend/app/users/schema.py)

---

## B. Missing Functionalities

### 1. Reviews and Ratings Module
* **Module**: Reviews
* **Missing Functionality**: Reviews CRUD & Aggregation
* **Description**: Complete backend logic (routes, controller, schemas, database collection) to allow customers to leave written feedback and rating scores (1-5 stars) for completed bookings.
* **Why Required**: Ratings are the primary metric used to filter and evaluate providers. The current reviews features are hardcoded mock values.
* **Suggested Implementation Area**: 
  * backend: Implement endpoints `/reviews/` in [backend/app/reviews/routes.py](file:///d:/Local-service-finder/backend/app/reviews/routes.py).
  * frontend: Add a rating form in the customer dashboard on completed bookings, and display reviews on the provider details view.
* **Priority**: **High**

---

### 2. Payment Gateway Integration
* **Module**: Payment
* **Missing Functionality**: Payment processing (Stripe / Razorpay)
* **Description**: Payment collections, online checkout links, provider payout calculation splits, refund mechanisms, and transaction invoice records.
* **Why Required**: To process real transactions when a service booking completes.
* **Suggested Implementation Area**: Create a new backend directory `backend/app/payments` and connect it to a payment gateway SDK. Add receipt viewing elements on the user dashboard.
* **Priority**: **High**

---

### 3. Geolocation search (Distance calculations)
* **Module**: Search & Location
* **Missing Functionality**: Coordinates distance mapping
* **Description**: Saving coordinates (latitude, longitude) on provider address profiles, and using geospatial indices to search and sort providers by actual physical distance from the customer's location.
* **Why Required**: Users look for providers near them, but the search currently relies on simple text match of city strings.
* **Suggested Implementation Area**: `backend/app/providers/repository.py` (adding geospatial `$near` queries) and frontend address selectors.
* **Priority**: **Medium**

---

### 4. Booking Rescheduling
* **Module**: Bookings
* **Missing Functionality**: Rescheduling dates and times
* **Description**: A rescheduling form where users can request a new date or time slot, sending a notification alert to the provider who must accept the rescheduled slot.
* **Why Required**: Plans change, and users need to adjust bookings instead of cancelling and re-booking.
* **Suggested Implementation Area**: `backend/app/bookings/routes.py` and `frontend/src/pages/UserDashboard.jsx` (actions).
* **Priority**: **Medium**

---

### 5. Admin Category Management
* **Module**: Admin
* **Missing Functionality**: Category CRUD UI
* **Description**: Endpoints and dashboard panels allowing admin staff to add new service categories (e.g. "Locksmith"), upload icons, or deactivate obsolete ones.
* **Why Required**: Categories are currently locked to startup seed files; they cannot be managed dynamically.
* **Suggested Implementation Area**: `backend/app/admin/routes.py` and `frontend/src/pages/AdminDashboard.jsx`.
* **Priority**: **Medium**

---

### 6. Email and SMS Gateways (SMTP / Twilio)
* **Module**: Notifications
* **Missing Functionality**: Email & SMS Delivery Transports
* **Description**: Configured mail transfer agents and SMS clients to deliver OTP verification codes, forgot password links, and critical booking status alerts.
* **Why Required**: Users do not stay logged in to the dashboard to monitor in-app messages; critical alerts must reach them on external channels.
* **Suggested Implementation Area**: Create `backend/app/utils/notifier.py` using packages like `fastapi-mail`.
* **Priority**: **Low**

---

## C. Existing Functionality That Is Working Correctly

No changes required for these functionalities. Do not modify or refactor the user login, provider service registries, booking status transitions, dashboard metric charts, password strength check utilities, or theme context switches.

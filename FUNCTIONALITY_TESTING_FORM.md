# 🧪 Early Autism Detector - Functionality Testing Form

**Project:** Early Autism Detection Application  
**Version:** Latest (July 2025)  
**Testing Date:** _______________  
**Tester Name:** _______________  
**Environment:** [ ] Development [ ] Staging [ ] Production  
**URL:** _______________

---

## 📋 Testing Instructions

1. **Fill out each test case** by performing the described function
2. **Record the actual outcome** in the "Actual Outcome" column
3. **Mark Pass/Fail** based on whether actual matches expected outcome
4. **Add notes** for any failures or unexpected behavior
5. **Test in order** as some tests depend on previous ones

---

## 🔐 Authentication & User Management

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 1 | Visit landing page (/) | Automatically redirects to /auth/login | | | |
| 2 | View role selection page | Shows "Public" and "Autism Center" options with descriptions | | | |
| 3 | Click "Public" role | Shows public user login form with back button | | | |
| 4 | Click "Autism Center" role | Shows center login form with back button | | | |
| 5 | Register new public user | Email verification sent, redirects to verification page | | | |
| 6 | Login with valid public credentials | Redirects to /dashboard with user session | | | |
| 7 | Login with invalid credentials | Shows error message, stays on login page | | | |
| 8 | Register new center user | Shows success page, center data saved to database | | | |
| 9 | Login with valid center credentials | Redirects to /center-portal/dashboard | | | |
| 10 | Logout from any account | Clears session, redirects to login page | | | |

---

## 👶 Child Profile Management

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 11 | Access dashboard without children | Shows "Add Your First Child" prompt | | | |
| 12 | Click "Add Child" button | Opens add child form with required fields | | | |
| 13 | Submit child form with valid data | Child created, appears in dashboard list | | | |
| 14 | Submit child form with missing name | Shows validation error, form not submitted | | | |
| 15 | View child profile card | Shows name, age, gender, and action buttons | | | |
| 16 | Edit existing child profile | Opens edit form with pre-filled data | | | |
| 17 | Update child information | Changes saved, updated info displayed | | | |
| 18 | Delete child profile | Shows confirmation dialog, deletes after confirm | | | |
| 19 | Cancel child deletion | Child remains, no data lost | | | |
| 20 | Create multiple children | All children appear in dashboard list | | | |

---

## 📋 M-CHAT-R Assessment

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 21 | Start assessment without selecting child | Shows child selection prompt | | | |
| 22 | Select child and start assessment | Shows first M-CHAT-R question (20 total) | | | |
| 23 | Answer questions with Yes/No | Progress bar updates, can navigate questions | | | |
| 24 | Try to submit incomplete assessment | Shows validation error, highlights missing questions | | | |
| 25 | Complete all 20 questions | Shows assessment results with score and risk level | | | |
| 26 | Score 0-2 points | Shows "Low Risk" with green indicator | | | |
| 27 | Score 3-7 points | Shows "Medium Risk" with yellow indicator | | | |
| 28 | Score 8-20 points | Shows "High Risk" with red indicator and center locator suggestion | | | |
| 29 | View assessment history | Shows list of past assessments with dates and scores | | | |
| 30 | Retake assessment for same child | Creates new assessment entry, keeps history | | | |

---

## 📊 Progress Tracking & History

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 31 | Access progress page | Shows timeline of assessments for selected child | | | |
| 32 | View progress chart | Displays score progression over time with visual chart | | | |
| 33 | Switch between children | Chart updates to show selected child's progress | | | |
| 34 | View assessment details | Shows individual assessment with all responses | | | |
| 35 | Export progress report | Generates downloadable report (if implemented) | | | |

---

## 🗺️ Autism Center Locator

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 36 | Access center locator | Shows interactive map with current location | | | |
| 37 | View nearby centers | Map displays center markers with different colors by type | | | |
| 38 | Filter by center type | Map updates to show only selected types | | | |
| 39 | Search by distance radius | Shows centers within specified radius | | | |
| 40 | Click center marker | Shows center details popup with contact info | | | |
| 41 | Save center to favorites | Center added to saved locations list | | | |
| 42 | Get directions to center | Opens navigation page with route displayed | | | |
| 43 | View center details | Shows comprehensive info (services, hours, contact) | | | |
| 44 | Access saved locations | Shows list of previously saved centers | | | |
| 45 | Remove saved location | Center removed from saved list | | | |

---

## 🤖 AI Chat Assistant

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 46 | Open chat interface | Shows chat window with welcome message | | | |
| 47 | Send autism-related question | AI responds with relevant, helpful information | | | |
| 48 | Ask about M-CHAT-R results | AI provides appropriate guidance based on risk level | | | |
| 49 | View chat history | Previous conversations are preserved and accessible | | | |
| 50 | Use suggested questions | Pre-written questions work and generate responses | | | |

---

## 🏥 Center Portal (for Autism Centers)

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 51 | Access center portal dashboard | Shows center management interface | | | |
| 52 | View center profile | Displays current center information | | | |
| 53 | Edit center information | Form pre-filled with current data | | | |
| 54 | Update center details | Changes saved and reflected in user locator | | | |
| 55 | Add/update coordinates | Map shows updated location | | | |
| 56 | Change center status | Active/inactive status updates in real-time | | | |
| 57 | View center analytics | Shows usage statistics and metrics | | | |

---

## 🔧 Admin Dashboard (admin/admin credentials)

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 58 | Login with admin credentials | Access to admin dashboard | | | |
| 59 | View user statistics | Shows total users, assessments, centers | | | |
| 60 | Manage autism centers | Can add, edit, delete centers | | | |
| 61 | View center registrations | Shows list of registered centers | | | |
| 62 | Approve/reject center applications | Status updates reflect in center portal | | | |
| 63 | View assessment analytics | Shows assessment completion rates and scores | | | |
| 64 | Manage user accounts | Can view and manage user profiles | | | |

---

## 🧭 Navigation & Routing

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 65 | Navigate between dashboard sections | Smooth transitions, correct page loads | | | |
| 66 | Use browser back/forward buttons | Navigation works correctly | | | |
| 67 | Direct URL access to protected pages | Redirects to login if not authenticated | | | |
| 68 | Access unauthorized admin pages | Shows 403/unauthorized error | | | |
| 69 | Mobile responsive navigation | Menu works on mobile devices | | | |

---

## 📱 Responsive Design & UI/UX

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 70 | Test on mobile device | All features work, layout adapts | | | |
| 71 | Test on tablet | Responsive design maintains usability | | | |
| 72 | Test on desktop | Full functionality, optimal layout | | | |
| 73 | Check loading states | Spinners/indicators show during operations | | | |
| 74 | Verify error handling | User-friendly error messages display | | | |
| 75 | Test form validations | Appropriate validation messages show | | | |

---

## 🔄 Real-time Features & Sync

| # | Function | Expected Outcome | Actual Outcome | Pass/Fail | Notes |
|---|----------|------------------|----------------|-----------|-------|
| 76 | Center updates sync to user locator | Changes appear without page refresh | | | |
| 77 | New center registrations appear | Centers visible in locator immediately | | | |
| 78 | Admin changes reflect in real-time | Updates sync across all interfaces | | | |
| 79 | Database consistency | All related tables stay synchronized | | | |
| 80 | Concurrent user testing | Multiple users can use system simultaneously | | | |

---

## 📊 Testing Summary

**Total Tests:** 80  
**Passed:** _____ / 80  
**Failed:** _____ / 80  
**Pass Rate:** _____%

### Critical Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Minor Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations:
1. ________________________________
2. ________________________________
3. ________________________________

---

## ✅ Sign-off

**Tester Signature:** _______________  
**Date:** _______________  
**Status:** [ ] Approved [ ] Needs Fixes [ ] Major Issues

**Notes:**
_________________________________
_________________________________
_________________________________

# Centa Returns: Digital Transformation Project

## **Executive Summary**

**Centa Returns** is a full-stack web platform developed in **Summer 2024** to **digitalize Centa Elevators’ return and defect management process**.

The system replaces the company’s previous **Excel-based tracking workflow** with a **centralized, role-based platform** that streamlines case handling from receipt to completion.

By introducing structured data entry, stage-based progress tracking, and analytics, **Centa Returns** has helped the company:

* Shorten repair and response cycles
* Increase visibility and accountability across departments
* Enhance data accuracy and reporting
* Improve overall customer satisfaction

Below is an example of the legacy Excel sheet previously used for managing returns:

<img width="800" height="321" alt="Legacy Excel Screenshot" src="https://github.com/user-attachments/assets/5d34a6af-774f-49b3-866e-6623bf801c46" />  

---

## 1. Background

Centa Elevators (Istanbul, Turkey) manufactures elevator components for 500+ clients across 38 countries.
Their old system for managing defective or returned products relied on Excel sheets and verbal communication leading to lost cases, no accountability, and frustrated customers.

I designed and built **Centa Returns** to bring structure, traceability, and automation to the process.

---

## 2. System Overview

The platform centralizes all return-related operations into five connected modules:

1. **User Management** – control access and assign roles
2. **Product Catalogue** – register products and defect types
3. **Customer Management** – store and manage customer records
4. **Returns Dashboard** – manage all return cases through five workflow stages
5. **Analytics & Reporting** – visualize trends and identify quality issues

Each page is fully integrated through a PostgreSQL database and secured with role-based permissions.

---

## 3. Key Pages

### 1. User Management

* Add and manage users with predefined roles:
  **Admin, Manager, Technician, Support, Sales, Logistics**
* Define permissions and access levels
* Ensure accountability through activity tracking

<img width="850" alt="Returns Dashboard" src="https://github.com/user-attachments/assets/acd4baf9-12d6-4df0-acd1-f82b22bf9be1" />

---

### 2. Product Catalogue

* Add and categorize elevator components
* Define models, part numbers, and defect types
* Standardizes reporting and enables product-level analysis
  
<img src="https://github.com/user-attachments/assets/28116522-58af-4d87-a88b-135f40303e6e" alt="Product Catalogue" width="75%" />

---

<img src="https://github.com/user-attachments/assets/c19b03cf-df66-479c-a0b6-b7a6d0507349" alt="Fault Types Catalogue" width="75%" />


---

### 3. Customer Management

* Register customers with contact details and region
* Link each return case to a specific customer
* Enables customer-specific performance tracking

<img width="850" alt="Customer Management" src="https://github.com/user-attachments/assets/2c6cbbd6-1244-42d4-8761-141813112aa3" />

---

### 4. Returns Dashboard (Core Module)

The heart of the platform where every case moves through a **five-stage workflow**. Each stage includes specific data fields and access permissions to ensure process discipline, accountability, and full auditability. 

#### 🛠️ Five Stages

1. **Teslim Alındı (Received)** – Support logs new cases
2. **Teknik İnceleme (Technical Review)** – Technicians record diagnostics and responsibility
3. **Ödeme Tahsilatı (Payment Collection)** – Sales tracks repair costs and payment status
4. **Kargoya Veriliyor (Shipping)** – Logistics records shipment details
5. **Tamamlandı (Completed)** – Managers finalize and notify customers


The dashboard table is horizontally scrollable. When a user clicks the ✏️ edit (pencil) button, a form appears with the fields required for that stage. Once the form is completed, the user confirms the stage using the ✅ completion button next to it.

<img width="850" alt="Returns Dashboard" src="https://github.com/user-attachments/assets/769603ff-2b19-4c9b-9655-780dcd992b51" />

Access to these forms is role-based. For example, technicians can only edit and complete the Technical Review stage. Other stages remain disabled for them, ensuring that only authorized roles can update or finalize certain steps. Below is an example of a form filled out by the technical team:

<img width="500" alt="Technical Form Example" src="https://github.com/user-attachments/assets/193882da-35c6-4e12-bb6b-d272597bffe0" />


These structured forms guarantee that the correct information is entered at each step. Once a stage is completed (under the “Received Actions” column), the row’s color automatically updates to match the next stage’s status, providing a clear visual cue of progress.


---

### 5. Analytics & Reporting

An interactive analytics page that transforms raw repair data into actionable insights.

Includes:

* Defect frequency & recurring issue analysis
* Product & model performance trends
* Warranty vs. customer fault breakdown
* Customer-specific return patterns
* Production batch issue tracking

Here are some example charts in the reporting page: 
<img width="711" height="696" alt="Screenshot 2025-10-08 at 1 07 22 AM" src="https://github.com/user-attachments/assets/9aac71b7-e292-432e-bc7b-cfa22e459f11" />
<img width="704" height="651" alt="Screenshot 2025-10-08 at 1 07 44 AM" src="https://github.com/user-attachments/assets/e504cdc9-8836-46b7-b50b-77ddc6703f23" />
<img width="706" height="567" alt="Screenshot 2025-10-08 at 1 08 06 AM" src="https://github.com/user-attachments/assets/015d88c4-38ea-43f4-8d9a-2c0014b62647" />

---

## 4. Technical Architecture

**Frontend:** React (Next.js)
**Backend:** Flask (Python) + SQLAlchemy
**Database:** PostgreSQL
**Integrations:** ReSend API for automated email notifications

**Core Features:**

* RESTful API architecture
* Role-based access control
* Audit logging
* Data validation and state machine for workflow control
* Optimized database queries for analytics

---

## **5. Impact**

✅ **Replaced** Excel-based chaos with a structured digital system
✅ **Increased** accountability across departments
✅ **Enabled** real-time visibility and analytics
✅ **Reduced** repair cycle times
✅ **Improved** customer communication and satisfaction

---

## 6. Lessons Learned

This project taught me that **true digital transformation starts with understanding the users**.
By observing Centa’s engineers and technicians in their real workflows, I designed software that felt intuitive and immediately useful — not just functional.

---

## 7. Possible Future Enhancements

* **Integration with ERP system**
* Customer self-service portal for return tracking
* Mobile app for field technicians
* Predictive defect analytics using ML

---

## Technical Summary

**Skills Applied:**
React, Next.js, Flask, Python, PostgreSQL, SQLAlchemy, ReSend API
**Domains:** Workflow automation, analytics, user management, UX design
**Duration:** Summer 2024
**Company:** Centa Elevators (Istanbul, Turkey)

Here is the link to the platform:  https://centa-returns-frontend-production.up.railway.app/login -- new link: https://ariza.centa.com.tr/login (only compatible with chrome, safari integration coming soon!)

---



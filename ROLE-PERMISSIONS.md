# Role Permissions Guide

## Overview
This document outlines the permissions and capabilities for each user role in the Navon Technologies portal.

---

## 🌟 SuperAdmin

### User Management
- ✅ Create new user accounts
- ✅ Modify any user account (including Admins and HR)
- ✅ Delete any user account (including Admins and HR)
- ✅ Assign and change any user's role
- ✅ Promote Employees to HR or Admin
- ✅ Demote Admins and HR to Employee
- ✅ Full audit logs of all user activity

### Directory Access
- ✅ View all employee information
- ✅ View salary information
- ✅ Edit any employee profile
- ✅ Delete any employee profile
- ✅ Export full directory with salaries

### Document Management
- ✅ Upload documents
- ✅ Delete documents
- ✅ Access Resume Hub
- ✅ Manage resumes

### Special Features
- ✅ User Management page (exclusive to SuperAdmin)
- ✅ Gold-themed UI elements with stars (⭐)

---

## 🔧 Admin

### User Management
- ❌ Cannot create users
- ❌ Cannot modify users
- ❌ Cannot delete users
- ❌ Cannot change user roles
- ✅ Can VIEW HR accounts (read-only)
- ❌ Cannot edit or delete HR accounts

### Directory Access
- ✅ View all employee information
- ❌ CANNOT view salary information (HR/SuperAdmin only)
- ✅ Edit employee profiles (except HR profiles)
- ✅ Delete employee profiles (except HR profiles)
- ✅ Export directory WITHOUT salaries

### Document Management
- ✅ Upload documents
- ✅ Delete documents
- ✅ Access Resume Hub
- ✅ Manage resumes

### UI Branding
- ✅ Gold-themed role displays with stars (⭐)

---

## 👥 HR Manager

### User Management
- ✅ Create new user accounts
- ✅ Modify user accounts (except SuperAdmin)
- ✅ Delete user accounts (except SuperAdmin)
- ✅ Change user roles (Employee/HR/Admin)
- ✅ Promote Employees to HR or Admin
- ✅ Demote Admins and HR to Employee
- ❌ CANNOT add or delete SuperAdmin accounts
- ✅ Full audit logs of all user activity

### Directory Access
- ✅ View all employee information
- ✅ View salary information
- ✅ Edit employee profiles
- ✅ Delete employee profiles
- ✅ Export full directory with salaries

### Document Management
- ✅ Upload documents
- ✅ Delete documents
- ✅ Access Resume Hub
- ✅ Manage resumes

### UI Branding
- ✅ Gold-themed role displays with stars (⭐)
- ✅ Access to User Management page

---

## 👤 Employee

### User Management
- ❌ No user management access

### Directory Access
- ✅ View Name, Title, Email only
- ❌ Cannot view phone, location, salary, or other details
- ✅ Edit own profile only
- ❌ Cannot delete profiles
- ✅ Export limited directory (Name, Title, Email)

### Document Management
- ✅ View documents
- ❌ Cannot upload documents
- ❌ Cannot delete documents
- ❌ Cannot access Resume Hub

---

## Key Differences

### Salary Visibility
- **SuperAdmin**: ✅ Can see salaries
- **HR Manager**: ✅ Can see salaries
- **Admin**: ❌ CANNOT see salaries
- **Employee**: ❌ CANNOT see salaries

### HR Account Management
- **SuperAdmin**: ✅ Can edit and delete HR accounts
- **Admin**: ✅ Can VIEW HR accounts (read-only), ❌ Cannot edit or delete
- **HR Manager**: ❌ Cannot manage other HR accounts
- **Employee**: ❌ No access

### User Management
- **SuperAdmin**: ✅ Full user management including SuperAdmin accounts
- **HR Manager**: ✅ Full user management EXCEPT SuperAdmin accounts
- **Admin**: ❌ No user management capabilities
- **Employee**: ❌ No user management capabilities

### UI Branding
- **SuperAdmin**: ✅ Gold theme with stars (⭐)
- **HR Manager**: ✅ Gold theme with stars (⭐)
- **Admin**: ✅ Gold theme with stars (⭐)
- **Employee**: ❌ Standard blue theme

---

## Implementation Notes

### Team Directory
- Salary field only displays when `userRole === 'hr' || userRole === 'superadmin'`
- Admin users see all other fields but salary is hidden

### Excel Export
- HR/SuperAdmin: Exports with salary column
- Admin: Exports without salary column
- Employee: Exports only Name, Title, Email

### User Management Page
- Only accessible to SuperAdmin (`userRole === 'superadmin'`)
- Card only appears on Secure Portal for SuperAdmin
- Page has role check to prevent direct URL access

---

Last Updated: Current Session

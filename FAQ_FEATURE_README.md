# FAQ Feature Documentation

## Overview
A user-driven FAQ (Fr- **Features:**
  - View-only interface for all users
  - Search functionality across problems, SR-IDs, tags, and solver names
  - **Refresh button** to manually fetch new FAQs
  - Card-based layout showing:
    - SR-ID badge
    - Problem description
    - Solution file info (name, size, type)
    - Download button for solution files
    - Solver information
    - Department
    - Date created
    - Tags
  - Responsive design
  - Real-time updates when new FAQs are created
  - Statistics showing total FAQs countked Questions) system has been integrated into the KRA & KPI Dashboard application. This feature allows users to automatically create FAQ entries when completing tasks with SR-IDs, storing problem descriptions and solution files for future reference.

## Features Added

### Backend (Node.js/Express)

#### 1. FAQ Model (`Backend/models/FAQ.js`)
- **Fields:**
  - `problem`: Problem description/question (required)
  - `srId`: Service Request ID from the task (required)
  - `task`: Reference to the DailyTask (required)
  - `solutionFile`: Object containing file details
    - `filename`: Stored filename
    - `originalName`: Original uploaded filename
    - `path`: File path on server
    - `mimetype`: File MIME type
    - `size`: File size in bytes
    - `uploadedAt`: Upload timestamp
  - `solvedBy`: Reference to the user who solved the problem (required)
  - `department`: Reference to the department
  - `tags`: Array of tags for searching
  - `isActive`: Boolean to show/hide FAQs
  - Timestamps: `createdAt` and `updatedAt`

#### 2. FAQ Controller (`Backend/controllers/faqController.js`)
- **Endpoints:**
  - `GET /api/faqs` - Get all FAQs (with optional filtering by SR-ID and search)
  - `GET /api/faqs/public` - Get only active FAQs (for public viewing)
  - `GET /api/faqs/stats` - Get FAQ statistics by department
  - `GET /api/faqs/:id` - Get a specific FAQ by ID
  - `GET /api/faqs/:id/download` - Download the solution file
  - `POST /api/faqs` - Create a new FAQ when completing a task (with file upload)
  - `PATCH /api/faqs/:id/toggle` - Toggle FAQ active status (admin only)

#### 3. FAQ Routes (`Backend/routes/faqRoutes.js`)
- **File Upload Support**: Integrated Multer middleware for handling file uploads
- **Allowed File Types**: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF
- **File Size Limit**: 10MB maximum
- **Storage**: Files stored in `Backend/uploads/faqs/` directory
- Public routes accessible without authentication
- Protected routes requiring authentication for viewing and creating
- Admin-only routes for toggling FAQ status

#### 4. Integration (`Backend/index.js`)
- FAQ routes integrated into the main Express application at `/api/faqs`

### Frontend (Next.js/React/TypeScript)

#### 1. Complete Task Modal (`Frontend/components/modals/CompleteTaskModal.tsx`)
- **Features:**
  - Triggered when completing tasks with SR-ID
  - Form fields:
    - **Problem Description** (required) - Pre-filled with task description
    - **Solution File** (required) - File upload with drag-and-drop
    - **Tags** (optional) - Comma-separated tags for better searchability
  - File validation:
    - Accepts: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF
    - Maximum size: 10MB
    - Shows file preview with size
  - Automatically completes task and creates FAQ entry
  - Success/error toast notifications

#### 2. FAQ Viewer Page (`Frontend/components/dashboard/FAQViewerPage.tsx`)
- **Features:**
  - Public-facing FAQ viewer for all users
  - Beautiful, user-friendly interface with help icon
  - Search functionality
  - Category filtering
  - Accordion-style expandable FAQ items
  - Grouped by category when viewing "All Categories"
  - Category badges with color coding
  - Question count per category
  - Responsive design

#### 3. My Tasks Dashboard Integration (`Frontend/components/dashboard/MyTasksDashboard.tsx`)
- **Modified:**
  - Complete button now checks if task has SR-ID
  - Tasks with SR-ID show "Complete & Save Solution" button
  - Opens CompleteTaskModal instead of directly completing
  - Tasks without SR-ID complete normally without FAQ creation
  - Auto-refresh task list after FAQ creation

#### 4. Sidebar Integration (`Frontend/components/sidebar/Sidebar.tsx`)
- **Added:**
  - "FAQs" menu item for all users to view FAQs
  - HelpCircle icon for FAQ section
  - Navigation handler to FAQ viewer page
  - **Removed**: FAQ Management (no longer needed)

#### 5. Main Dashboard Integration (`Frontend/components/creative.tsx`)
- **Added:**
  - Imported FAQViewerPage component
  - Added "faqs" tab content for viewing solutions
  - Integrated with existing Toaster component

## Usage

### For Users - Creating FAQs

1. **Create or work on a task with an SR-ID**
   - When creating a daily task, fill in the SR-ID field
   - Complete the task as normal

2. **Complete task with solution**
   - Click the "Complete & Save Solution" button on tasks with SR-ID
   - A modal will open automatically

3. **Fill in the solution form:**
   - **Problem Description**: Describe what issue was resolved (auto-filled with task description)
   - **Solution File**: Upload a PDF, document, or image showing the solution
   - **Tags**: Add searchable tags (optional)
   - Click "Complete Task & Save Solution"

4. **Task Completion:**
   - Task status changes to "Closed"
   - FAQ entry is automatically created
   - Solution is now searchable by all users

### For All Users - Viewing FAQs

1. Click on "FAQs" in the sidebar
2. Browse all available solutions
3. Use the search box to find specific issues by:
   - Problem description
   - SR-ID
   - Tags
   - Solver name
4. Click "Refresh" button to fetch newly added FAQs
5. Click "Download" button to download solution files
6. View metadata: who solved it, department, and date

### For Administrators

1. **Toggle FAQ Visibility:**
   - Use API endpoint to activate/deactivate FAQs
   - Inactive FAQs are hidden from regular users
   
2. **View Statistics:**
   - Access FAQ stats by department
   - Monitor FAQ creation trends

## API Endpoints

### Public Endpoints
```
GET /api/faqs/public
Returns: All active FAQs with solution file info
```

### Protected Endpoints (Requires Authentication)
```
GET    /api/faqs
Query params: ?srId=SR-123&search=network
Returns: Filtered FAQs based on query

GET    /api/faqs/stats
Returns: FAQ statistics by department

GET    /api/faqs/:id
Returns: Detailed FAQ information

GET    /api/faqs/:id/download
Returns: Solution file download (binary)

POST   /api/faqs
Body: FormData with taskId, problem, srId, solutionFile, tags
Returns: Created FAQ entry and marks task as completed
```

### Admin Only Endpoints
```
PATCH  /api/faqs/:id/toggle
Toggles FAQ active/inactive status
```

## File Upload Specifications

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, JPEG, PNG, GIF

### File Size Limits
- Maximum file size: 10MB
- Files are stored in `Backend/uploads/faqs/` directory
- Filename format: `faq-{timestamp}-{random}.{extension}`

### File Storage
- Files are stored on the server file system
- File metadata stored in MongoDB
- Download endpoint serves files with original filename

## Sorting & Display
FAQs are sorted by:
1. Creation date (descending) - newest FAQs appear first
2. Can be filtered by search query across multiple fields

## Technical Notes

### Database
- MongoDB collection: `faqs`
- Indexes: `category + order`, `isActive`

### Authentication
- Public viewing: No authentication required (only active FAQs)
- Admin management: Requires admin or superadmin role

### Toast Notifications
- Success messages for create/update/delete operations
- Error messages for failed operations
- Uses sonner library for beautiful toast notifications

## Future Enhancements (Optional)
- [ ] FAQ search result highlighting
- [ ] FAQ analytics (view counts, download counts)
- [ ] Multiple file attachments per FAQ
- [ ] FAQ voting system (helpful/not helpful)
- [ ] FAQ comments and discussions
- [ ] Bulk FAQ operations
- [ ] FAQ export functionality
- [ ] Video solution support
- [ ] FAQ categories/folders
- [ ] Advanced search filters (by date range, department, etc.)

## Files Created/Modified

### Backend
- ✅ `Backend/models/FAQ.js` (modified - file-based FAQ model)
- ✅ `Backend/controllers/faqController.js` (modified - file upload support)
- ✅ `Backend/routes/faqRoutes.js` (modified - multer integration)
- ✅ `Backend/index.js` (no changes needed)
- ✅ `Backend/package.json` (added multer dependency)
- ✅ `Backend/uploads/faqs/` (directory created for file storage)

### Frontend
- ✅ `Frontend/components/modals/CompleteTaskModal.tsx` (created - task completion with solution upload)
- ✅ `Frontend/components/dashboard/FAQViewerPage.tsx` (created - FAQ viewer with refresh)
- ✅ `Frontend/components/dashboard/MyTasksDashboard.tsx` (modified - integrated CompleteTaskModal)
- ✅ `Frontend/components/sidebar/Sidebar.tsx` (modified - updated FAQ navigation)
- ✅ `Frontend/components/creative.tsx` (modified - integrated FAQViewerPage)
- ✅ `Frontend/lib/api.ts` (enhanced - proper Error objects with response data)
- ❌ `Frontend/components/management/FAQManagement.tsx` (removed - not needed)
- ❌ `Frontend/components/modals/FAQModal.tsx` (removed - not needed)
- ❌ `Frontend/components/dashboard/FAQPage.tsx` (removed - replaced with FAQViewerPage)

## Testing Checklist

### Creating FAQs
- [ ] Create a task with SR-ID
- [ ] Complete task without SR-ID (should work normally)
- [ ] Complete task with SR-ID (should open solution modal)
- [ ] Upload PDF solution file
- [ ] Upload image solution file
- [ ] Try uploading file >10MB (should fail)
- [ ] Try uploading unsupported file type (should fail)
- [ ] Add tags to FAQ
- [ ] Verify task status changes to "closed"

### Viewing FAQs
- [ ] View all FAQs in FAQ section
- [ ] Search by problem description
- [ ] Search by SR-ID
- [ ] Search by tags
- [ ] Search by solver name
- [ ] Click refresh button
- [ ] Download solution file
- [ ] Verify file downloads with correct name
- [ ] View FAQ metadata (solver, department, date)

### Integration
- [ ] Verify FAQs appear immediately after creation
- [ ] Verify task list refreshes after FAQ creation
- [ ] Test with multiple concurrent users
- [ ] Test with different file types
- [ ] Verify inactive FAQs are hidden from regular users

## Dependencies

### Backend
- **multer** (^1.4.5-lts.1) - File upload middleware for handling multipart/form-data
- Existing dependencies remain unchanged

### Frontend
- No new dependencies added
- Uses existing libraries:
  - sonner (toast notifications)
  - lucide-react (icons)
  - shadcn/ui components
  - fetch API for HTTP requests and file uploads

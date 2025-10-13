# Design Guidelines: Assistant Administratif Intelligent pour PME

## Design Approach

**Selected Approach:** Design System - Linear + Material Design Hybrid

**Justification:** This is a productivity-focused, information-dense business application requiring efficiency, clarity, and professional aesthetics. We'll draw inspiration from:
- **Linear**: Modern, clean interface with excellent typography and subtle interactions
- **Material Design**: Robust component system for data-heavy displays
- **Notion**: Dashboard organization and information hierarchy

**Key Principles:**
1. Clarity over decoration - every element serves a purpose
2. Scannable information architecture for busy managers
3. Consistent, predictable patterns for multi-user efficiency
4. Professional B2B aesthetic that inspires trust

## Color Palette

### Light Mode
- **Background Primary:** 0 0% 100% (white)
- **Background Secondary:** 220 14% 96% (light gray for cards/sections)
- **Background Tertiary:** 220 13% 91% (subtle contrast for nested elements)
- **Primary Brand:** 217 91% 60% (professional blue for actions, links)
- **Primary Hover:** 217 91% 54% (darker blue)
- **Success:** 142 71% 45% (green for paid invoices, completed tasks)
- **Warning:** 38 92% 50% (amber for pending items, 48h alerts)
- **Danger:** 0 84% 60% (red for overdue, urgent alerts)
- **Text Primary:** 222 47% 11% (near black for main content)
- **Text Secondary:** 215 16% 47% (muted for labels, metadata)
- **Text Tertiary:** 216 12% 64% (lightest for subtle info)
- **Border:** 214 32% 91% (subtle borders)

### Dark Mode
- **Background Primary:** 222 47% 11% (deep dark blue-gray)
- **Background Secondary:** 217 33% 17% (card backgrounds)
- **Background Tertiary:** 215 28% 23% (nested sections)
- **Primary Brand:** 217 91% 60% (same blue, works in dark)
- **Primary Hover:** 217 91% 66% (lighter in dark mode)
- **Success:** 142 71% 45%
- **Warning:** 38 92% 50%
- **Danger:** 0 84% 60%
- **Text Primary:** 210 40% 98% (near white)
- **Text Secondary:** 217 19% 68% (muted)
- **Text Tertiary:** 215 14% 52% (subtle)
- **Border:** 215 28% 23%

## Typography

**Font Families:**
- Primary: 'Inter', system-ui, -apple-system, sans-serif (excellent for UI, highly readable)
- Monospace: 'JetBrains Mono', monospace (for email addresses, amounts, dates)

**Scale & Usage:**
- **Hero/Dashboard Headers:** text-3xl font-semibold (30px, 600 weight)
- **Section Headers:** text-xl font-semibold (20px, 600 weight)
- **Card Titles:** text-base font-semibold (16px, 600 weight)
- **Body Text:** text-sm font-normal (14px, 400 weight)
- **Labels/Metadata:** text-xs font-medium (12px, 500 weight)
- **Table Headers:** text-xs font-semibold uppercase tracking-wider (12px, 600 weight)
- **Small Print:** text-xs font-normal (12px, 400 weight)

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 3, 4, 6, 8, 12, 16** for consistent rhythm
- Gap between cards: gap-4
- Section padding: p-6 to p-8
- Component internal spacing: p-3 to p-4
- Icon-text spacing: gap-2
- Large section breaks: mb-12 or mb-16

**Container Strategy:**
- Max width for app: max-w-screen-2xl mx-auto
- Sidebar: fixed w-64 (256px)
- Main content area: Fluid with px-6 to px-8
- Cards: Full width within grid containers
- Modals/Forms: max-w-2xl

**Grid Patterns:**
- Dashboard cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
- Email/Document lists: Single column with full-width rows
- Calendar: Custom grid with 7 columns for days

## Component Library

### Navigation
- **Sidebar:** Fixed left, dark background in both modes, icon + text navigation items, collapsible groups for Emails/Documents/Calendar
- **Top Bar:** Sticky, contains search, notifications bell, user avatar with dropdown
- **Breadcrumbs:** For deep navigation (Configuration > Tags > Edit)

### Dashboard Components
- **Alert Cards:** Elevated cards with colored left border (red for urgent, amber for pending), icon, count, and action button
- **Stat Cards:** Clean rectangles with large numbers, labels, and trend indicators (up/down arrows)
- **Quick Actions:** Compact button groups for common tasks

### Data Display
- **Email List:** Table-like rows with sender avatar, subject (bold), preview (muted), tags (colored badges), timestamp, action menu
- **Document Grid:** Cards with file icon, filename, type badge, date, preview on hover
- **Calendar View:** Weekly/monthly grid with color-coded appointment blocks containing time, client name, tags

### Forms & Inputs
- **Text Fields:** Clean with subtle borders, focus ring in primary blue, helper text below
- **Dropdowns:** Custom styled with chevron, smooth open/close
- **Multi-select Tags:** Pill-shaped badges with remove X, new tag input inline
- **Toggle Switches:** iOS-style for enable/disable features
- **Date/Time Pickers:** Custom calendar overlay for scheduling

### Feedback Elements
- **Badges:** Rounded-full px-2 py-0.5 with semantic colors for status (Paid, Pending, Overdue)
- **Tags:** Rounded-md px-2 py-1 with pastel backgrounds for categories (Client, Fournisseur, Devis)
- **Alerts/Toasts:** Top-right notifications with icon, message, dismiss button, auto-hide
- **Loading States:** Subtle skeleton screens and spinner overlays

### Modals & Overlays
- **Configuration Modal:** Full-screen drawer from right for settings
- **Email Detail:** Side panel overlay showing full email content, AI analysis, suggested actions
- **Confirmation Dialogs:** Centered modal with clear action buttons

### Buttons
- **Primary:** Solid primary blue background, white text, medium rounded
- **Secondary:** Outline with primary border, primary text
- **Ghost:** No border, text only for tertiary actions
- **Danger:** Red for delete/critical actions
- Sizes: Small (px-3 py-1.5 text-sm), Medium (px-4 py-2 text-base), Large (px-6 py-3 text-lg)

## Specific Screen Designs

### Dashboard
- Full-width header with greeting and date
- Grid of 4 alert cards at top (Devis sans réponse, Factures impayées, RDV aujourd'hui, Emails non traités)
- Below: 2-column layout with monthly stats (left) and recent activity feed (right)
- All cards with subtle shadows, hover lift effect

### Email Management
- Left: Folder tree (Inbox, Sent, Drafts, with smart folders for Invoices, Quotes)
- Center: Email list with filters bar above (type, status, assigned user)
- Right: Detail panel showing selected email, AI-generated summary at top, suggested response below

### Calendar
- Weekly view as default, month/day toggle
- Color-coded by appointment type
- Hover shows quick preview, click opens detail sidebar
- AI suggestions panel at bottom for preparation tasks

### Documents
- Toggle between list and grid view
- Advanced filters: type, date range, client/supplier, tag
- Bulk actions toolbar appears on selection
- Preview overlay on hover (thumbnails for PDFs/images)

### Configuration
- Tabbed interface: Mail Accounts, Tags, Automation Rules, User Roles, Preferences
- Two-column layout for forms with labels left-aligned
- Live preview of settings where applicable

## Images
**No hero images** - This is a utility application, not a marketing site. Focus on functional UI throughout.

## Animations
**Minimal and purposeful:**
- Card hover: subtle lift with shadow (translate-y-1)
- Button press: slight scale (scale-95)
- Modal/panel entry: slide from right (300ms ease-out)
- Loading states: subtle pulse on skeletons
- Alert appearance: fade + slide down from top
- NO decorative animations, parallax, or scroll effects
# Task 6-9: Add Export/Print functionality and Dynamic Notifications

## Agent: full-stack-developer

## Work Completed

### 1. Export Utility (`/src/lib/export-utils.ts`)
- Created `exportToCSV(filename, data, headers?)` - Converts array of objects to CSV with:
  - Proper escaping for quotes, commas, newlines
  - BOM prefix (\uFEFF) for Excel UTF-8 compatibility
  - Spanish accent/character support
  - Automatic download trigger
- Created `printTable(title, columns, data)` - Opens print dialog with:
  - NavTrack Pro branded header with anchor icon
  - Export date/time in Spanish locale
  - Landscape page orientation
  - Proper CSS for page breaks and print media
  - Styled table with alternating rows

### 2. Export Buttons Added to 5 Components
- **shipments.tsx**: Replaced inline `exportCSV` with utility-based `handleExportCSV` + `handlePrint`
- **containers.tsx**: Added Download/Printer buttons in filter bar
- **documents.tsx**: Added Download/Printer buttons in filter bar
- **crew.tsx**: Added Download/Printer buttons in stats bar
- **claims.tsx**: Added Download/Printer buttons in stats bar

Each uses `size="sm"` buttons with Download and Printer icons from lucide-react, matching the existing teal-themed UI style.

### 3. Notifications API (`/src/app/api/notifications/route.ts`)
- GET endpoint querying 8 data sources from the database:
  1. Permits expiring within 30 days (warning)
  2. Expired permits (error)
  3. Shipments with "Con retraso" status (error)
  4. Documents pending verification (info)
  5. Crew with licenses expiring within 30 days (warning)
  6. Crew with expired licenses (error)
  7. Open/under-investigation claims (error/warning)
  8. Recently delivered shipments (success)
- Each notification: id, title, description, relative time, type, relatedTab
- Sorted by priority: error > warning > info > success

### 4. Enhanced Header Notifications (`/src/components/layout/header.tsx`)
- Replaced static 3-item notification array with dynamic API-fetched data
- Auto-refresh every 60 seconds
- Dynamic unread count badge with "9+" overflow
- "Marcar todas como leídas" button
- Per-notification mark-as-read on click
- Click navigates to related tab via `setActiveTab()`
- Grouped display with section headers: Urgente, Advertencias, Informativas, Exitosas
- Type-specific icons (AlertCircle, AlertTriangle, Info, CheckCircle)
- Colored left border per type
- Animated unread indicator dot
- Empty state UI
- ScrollArea for overflow
- Footer link to calendar tab

### Lint Status
- All files pass `bun run lint` with 0 errors

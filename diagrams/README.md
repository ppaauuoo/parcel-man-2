# iCondo - Mermaid Diagrams

This directory contains comprehensive Mermaid diagrams for the iCondo Parcel Management System.

## Diagram Files

1. **[system-architecture.md](./system-architecture.md)**
   - Full system architecture overview
   - Frontend, backend, and database layers
   - Tech stack visualization
   - Component organization

2. **[data-flow.md](./data-flow.md)**
   - Authentication flow
   - Parcel reception workflow
   - Parcel collection workflow
   - Photo upload process
   - Error handling flow

3. **[database-schema.md](./database-schema.md)**
   - Entity-relationship diagram
   - Table definitions
   - Foreign key relationships
   - Indexes and constraints
   - Sample data structures

4. **[component-hierarchy.md](./component-hierarchy.md)**
   - React component tree
   - Props interfaces
   - State management patterns
   - Routing structure
   - Shared components

5. **[api-endpoints.md](./api-endpoints.md)**
   - Complete API documentation
   - Request/response formats
   - Authentication flow
   - Error handling
   - All endpoints documented

## How to View

### Option 1: Mermaid Live Editor
1. Visit [mermaid.live](https://mermaid.live)
2. Copy the Mermaid code blocks from any .md file
3. Paste into the editor
4. View rendered diagram

### Option 2: VS Code
1. Install [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension
2. Open any .md file
3. Click "Preview" or press `Ctrl+Shift+V`
4. Diagrams render automatically

### Option 3: GitHub/GitLab
1. Push this directory to your repository
2. GitHub and GitLab natively render Mermaid diagrams
3. View directly in the web interface

### Option 4: IntelliJ IDEA
1. Install [Mermaid plugin](https://plugins.jetbrains.com/plugin/15046-mermaid)
2. Open .md files
3. Diagrams render in the preview panel

## Tech Stack Visualized

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router
- Axios
- qrcode.react
- html5-qrcode

### Backend
- Express + TypeScript
- SQLite
- JWT authentication
- bcrypt
- Multer (file uploads)
- qrcode library

## Key Features Documented

- **User Roles**: Staff and Resident authentication
- **Parcel Lifecycle**: Reception → Pending → Collection
- **QR Code System**: Generation and scanning
- **Photo Management**: Capture, upload, storage
- **History Tracking**: Complete audit trail
- **Real-time Updates**: Status changes and notifications

## System Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│    Backend      │─────▶│    Database     │
│  React + Vite   │      │   Express       │      │    SQLite       │
│   Port 5173     │      │   Port 3000     │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Usage Examples

### Adding New Features
When adding features to iCondo:
1. Update relevant diagrams in this directory
2. Keep component hierarchy in sync with code
3. Document new API endpoints
4. Update data flow diagrams
5. Maintain ER diagram for database changes

### Onboarding Developers
Share these diagrams with new developers:
1. Start with `system-architecture.md` for big picture
2. Review `data-flow.md` to understand workflows
3. Study `component-hierarchy.md` for frontend structure
4. Reference `api-endpoints.md` for integration
5. Check `database-schema.md` for data model

## Contributing

When modifying the system:
1. Update corresponding diagrams
2. Ensure Mermaid syntax is valid
3. Test rendering in multiple viewers
4. Keep diagrams in sync with code
5. Maintain consistent styling

## Resources

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## License

These diagrams are part of the iCondo project and follow the same license.

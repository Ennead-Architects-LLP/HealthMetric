# HealthMetric Dashboard - Detailed QA Document

## 🎯 Project Overview

Interactive dashboard website for visualizing architectural project data with time-series tracking capabilities.

## 📊 Data Structure Analysis

Based on the sample data file, each project contains:

- **Job Metadata**: hub_name, project_name, model_name, timestamp, execution_time
- **Result Data**: Various metrics like total_elements, total_views, dimensions, materials, etc.
- **Status**: completion status

## ❓ Clarification Questions

### 1. Landing Page (Hero Section)

**Q1.1**: What specific high-level metrics should be displayed on the hero page?

- Total number of projects? yes
- Total execution time across all projects? no
- Number of unique hubs/companies? no
- Total elements across all projects? some big big numbers

**Q1.2**: For the "flying file names" animation:

- Should file names be actual project names from the data? make a flying item class: Porject-Model
- How many file names should be visible at once? 30 max
- Should they follow mouse movement or move randomly? when mouse is not moving it is float randomly, but when mouse is moving it is attracted to it
- Any specific animation style preferences (fade, bounce, float)? ghsot hovering

**Q1.3**: What should the "Enter Dashboard" button look like?

- Any specific styling requirements? large text
- Should it have hover effects or animations? yes aniimate, it should wipe across screen like a retro video game to fade in the dahs board

### 2. Dashboard Functionality

**Q2.1**: Search capabilities - what should users be able to search by?

- Project name? yes
- Hub/company name? yes
- Model name? yes
- Date range? yes
- Specific metrics (e.g., projects with >1000 elements)?

  do have filter by hub on the side

**Q2.2**: Data visualization - which metrics are most important to track over time?

- Total elements per project? yes
- Execution time trends? no
- Warning counts? yes
- View counts? yes
- Material counts? no
- warning oer user?

**Q2.3**: Time series visualization:

- What time periods should be supported (daily, weekly, monthly)? weekly
- Should we show individual project trends or aggregated trends? whe user search and pick a project we should the aggreate tresd of all model in that project, when we search pick modal then we show agreated result of that modal
- Any specific chart types preferred (line, bar, area)? trend line chart line stock market maybeee

### 3. Data Management

**Q3.1**: How will new data be added to the system?

- Manual file upload?
- Automatic directory scanning?
- API endpoint for data ingestion?

    to be determined later

**Q3.2**: Data organization:

- Should projects be grouped by hub/company? we should be able to see data combined by hub, by prohject, by model.. See Q2.3
- How should we handle multiple models from the same project? see above
- Any data validation requirements? to be determined

**Q3.3**: Performance considerations:

- Expected number of data files? 120 indivudal json per week. You can recomaned a github action to merge scattered data into a combine data weekly for better loading performance?
- Any data retention policies? no
- Real-time updates or batch processing? you decide

### 4. User Experience

**Q4.1**: Navigation structure:

- Should there be a navigation menu? yes, in dahsboard page, have side bar
- Any specific pages needed (About, Help, Settings)? no
- Mobile responsiveness requirements? prefer desktop webspage but need to be mobile friendly

**Q4.2**: Interactive features:

- Should users be able to filter data by date ranges? yes
- Any export functionality needed (CSV, PDF)? not yet
- Print-friendly views? not yet

**Q4.3**: Visual design:

- Any specific color scheme preferences? dark theme prminal minimalism
- Company branding requirements? Ennead Architect, powered by EnneadTab
- Accessibility requirements (WCAG compliance)? no

### 5. Technical Requirements

**Q5.1**: Browser support:

- Which browsers need to be supported? major
- Any specific version requirements?

**Q5.2**: Performance:

- Any specific loading time requirements? distract user by heor page, so get more loading time for the dah board
- Expected concurrent users? <10

**Q5.3**: Data security:

- Any authentication requirements? not yet
- Data privacy considerations? not yet
- Backup and recovery needs? not yet

## 🎨 Proposed Features

### Landing Page Features:

1. **Hero Section**: Animated background with floating project names: slide show dark of Ennead Architects projects, you can serach online for some placeholder images and later wew ill update
2. **Key Metrics Display**: High-level statistics cards
3. **Interactive Elements**: Mouse-following animations
4. **Call-to-Action**: Prominent dashboard entry button

### Dashboard Features:

1. **Search & Filter**: Multi-criteria search functionality
2. **Data Tables**: Sortable, filterable data grids
3. **Time Series Charts**: Interactive trend visualizations
4. **Project Comparison**: Side-by-side metric comparisons
5. **Export Options**: Data download capabilities

### Technical Implementation:

1. **Responsive Design**: desktop first, Mobile-second approach
2. **Performance Optimization**: Lazy loading, efficient rendering
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Modern UI**: Clean, professional interface

## 📋 Implementation Plan

### Phase 1: Foundation & Hero Page
1. **Setup Modular Structure** ✅
   - Create directory structure
   - Setup base CSS with dark theme and typography
   - Initialize JavaScript modules

2. **Hero Page Development**
   - Create `templates/hero.html` with Ennead Architects slideshow
   - Implement `js/components/HeroAnimations.js` for flying file names
   - Add mouse tracking and ghost hovering effects
   - Create metric cards showing total projects and big numbers
   - Add retro video game transition to dashboard

3. **CSS Components**
   - `styles/components/hero.css` - Hero page styling
   - `styles/animations.css` - Flying animations and transitions
   - Responsive design for desktop-first approach

### Phase 2: Dashboard Core
4. **Dashboard Template**
   - Create `templates/dashboard.html` with sidebar navigation
   - Implement hub filtering sidebar
   - Add search functionality (project, hub, model, date range)

5. **Data Management**
   - `js/data/parser.js` - Parse SexyDuck JSON files
   - `js/data/aggregator.js` - Combine data by hub/project/model
   - `js/data/storage.js` - Local storage and caching

6. **Dashboard Components**
   - `js/components/Dashboard.js` - Main dashboard logic
   - `js/components/DataTable.js` - Sortable, filterable data grid
   - `styles/components/dashboard.css` - Dashboard styling

### Phase 3: Visualizations
7. **Charts & Time Series**
   - `js/components/Charts.js` - Chart.js integration
   - Weekly time series with stock market-style line charts
   - Project vs Model aggregation logic
   - `styles/components/charts.css` - Chart styling

8. **Interactive Features**
   - Real-time filtering and search
   - Smooth transitions between views
   - Performance optimization for 120+ JSON files

### Phase 4: Polish & Optimization
9. **Performance & UX**
   - Lazy loading implementation
   - GitHub Action for weekly data aggregation
   - Mobile responsiveness
   - Error handling and loading states

10. **Testing & Deployment**
    - Cross-browser testing
    - Performance optimization
    - GitHub Pages deployment
    - Documentation

## 🎯 Key Features Summary

### Hero Page:
- **Ennead Architects slideshow** with placeholder images
- **30 flying project-model names** that follow mouse when moving, float randomly when still
- **Ghost hovering animation** style
- **High-level metrics**: Total projects, big element counts
- **Retro video game transition** to dashboard (screen wipe effect)

### Dashboard:
- **Sidebar navigation** with hub filtering
- **Multi-criteria search**: Project, hub, model, date range
- **Time series charts**: Weekly trends with stock market styling
- **Data aggregation**: Hub → Project → Model hierarchy
- **Dark terminal minimalism** theme with Ennead branding

### Technical:
- **Modular architecture** with separate CSS/JS files
- **Inter + JetBrains Mono** fonts
- **Performance optimized** for 120 JSON files/week
- **GitHub Pages ready** deployment

## 🔧 Technical Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js or D3.js for visualizations
- **Animations**: CSS3 animations and JavaScript
- **Data**: JSON file parsing and management
- **Deployment**: GitHub Pages ready

## 📁 Modular Architecture Requirements

### Directory Structure:
```
docs/
├── index.html                    # Main entry point
├── dashboard.html                # Dashboard page
├── styles/
│   ├── base.css                 # Reset, typography, CSS variables
│   ├── layout.css               # Grid systems, containers
│   ├── animations.css           # Keyframes and transitions
│   ├── responsive.css           # Media queries
│   └── components/              # Individual component styles
│       ├── hero.css
│       ├── dashboard.css
│       ├── charts.css
│       └── navigation.css
├── js/
│   ├── core/                    # Main application logic
│   │   ├── app.js              # Main app initialization
│   │   └── router.js           # Page routing
│   ├── components/             # Feature modules
│   │   ├── HeroAnimations.js   # Flying file names
│   │   ├── Dashboard.js        # Dashboard functionality
│   │   ├── DataTable.js        # Data table component
│   │   └── Charts.js           # Chart visualizations
│   ├── utils/                  # Helper functions
│   │   ├── dom.js             # DOM utilities
│   │   ├── date.js            # Date formatting
│   │   └── math.js            # Math utilities
│   └── data/                   # Data management
│       ├── parser.js          # JSON file parsing
│       ├── aggregator.js      # Data aggregation
│       └── storage.js         # Local storage
├── templates/                  # HTML templates
│   ├── hero.html              # Landing page template
│   ├── dashboard.html         # Dashboard template
│   └── components/            # Reusable components
│       ├── metric-card.html
│       ├── chart-container.html
│       └── search-filter.html
└── asset/
    └── data/                  # JSON data files
```

### CSS Organization:
- **Base Styles**: `styles/base.css` - Reset, typography, CSS variables, dark theme
- **Layout**: `styles/layout.css` - Grid systems, containers, responsive layouts
- **Components**: `styles/components/` - Individual component styles (hero, dashboard, charts)
- **Animations**: `styles/animations.css` - Keyframes, transitions, flying animations
- **Responsive**: `styles/responsive.css` - Media queries for mobile/tablet

### JavaScript Modules:
- **Core**: `js/core/` - Main application logic and routing
- **Components**: `js/components/` - Individual feature modules (HeroAnimations, Dashboard, Charts)
- **Utils**: `js/utils/` - Helper functions (DOM, date, math utilities)
- **Data**: `js/data/` - Data parsing, aggregation, and storage management

### HTML Templates:
- **Hero Page**: `templates/hero.html` - Landing page with flying animations
- **Dashboard**: `templates/dashboard.html` - Main dashboard with sidebar navigation
- **Components**: `templates/components/` - Reusable UI components (metric cards, charts)

### Typography & Design:
- **Primary Font**: Inter (Google Fonts) - Clean, modern, excellent readability
- **Monospace**: JetBrains Mono - For data displays and code elements
- **Theme**: Dark terminal minimalism with Ennead Architects branding
- **Colors**: Dark backgrounds (#0a0a0a, #1a1a1a) with accent colors (#00ff88, #2563eb)

### Performance Optimizations:
- **Lazy Loading**: Load dashboard data after hero page interaction
- **Modular Loading**: Load only required CSS/JS modules per page
- **Data Aggregation**: Weekly GitHub Action to merge 120 JSON files into combined dataset
- **Caching**: Local storage for frequently accessed data

---

**Ready to start building! All requirements clarified and architecture planned.**

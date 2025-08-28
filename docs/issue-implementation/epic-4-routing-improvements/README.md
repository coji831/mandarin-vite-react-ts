# Epic 4: Mandarin Feature Routing Improvements

## Epic Summary

**Epic Goal:** Refactor the Mandarin feature to use proper nested routing instead of a single-page state-driven approach, improving navigation, browser history support, and component organization.

**Status:** In Progress

**Last Update:** August 16, 2025

## Background

The current Mandarin feature implementation uses a state variable (`currentPage`) to control which subpage is displayed within a single React component (`Mandarin.tsx`). This approach has several limitations:

- Users can't navigate directly to subpages via URLs
- Browser back/forward buttons don't work as expected
- All subpages are under the same `/mandarin` route
- Component organization is less intuitive

This epic will refactor the routing structure to use proper nested routes while leveraging the context-based state management implemented in Epic 3.

## Architecture Decisions

1. **Nested Routes**: Implement proper nested routing for each subpage
2. **URL-based Navigation**: Replace `setCurrentPage` calls with router navigation
3. **Route Parameters**: Use route parameters for selected lists and sections
4. **Browser Navigation Support**: Enable proper back/forward button behavior
5. **Layout Component**: Create a layout component for shared UI elements across routes

## Implementation Details

- Created a dedicated router configuration for the Mandarin feature
- Set up nested routes for each subpage
- Updated navigation to use router navigation instead of state changes
- Created a layout component with an outlet for the nested routes
- Updated URL paths to include list IDs and section IDs where appropriate
- Ensured the browser's back and forward buttons work correctly

### Key Components Added/Modified

1. **MandarinRoutes**: New router configuration

   ```tsx
   // src/features/mandarin/router/MandarinRoutes.tsx
   import { Route, Routes } from "react-router-dom";
   import { MandarinLayout } from "../layouts/MandarinLayout";
   import {
     VocabularyListPage,
     DailyCommitmentPage,
     SectionConfirmPage,
     SectionSelectPage,
     FlashCardPage,
   } from "../pages";

   export function MandarinRoutes() {
     return (
       <Routes>
         <Route element={<MandarinLayout />}>
           <Route index element={<VocabularyListPage />} />
           <Route path="vocabulary-list" element={<VocabularyListPage />} />
           <Route path="daily-commitment" element={<DailyCommitmentPage />} />
           <Route path="section-confirm" element={<SectionConfirmPage />} />
           <Route path="section-select" element={<SectionSelectPage />} />
           <Route path="flashcards/:sectionId" element={<FlashCardPage />} />
         </Route>
       </Routes>
     );
   }
   ```

2. **MandarinLayout**: New layout component

   ```tsx
   // src/features/mandarin/layouts/MandarinLayout.tsx
   import { Outlet } from "react-router-dom";
   import { MandarinProvider } from "../context/MandarinContext";
   import { Navbar } from "../components/Navbar";

   export function MandarinLayout() {
     return (
       <MandarinProvider>
         <div className="mandarin-container">
           <Navbar />
           <div className="mandarin-content">
             <Outlet />
           </div>
         </div>
       </MandarinProvider>
     );
   }
   ```

3. **Individual Pages**: Converted from component state to routes

   ```tsx
   // Example: src/features/mandarin/pages/VocabularyListPage.tsx
   import { useNavigate } from "react-router-dom";
   import { useMandarin } from "../context/MandarinContext";
   import { VocabularyListSelector } from "../components/VocabularyListSelector";

   export function VocabularyListPage() {
     const navigate = useNavigate();
     const { setSelectedList } = useMandarin();

     const handleSelectList = (listName: string) => {
       setSelectedList(listName);
       navigate("/mandarin/daily-commitment");
     };

     return <VocabularyListSelector onSelectList={handleSelectList} />;
   }
   ```

4. **Main App Router**: Updated to include Mandarin routes

   ```tsx
   // src/router/Router.tsx
   import { BrowserRouter, Routes, Route } from "react-router-dom";
   import { Root } from "../layouts/Root";
   import { Home } from "../pages/Home";
   import { MandarinRoutes } from "../features/mandarin/router/MandarinRoutes";

   export function Router() {
     return (
       <BrowserRouter>
         <Routes>
           <Route element={<Root />}>
             <Route index element={<Home />} />
             <Route path="mandarin/*" element={<MandarinRoutes />} />
           </Route>
         </Routes>
       </BrowserRouter>
     );
   }
   ```

## Results and Benefits

- **Improved Navigation**: Users can navigate directly to subpages via URLs
- **Browser Integration**: Back and forward buttons work as expected
- **Cleaner Architecture**: Each subpage is its own component with a clear responsibility
- **Better Organization**: The feature is organized around routes, not a single component
- **URL Sharing**: Users can share URLs to specific sections or flashcards
- **Route Parameters**: Section IDs are properly passed via route parameters
- **Preserved Functionality**: All features work identically to before the refactor

## Lessons Learned

- Proper routing should be implemented from the start
- State-based navigation has significant limitations
- Context and routing work well together for complex features

## Next Steps

- Consider adding route guards to prevent navigation to invalid routes
- Add loading states for route transitions
- Consider persisting route parameters in the context for improved performance

## Related Issues

- [#14 Create Nested Route Structure](./story-4-1-create-nested-route-structure.md)
- [#15 Create Layout Component with Outlet](./story-4-2-create-layout-component.md)
- [#16 Convert Subpages to Routes](./story-4-3-convert-subpages.md)
- [#17 Update Navigation Logic](./story-4-4-update-navigation-logic.md)

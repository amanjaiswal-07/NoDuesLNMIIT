import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './components/Login.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router-dom'

// Medical imports
import MedicalLayout from './components/pages/medical/MedicalLayout.jsx'
import MedicalHome from "./components/pages/medical/MedicalHome.jsx";
import MedicalPending from "./components/pages/medical/MedicalPending.jsx";
import MedicalApproved from "./components/pages/medical/MedicalApproved.jsx";
import MedicalRejected from "./components/pages/medical/MedicalRejected.jsx";

// sports imports
import SportsLayout from "./components/pages/sports/SportsLayout.jsx";
import SportsHome from "./components/pages/sports/SportsHome.jsx";
import SportsPending from "./components/pages/sports/SportsPending.jsx";
import SportsApproved from "./components/pages/sports/SportsApproved.jsx";
import SportsRejected from "./components/pages/sports/SportsRejected.jsx";

// store imports
import StoreLayout from "./components/pages/store/StoreLayout.jsx";
import StoreHome from "./components/pages/store/StoreHome.jsx";
import StorePending from "./components/pages/store/StorePending.jsx";
import StoreApproved from "./components/pages/store/StoreApproved.jsx";
import StoreRejected from "./components/pages/store/StoreRejected.jsx";

// administration imports
import AdministrationLayout from "./components/pages/administration/AdministrationLayout.jsx";
import AdministrationHome from "./components/pages/administration/AdministrationHome.jsx";
import AdministrationPending from "./components/pages/administration/AdministrationPending.jsx";
import AdministrationApproved from "./components/pages/administration/AdministrationApproved.jsx";
import AdministrationRejected from "./components/pages/administration/AdministrationRejected.jsx";

// nad cell imports
import NadLayout from "./components/pages/nad/NadLayout.jsx";
import NadHome from "./components/pages/nad/NadHome.jsx";
import NadPending from "./components/pages/nad/NadPending.jsx";
import NadApproved from "./components/pages/nad/NadApproved.jsx";
import NadRejected from "./components/pages/nad/NadRejected.jsx";

// accounts imports
import AccountsLayout from "./components/pages/accounts/AccountsLayout.jsx";
import AccountsHome from "./components/pages/accounts/AccountsHome.jsx";
import AccountsPending from "./components/pages/accounts/AccountsPending.jsx";
import AccountsApproved from "./components/pages/accounts/AccountsApproved.jsx";
import AccountsRejected from "./components/pages/accounts/AccountsRejected.jsx";

// warden imports
import WardenLayout from "./components/pages/warden/WardenLayout.jsx";
import WardenHome from "./components/pages/warden/WardenHome.jsx";
import WardenPending from "./components/pages/warden/WardenPending.jsx";
import WardenApproved from "./components/pages/warden/WardenApproved.jsx";
import WardenRejected from "./components/pages/warden/WardenRejected.jsx";

// library imports
import LibraryRootLayout from "./components/pages/library/LibraryRootLayout.jsx";

// staff
import LibraryStaffLayout from "./components/pages/library/LibraryStaffLayout.jsx";
import LibraryStaffHome from "./components/pages/library/LibraryStaffHome.jsx";
import LibraryStaffPending from "./components/pages/library/LibraryStaffPending.jsx";
import LibraryStaffSent from "./components/pages/library/LibraryStaffSent.jsx";
import LibraryStaffRejected from "./components/pages/library/LibraryStaffRejected.jsx";

// librarian
import LibraryLibrarianLayout from "./components/pages/library/LibraryLibrarianLayout.jsx";
import LibraryLibrarianHome from "./components/pages/library/LibraryLibrarianHome.jsx";
import LibraryLibrarianPending from "./components/pages/library/LibraryLibrarianPending.jsx";
import LibraryLibrarianApproved from "./components/pages/library/LibraryLibrarianApproved.jsx";
import LibraryLibrarianRejected from "./components/pages/library/LibraryLibrarianRejected.jsx";

// placement imports
import PlacementLayout from "./components/pages/placement/PlacementLayout.jsx";
import PlacementHome from "./components/pages/placement/PlacementHome.jsx";
import PlacementPending from "./components/pages/placement/PlacementPending.jsx";
import PlacementApproved from "./components/pages/placement/PlacementApproved.jsx";
import PlacementRejected from "./components/pages/placement/PlacementRejected.jsx";

// lucs imports
import LUCSLayout from "./components/pages/LUCS/LUCSLayout.jsx";
import LUCSHome from "./components/pages/LUCS/LUCSHome.jsx";
import LUCSPending from "./components/pages/LUCS/LUCSPending.jsx";
import LUCSApproved from "./components/pages/LUCS/LUCSApproved.jsx";
import LUCSRejected from "./components/pages/LUCS/LUCSRejected.jsx";

// labs imports
import LabsLayout from "./components/pages/labs/LabsLayout.jsx";
import LabsHome from "./components/pages/labs/LabsHome.jsx";
import LabsPending from "./components/pages/labs/LabsPending.jsx";
import LabsApproved from "./components/pages/labs/LabsApproved.jsx";
import LabsRejected from "./components/pages/labs/LabsRejected.jsx";

// hod imports
import HODLayout from "./components/pages/HOD/HODLayout.jsx";
import HODHome from "./components/pages/HOD/HODHome.jsx";
import HODPending from "./components/pages/HOD/HODPending.jsx";
import HODApproved from "./components/pages/HOD/HODApproved.jsx";
import HODRejected from "./components/pages/HOD/HODRejected.jsx";

// student imports
import StudentLayout from "./components/pages/student/StudentLayout.jsx";
import StudentProfile from "./components/pages/student/StudentProfile.jsx";
import StudentApply from "./components/pages/student/StudentApply.jsx";
import StudentHistory from "./components/pages/student/StudentHistory.jsx";
import StudentTrack from "./components/pages/student/StudentTrack.jsx";
import StudentHome from "./components/pages/student/StudentHome.jsx";

// admin imports
import AdminLayout from "./components/pages/admin/AdminLayout.jsx";
import AdminHome from "./components/pages/admin/AdminHome.jsx";
import AdminDepartmentAccess from "./components/pages/admin/AdminDepartmentAccess.jsx";
import AdminEligibleStudents from "./components/pages/admin/AdminEligibleStudents.jsx";
import AdminApplications from "./components/pages/admin/AdminApplications.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Login />} />

      {/* ALL routes protected heavily by PrivateRoute on the frontend to prevent blind URL access */}
      <Route element={<PrivateRoute />}>

        {/* Medical section uses Layout */}
        <Route path="medical" element={<MedicalLayout />}>
          <Route index element={<MedicalHome />} />
          <Route path="pending" element={<MedicalPending />} />
          <Route path="approved" element={<MedicalApproved />} />
          <Route path="rejected" element={<MedicalRejected />} />
        </Route>

        <Route path="sports" element={<SportsLayout />}>
          <Route index element={<SportsHome />} />
          <Route path="pending" element={<SportsPending />} />
          <Route path="approved" element={<SportsApproved />} />
          <Route path="rejected" element={<SportsRejected />} />
        </Route>

        <Route path="store" element={<StoreLayout />}>
          <Route index element={<StoreHome />} />
          <Route path="pending" element={<StorePending />} />
          <Route path="approved" element={<StoreApproved />} />
          <Route path="rejected" element={<StoreRejected />} />
        </Route>

        <Route path="administration" element={<AdministrationLayout />}>
          <Route index element={<AdministrationHome />} />
          <Route path="pending" element={<AdministrationPending />} />
          <Route path="approved" element={<AdministrationApproved />} />
          <Route path="rejected" element={<AdministrationRejected />} />
        </Route>

        <Route path="nad" element={<NadLayout />}>
          <Route index element={<NadHome />} />
          <Route path="pending" element={<NadPending />} />
          <Route path="approved" element={<NadApproved />} />
          <Route path="rejected" element={<NadRejected />} />
        </Route>

        <Route path="accounts" element={<AccountsLayout />}>
          <Route index element={<AccountsHome />} />
          <Route path="pending" element={<AccountsPending />} />
          <Route path="approved" element={<AccountsApproved />} />
          <Route path="rejected" element={<AccountsRejected />} />
        </Route>

        <Route path="warden" element={<WardenLayout />}>
          <Route index element={<WardenHome />} />
          <Route path="pending" element={<WardenPending />} />
          <Route path="approved" element={<WardenApproved />} />
          <Route path="rejected" element={<WardenRejected />} />
        </Route>

        <Route path="library" element={<LibraryRootLayout />}>
          <Route index element={<Navigate to="/" replace />} />

          <Route path="staff" element={<LibraryStaffLayout />}>
            <Route index element={<LibraryStaffHome />} />
            <Route path="pending" element={<LibraryStaffPending />} />
            <Route path="sent" element={<LibraryStaffSent />} />
            <Route path="rejected" element={<LibraryStaffRejected />} />
          </Route>

          <Route path="librarian" element={<LibraryLibrarianLayout />}>
            <Route index element={<LibraryLibrarianHome />} />
            <Route path="pending" element={<LibraryLibrarianPending />} />
            <Route path="approved" element={<LibraryLibrarianApproved />} />
            <Route path="rejected" element={<LibraryLibrarianRejected />} />
          </Route>
        </Route>

        <Route path="placement" element={<PlacementLayout />}>
          <Route index element={<PlacementHome />} />
          <Route path="pending" element={<PlacementPending />} />
          <Route path="approved" element={<PlacementApproved />} />
          <Route path="rejected" element={<PlacementRejected />} />
        </Route>

        <Route path="lucs" element={<LUCSLayout />}>
          <Route index element={<LUCSHome />} />
          <Route path="pending" element={<LUCSPending />} />
          <Route path="approved" element={<LUCSApproved />} />
          <Route path="rejected" element={<LUCSRejected />} />
        </Route>

        <Route path="labs/:department" element={<LabsLayout />}>
          <Route index element={<LabsHome />} />
          <Route path="pending" element={<LabsPending />} />
          <Route path="approved" element={<LabsApproved />} />
          <Route path="rejected" element={<LabsRejected />} />
        </Route>

        <Route path="hod/:department" element={<HODLayout />}>
          <Route index element={<HODHome />} />
          <Route path="pending" element={<HODPending />} />
          <Route path="approved" element={<HODApproved />} />
          <Route path="rejected" element={<HODRejected />} />
        </Route>

        <Route path="student" element={<StudentLayout />}>
          <Route index element={<StudentHome />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="apply" element={<StudentApply />} />
          <Route path="track" element={<StudentTrack />} />
          <Route path="history" element={<StudentHistory />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="department-access" element={<AdminDepartmentAccess />} />
          <Route path="eligible-students" element={<AdminEligibleStudents />} />
          <Route
            path="applications"
            element={<AdminApplications />}
          />
        </Route>

      </Route>

      {/* Unknown address → back to the login page instead of the router's error screen */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </StrictMode>,
)

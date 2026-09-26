import { Outlet } from "react-router-dom";

// Parent route for /library/staff and /library/librarian.
// Each child layout (LibraryStaffLayout / LibraryLibrarianLayout) loads its own data.
export default function LibraryRootLayout() {
  return <Outlet />;
}

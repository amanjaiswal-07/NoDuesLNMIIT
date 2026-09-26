/**
 * App.jsx — root layout: just renders the matched page (<Outlet />).
 */

import { Outlet } from "react-router-dom";

function App() {
  return <Outlet />;
}

export default App;

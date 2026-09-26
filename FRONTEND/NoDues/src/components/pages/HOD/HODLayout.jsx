/**
 * HODLayout — the HOD shown is taken from the URL (/hod/cse → hod_cse), so the
 * page always matches the address bar. PrivateRoute already ensures the user
 * holds that HOD role (or is admin); if the URL is not a known HOD we fall back
 * to the first HOD role the user holds.
 */
import { Outlet, useParams } from "react-router-dom";
import DepartmentLayout from "../../shared/DepartmentLayout";

const HOD_LABELS = {
  hod_cse: "HOD - CSE",
  hod_ece: "HOD - ECE",
  hod_cce: "HOD - CCE",
  hod_mech: "HOD - MECH",
};

const HOD_CODES = Object.keys(HOD_LABELS);

export default function HODLayout() {
  const { department } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fromUrl = `hod_${(department || "").toLowerCase()}`;
  const hodCode = HOD_CODES.includes(fromUrl)
    ? fromUrl
    : user?.permissionCodes?.find((c) => HOD_CODES.includes(c)) || "hod_cse";
  const title = HOD_LABELS[hodCode];

  const departmentLabel = title.replace("HOD - ", "");

  return (
    <DepartmentLayout role="hod" unitCodes={[hodCode]} title={title} basePath={`/hod/${departmentLabel.toLowerCase()}`}>
      {(contextData) => (
        <Outlet
          context={{
            ...contextData,
            departmentLabel,
          }}
        />
      )}
    </DepartmentLayout>
  );
}
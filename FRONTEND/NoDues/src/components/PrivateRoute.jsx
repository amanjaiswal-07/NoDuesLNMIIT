import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ROUTE_TO_PERMISSION = {
    '/medical': 'medical',
    '/sports': 'sports',
    '/lucs': 'lucs',
    '/warden': 'warden',
    '/placement': 'placement',
    '/administration': 'administration',
    '/library/staff': 'library_staff',
    '/library/librarian': 'library_librarian',
    '/store': 'store',
    '/nad': 'nad',
    '/accounts': 'accounts',
    '/hod/cse': 'hod_cse',
    '/hod/ece': 'hod_ece',
    '/hod/cce': 'hod_cce',
    '/hod/mech': 'hod_mech',
    '/labs/cse-cce': 'labs_cse_cce',
    '/labs/ece-cce': 'labs_ece_cce',
    '/labs/mech': 'labs_mech',
    '/labs/physics': 'labs_physics',
    '/admin': 'admin',
};

const PrivateRoute = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const location = useLocation();

    if (!token || !userStr) {
        return <Navigate to="/" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        const path = location.pathname;

        // 1. Allow students strictly to their block
        if (path.startsWith('/student')) {
            if (user.role === 'student' || userStr.includes('"student"')) {
                return <Outlet />;
            }
            return <Navigate to={user.redirectRoute || '/'} replace />;
        }

        // 2. Allow super admin unconditionally across any route
        if (user.permissionCodes?.includes('admin')) {
            return <Outlet />;
        }

        // 3. Resolve base path for department dashboards dynamically (e.g. /hod/cse/pending -> /hod/cse)
        let basePath = '';
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0) {
            basePath = '/' + segments[0];
            if (['hod', 'labs', 'library'].includes(segments[0]) && segments.length > 1) {
                basePath += '/' + segments[1];
            }
        }

        // Validate the explicitly mapped permission
        const requiredCode = ROUTE_TO_PERMISSION[basePath];
        if (requiredCode && user.permissionCodes?.includes(requiredCode)) {
            return <Outlet />;
        }

        // Unrecognized / Unauthorized traversal attempts default aggressively back to user's home state instance
        return <Navigate to={user.redirectRoute || '/'} replace />;
    } catch {
        return <Navigate to="/" replace />;
    }
};

export default PrivateRoute;

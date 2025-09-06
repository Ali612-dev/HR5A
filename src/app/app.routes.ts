import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        loadComponent: () => import('./features/home/pages/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/pages/attendance/attendance.component').then(m => m.AttendanceComponent)
    },
    {
        path: 'attendance/add',
        loadComponent: () => import('./features/attendance/pages/add-attendance/add-attendance.component').then(m => m.AddAttendanceComponent)
    },
    {
        path: 'attendance/update/:id',
        loadComponent: () => import('./features/attendance/pages/update-attendance/update-attendance.component').then(m => m.UpdateAttendanceComponent)
    },
    {
        path: 'attendance/view/:id',
        loadComponent: () => import('./features/attendance/pages/view-attendance/view-attendance.component').then(m => m.ViewAttendanceComponent)
    },
    {
        path: 'attendance/history/:employeeId',
        loadComponent: () => import('./features/attendance/pages/employee-history/employee-history.component').then(m => m.EmployeeHistoryComponent)
    },
    {
        path: 'financial',
        loadComponent: () => import('./features/financial/pages/financial/financial.component').then(m => m.FinancialComponent)
    },
    {
        path: 'admin-login',
        loadComponent: () => import('./features/admin-login/pages/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
    },
    {
        path: 'blank',
        loadComponent: () => import('./features/blank-page/pages/blank-page/blank-page.component').then(m => m.BlankPageComponent)
    },
    {
        path: 'admin-dashboard',
        loadComponent: () => import('./features/admin-dashboard/pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
    },
    {
        path: 'employees',
        loadComponent: () => import('./features/employees/pages/employees/employees').then(m => m.Employees)
    },
    {
        path: 'employees/add',
        loadComponent: () => import('./features/employees/pages/add-employee/add-employee').then(m => m.AddEmployeeComponent)
    },
    {
        path: 'employees/update/:id',
        loadComponent: () => import('./features/employees/pages/update-employee/update-employee').then(m => m.UpdateEmployeeComponent)
    },
    {
        path: 'employees/view/:id',
        loadComponent: () => import('./features/employees/pages/view-employee/view-employee').then(m => m.ViewEmployeeComponent)
    }
];

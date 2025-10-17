# HR5A Flutter Web Migration Guide

## Overview
This document provides a comprehensive guide for recreating the HR5A Human Resources Management System using Flutter Web. The original application is built with Angular 18 and features a modern glassmorphism design with a purple gradient theme.

## Table of Contents
1. [Application Architecture](#application-architecture)
2. [Design System & Color Palette](#design-system--color-palette)
3. [Core Features](#core-features)
4. [Data Models](#data-models)
5. [Services & State Management](#services--state-management)
6. [UI Components](#ui-components)
7. [Localization](#localization)
8. [Flutter Implementation Guide](#flutter-implementation-guide)
9. [Dependencies](#dependencies)
10. [Deployment](#deployment)

## Application Architecture

### Project Structure
```
lib/
├── core/
│   ├── constants/
│   ├── models/
│   ├── services/
│   └── utils/
├── features/
│   ├── auth/
│   ├── home/
│   ├── employees/
│   ├── attendance/
│   ├── admin_dashboard/
│   └── financial/
├── shared/
│   ├── components/
│   ├── widgets/
│   └── services/
└── main.dart
```

### Key Architectural Patterns
- **Feature-based architecture** with modular organization
- **State management** using Provider/Riverpod or Bloc
- **Repository pattern** for data access
- **Dependency injection** for services
- **Responsive design** with mobile-first approach

## Design System & Color Palette

### Primary Color Scheme
```dart
class AppColors {
  // Primary gradient colors
  static const Color primaryStart = Color(0xFF667EEA); // #667eea
  static const Color primaryEnd = Color(0xFF764BA2);   // #764ba2
  
  // Purple theme variations
  static const Color purple50 = Color(0xFFF3E8FF);
  static const Color purple100 = Color(0xFFE9D5FF);
  static const Color purple200 = Color(0xFFDDD6FE);
  static const Color purple300 = Color(0xFFC4B5FD);
  static const Color purple400 = Color(0xFFA78BFA);
  static const Color purple500 = Color(0xFF8B5CF6);
  static const Color purple600 = Color(0xFF7C3AED);
  static const Color purple700 = Color(0xFF6D28D9);
  static const Color purple800 = Color(0xFF5B21B6);
  static const Color purple900 = Color(0xFF4C1D95);
  
  // Accent colors
  static const Color accent = Color(0xFFC084FC);
  static const Color success = Color(0xFFA855F7);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  
  // Neutral colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray300 = Color(0xFFD1D5DB);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray700 = Color(0xFF374151);
  static const Color gray800 = Color(0xFF1F2937);
  static const Color gray900 = Color(0xFF111827);
}
```

### Glassmorphism Design System
```dart
class GlassCard extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final double blur;
  final Color backgroundColor;
  
  const GlassCard({
    Key? key,
    required this.child,
    this.borderRadius = 15.0,
    this.blur = 10.0,
    this.backgroundColor = const Color(0x26FFFFFF),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: Colors.white.withOpacity(0.18),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0x1F1F2637),
                blurRadius: 32,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
```

### Background Gradient
```dart
class AppBackground extends StatelessWidget {
  final Widget child;
  
  const AppBackground({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryStart,
            AppColors.primaryEnd,
          ],
        ),
      ),
      child: child,
    );
  }
}
```

## Core Features

### 1. Authentication System
- **Admin Login**: Username/password authentication
- **Employee Registration**: Self-registration with approval workflow
- **Session Management**: JWT token handling
- **Role-based Access**: Admin vs Employee permissions

### 2. Employee Management
- **CRUD Operations**: Create, read, update, delete employees
- **Employee Profiles**: Name, phone, email, department, card number
- **Status Management**: Active/inactive employee status
- **Bulk Operations**: Select multiple employees for actions
- **WhatsApp Integration**: Send messages to employees

### 3. Attendance Tracking
- **Daily Attendance**: View attendance records by date
- **Add/Edit Attendance**: Manual attendance entry and modification
- **Attendance Map**: Interactive map showing employee locations
- **Employee History**: Individual attendance history
- **Real-time Updates**: Live attendance status

### 4. Admin Dashboard
- **Statistics Overview**: Employee counts, attendance rates
- **Pending Requests**: Employee registration approvals
- **Recent Activity**: Latest approved registrations
- **Quick Actions**: Navigate to different modules

### 5. Interactive Map Features
- **Leaflet Integration**: Interactive map with markers
- **Attendance Visualization**: Check-in/check-out locations
- **Clustering**: Group nearby attendance points
- **Filters**: Date, department, employee search
- **Mobile Responsive**: Optimized for mobile devices

### 6. WhatsApp Integration
- **Individual Messages**: Send messages to specific employees
- **Bulk Messaging**: Send to multiple selected employees
- **Message Templates**: Predefined message formats

## Data Models

### Employee Model
```dart
class Employee {
  final int id;
  final String name;
  final String phone;
  final String? email;
  final String? department;
  final String cardNumber;
  final bool isActive;
  final DateTime joinedDate;
  final DateTime? updatedAt;

  Employee({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.department,
    required this.cardNumber,
    required this.isActive,
    required this.joinedDate,
    this.updatedAt,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      email: json['email'],
      department: json['department'],
      cardNumber: json['cardNumber'],
      isActive: json['isActive'],
      joinedDate: DateTime.parse(json['joinedDate']),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'department': department,
      'cardNumber': cardNumber,
      'isActive': isActive,
      'joinedDate': joinedDate.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
```

### Attendance Model
```dart
class Attendance {
  final int id;
  final int employeeId;
  final String employeeName;
  final DateTime date;
  final DateTime? timeIn;
  final DateTime? timeOut;
  final String status;
  final String? locationName;
  final double? latitude;
  final double? longitude;
  final String attType;
  final DateTime? time;

  Attendance({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.date,
    this.timeIn,
    this.timeOut,
    required this.status,
    this.locationName,
    this.latitude,
    this.longitude,
    required this.attType,
    this.time,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'],
      employeeId: json['employeeId'],
      employeeName: json['employeeName'],
      date: DateTime.parse(json['date']),
      timeIn: json['timeIn'] != null ? DateTime.parse(json['timeIn']) : null,
      timeOut: json['timeOut'] != null ? DateTime.parse(json['timeOut']) : null,
      status: json['status'],
      locationName: json['locationName'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      attType: json['attType'],
      time: json['time'] != null ? DateTime.parse(json['time']) : null,
    );
  }
}
```

### Registration Request Model
```dart
class RegistrationRequest {
  final int id;
  final String fullName;
  final String phoneNumber;
  final String cardNumber;
  final String? email;
  final String? department;
  final DateTime requestDate;
  final String status; // 'pending', 'approved', 'rejected'
  final DateTime? processedDate;
  final String? rejectionReason;

  RegistrationRequest({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.cardNumber,
    this.email,
    this.department,
    required this.requestDate,
    required this.status,
    this.processedDate,
    this.rejectionReason,
  });

  factory RegistrationRequest.fromJson(Map<String, dynamic> json) {
    return RegistrationRequest(
      id: json['id'],
      fullName: json['fullName'],
      phoneNumber: json['phoneNumber'],
      cardNumber: json['cardNumber'],
      email: json['email'],
      department: json['department'],
      requestDate: DateTime.parse(json['requestDate']),
      status: json['status'],
      processedDate: json['processedDate'] != null 
          ? DateTime.parse(json['processedDate']) 
          : null,
      rejectionReason: json['rejectionReason'],
    );
  }
}
```

### Dashboard Statistics Model
```dart
class DashboardStats {
  final int totalEmployees;
  final int pendingRequests;
  final int approvedRequests;
  final int todayAttendance;
  final double attendanceRate;

  DashboardStats({
    required this.totalEmployees,
    required this.pendingRequests,
    required this.approvedRequests,
    required this.todayAttendance,
    required this.attendanceRate,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalEmployees: json['totalEmployees'],
      pendingRequests: json['pendingRequests'],
      approvedRequests: json['approvedRequests'],
      todayAttendance: json['todayAttendance'],
      attendanceRate: json['attendanceRate'].toDouble(),
    );
  }
}
```

## Services & State Management

### API Service
```dart
class ApiService {
  static const String baseUrl = 'https://your-api-url.com/api';
  final Dio _dio = Dio();

  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(LogInterceptor());
  }

  // Employee endpoints
  Future<List<Employee>> getEmployees({
    int page = 1,
    int pageSize = 10,
    String? name,
    String? department,
    bool? isActive,
  }) async {
    final response = await _dio.get('/employees', queryParameters: {
      'page': page,
      'pageSize': pageSize,
      if (name != null) 'name': name,
      if (department != null) 'department': department,
      if (isActive != null) 'isActive': isActive,
    });
    
    return (response.data['data'] as List)
        .map((json) => Employee.fromJson(json))
        .toList();
  }

  Future<Employee> createEmployee(Employee employee) async {
    final response = await _dio.post('/employees', data: employee.toJson());
    return Employee.fromJson(response.data['data']);
  }

  // Attendance endpoints
  Future<List<Attendance>> getAttendances({
    String? date,
    String? employeeName,
    int page = 1,
    int pageSize = 10,
  }) async {
    final response = await _dio.get('/attendances', queryParameters: {
      if (date != null) 'date': date,
      if (employeeName != null) 'employeeName': employeeName,
      'page': page,
      'pageSize': pageSize,
    });
    
    return (response.data['data'] as List)
        .map((json) => Attendance.fromJson(json))
        .toList();
  }

  // Authentication endpoints
  Future<AuthResponse> login(String username, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'username': username,
      'password': password,
    });
    return AuthResponse.fromJson(response.data);
  }

  Future<void> register(RegistrationRequest request) async {
    await _dio.post('/auth/register', data: request.toJson());
  }
}
```

### State Management with Riverpod
```dart
// Providers
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

final employeesProvider = StateNotifierProvider<EmployeesNotifier, EmployeesState>(
  (ref) => EmployeesNotifier(ref.read(apiServiceProvider)),
);

final attendanceProvider = StateNotifierProvider<AttendanceNotifier, AttendanceState>(
  (ref) => AttendanceNotifier(ref.read(apiServiceProvider)),
);

// State classes
class EmployeesState {
  final List<Employee> employees;
  final bool isLoading;
  final String? error;
  final int totalCount;
  final EmployeeRequest request;

  EmployeesState({
    this.employees = const [],
    this.isLoading = false,
    this.error,
    this.totalCount = 0,
    required this.request,
  });

  EmployeesState copyWith({
    List<Employee>? employees,
    bool? isLoading,
    String? error,
    int? totalCount,
    EmployeeRequest? request,
  }) {
    return EmployeesState(
      employees: employees ?? this.employees,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      totalCount: totalCount ?? this.totalCount,
      request: request ?? this.request,
    );
  }
}

// Notifier classes
class EmployeesNotifier extends StateNotifier<EmployeesState> {
  final ApiService _apiService;

  EmployeesNotifier(this._apiService) : super(EmployeesState(
    request: EmployeeRequest(),
  ));

  Future<void> loadEmployees() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final employees = await _apiService.getEmployees(
        page: state.request.pageNumber,
        pageSize: state.request.pageSize,
        name: state.request.name,
        department: state.request.department,
        isActive: state.request.isActive,
      );
      
      state = state.copyWith(
        employees: employees,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> createEmployee(Employee employee) async {
    try {
      await _apiService.createEmployee(employee);
      await loadEmployees(); // Refresh list
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}
```

## UI Components

### 1. Responsive Layout Components

#### AppScaffold
```dart
class AppScaffold extends StatelessWidget {
  final Widget body;
  final String? title;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final bool showBackButton;

  const AppScaffold({
    Key? key,
    required this.body,
    this.title,
    this.actions,
    this.floatingActionButton,
    this.showBackButton = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: title != null ? AppBar(
        title: Text(title!),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: showBackButton ? const BackButton() : null,
        actions: actions,
      ) : null,
      body: AppBackground(
        child: SafeArea(child: body),
      ),
      floatingActionButton: floatingActionButton,
    );
  }
}
```

#### ResponsiveBuilder
```dart
class ResponsiveBuilder extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveBuilder({
    Key? key,
    required this.mobile,
    this.tablet,
    this.desktop,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1200) {
          return desktop ?? tablet ?? mobile;
        } else if (constraints.maxWidth >= 768) {
          return tablet ?? mobile;
        } else {
          return mobile;
        }
      },
    );
  }
}
```

### 2. Form Components

#### CustomTextField
```dart
class CustomTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;

  const CustomTextField({
    Key? key,
    required this.label,
    this.hint,
    this.controller,
    this.validator,
    this.keyboardType,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          obscureText: obscureText,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: Colors.white.withOpacity(0.1),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
```

#### CustomButton
```dart
class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color? backgroundColor;
  final Color? textColor;
  final Widget? icon;
  final double? width;
  final double height;

  const CustomButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.backgroundColor,
    this.textColor,
    this.icon,
    this.width,
    this.height = 48,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? AppColors.accent,
          foregroundColor: textColor ?? Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    icon!,
                    const SizedBox(width: 8),
                  ],
                  Text(text),
                ],
              ),
      ),
    );
  }
}
```

### 3. Data Display Components

#### EmployeeCard
```dart
class EmployeeCard extends StatelessWidget {
  final Employee employee;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onMessage;
  final bool isSelected;
  final ValueChanged<bool>? onSelectionChanged;

  const EmployeeCard({
    Key? key,
    required this.employee,
    this.onTap,
    this.onEdit,
    this.onDelete,
    this.onMessage,
    this.isSelected = false,
    this.onSelectionChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(15),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (onSelectionChanged != null)
                    Checkbox(
                      value: isSelected,
                      onChanged: (value) => onSelectionChanged?.call(value ?? false),
                      activeColor: AppColors.accent,
                    ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          employee.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: employee.isActive 
                                ? AppColors.success.withOpacity(0.2)
                                : AppColors.error.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            employee.isActive ? 'Active' : 'Inactive',
                            style: TextStyle(
                              color: employee.isActive 
                                  ? AppColors.success
                                  : AppColors.error,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, color: Colors.white),
                    onSelected: (value) {
                      switch (value) {
                        case 'edit':
                          onEdit?.call();
                          break;
                        case 'delete':
                          onDelete?.call();
                          break;
                        case 'message':
                          onMessage?.call();
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit),
                            SizedBox(width: 8),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete),
                            SizedBox(width: 8),
                            Text('Delete'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'message',
                        child: Row(
                          children: [
                            Icon(Icons.message),
                            SizedBox(width: 8),
                            Text('Message'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildInfoRow(Icons.phone, employee.phone),
              if (employee.email != null)
                _buildInfoRow(Icons.email, employee.email!),
              if (employee.department != null)
                _buildInfoRow(Icons.business, employee.department!),
              _buildInfoRow(Icons.credit_card, employee.cardNumber),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.white70, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

#### AttendanceCard
```dart
class AttendanceCard extends StatelessWidget {
  final Attendance attendance;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onViewOnMap;

  const AttendanceCard({
    Key? key,
    required this.attendance,
    this.onTap,
    this.onEdit,
    this.onDelete,
    this.onViewOnMap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(15),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          attendance.employeeName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: attendance.status == 'Present'
                                ? AppColors.success.withOpacity(0.2)
                                : AppColors.error.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            attendance.status,
                            style: TextStyle(
                              color: attendance.status == 'Present'
                                  ? AppColors.success
                                  : AppColors.error,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      if (onEdit != null)
                        IconButton(
                          icon: const Icon(Icons.edit, color: Colors.white70),
                          onPressed: onEdit,
                        ),
                      if (onViewOnMap != null && 
                          attendance.latitude != null && 
                          attendance.longitude != null)
                        IconButton(
                          icon: const Icon(Icons.map, color: Colors.white70),
                          onPressed: onViewOnMap,
                        ),
                      if (onDelete != null)
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.white70),
                          onPressed: onDelete,
                        ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildInfoRow(Icons.calendar_today, 
                  DateFormat('MMM dd, yyyy').format(attendance.date)),
              if (attendance.timeIn != null)
                _buildInfoRow(Icons.login, 
                    'In: ${DateFormat('HH:mm').format(attendance.timeIn!)}'),
              if (attendance.timeOut != null)
                _buildInfoRow(Icons.logout, 
                    'Out: ${DateFormat('HH:mm').format(attendance.timeOut!)}'),
              if (attendance.locationName != null)
                _buildInfoRow(Icons.location_on, attendance.locationName!),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.white70, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

### 4. Navigation Components

#### BottomNavigationBar
```dart
class AppBottomNavigationBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const AppBottomNavigationBar({
    Key? key,
    required this.currentIndex,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: BottomNavigationBar(
            currentIndex: currentIndex,
            onTap: onTap,
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.transparent,
            selectedItemColor: Colors.white,
            unselectedItemColor: Colors.white60,
            elevation: 0,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.people),
                label: 'Employees',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.access_time),
                label: 'Attendance',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.dashboard),
                label: 'Dashboard',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### 5. Loading & Error Components

#### LoadingWidget
```dart
class LoadingWidget extends StatelessWidget {
  final String? message;

  const LoadingWidget({Key? key, this.message}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
```

#### ErrorWidget
```dart
class ErrorDisplay extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorDisplay({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            color: Colors.white,
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            CustomButton(
              text: 'Retry',
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ],
      ),
    );
  }
}
```

## Localization

### Setup
```dart
// pubspec.yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0

// main.dart
import 'package:flutter_localizations/flutter_localizations.dart';

MaterialApp(
  localizationsDelegates: const [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    AppLocalizations.delegate,
  ],
  supportedLocales: const [
    Locale('en', 'US'),
    Locale('ar', 'SA'),
    Locale('it', 'IT'),
  ],
  // ...
)
```

### Translation Keys
```dart
// lib/l10n/app_localizations.dart
abstract class AppLocalizations {
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  // Authentication
  String get adminLogin;
  String get username;
  String get password;
  String get login;
  String get register;
  String get employeeRegistration;
  
  // Employee Management
  String get employees;
  String get addEmployee;
  String get editEmployee;
  String get deleteEmployee;
  String get employeeName;
  String get phone;
  String get email;
  String get department;
  String get cardNumber;
  String get isActive;
  
  // Attendance
  String get attendance;
  String get dailyAttendance;
  String get addAttendance;
  String get timeIn;
  String get timeOut;
  String get status;
  String get present;
  String get absent;
  String get attendanceMap;
  String get viewOnMap;
  
  // Dashboard
  String get adminDashboard;
  String get totalEmployees;
  String get pendingRequests;
  String get approvedRequests;
  String get attendanceRate;
  
  // Common
  String get save;
  String get cancel;
  String get delete;
  String get edit;
  String get view;
  String get back;
  String get loading;
  String get error;
  String get success;
  String get retry;
  String get filter;
  String get search;
  String get date;
  String get actions;
}
```

### Language Files
```json
// lib/l10n/app_en.arb
{
  "adminLogin": "Admin Login",
  "username": "Username",
  "password": "Password",
  "login": "Login",
  "register": "Register",
  "employeeRegistration": "Employee Registration",
  "employees": "Employees",
  "addEmployee": "Add Employee",
  "editEmployee": "Edit Employee",
  "deleteEmployee": "Delete Employee",
  "employeeName": "Employee Name",
  "phone": "Phone",
  "email": "Email",
  "department": "Department",
  "cardNumber": "Card Number",
  "isActive": "Is Active",
  "attendance": "Attendance",
  "dailyAttendance": "Daily Attendance",
  "addAttendance": "Add Attendance",
  "timeIn": "Time In",
  "timeOut": "Time Out",
  "status": "Status",
  "present": "Present",
  "absent": "Absent",
  "attendanceMap": "Attendance Map",
  "viewOnMap": "View on Map",
  "adminDashboard": "Admin Dashboard",
  "totalEmployees": "Total Employees",
  "pendingRequests": "Pending Requests",
  "approvedRequests": "Approved Requests",
  "attendanceRate": "Attendance Rate",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "view": "View",
  "back": "Back",
  "loading": "Loading",
  "error": "Error",
  "success": "Success",
  "retry": "Retry",
  "filter": "Filter",
  "search": "Search",
  "date": "Date",
  "actions": "Actions"
}
```

```json
// lib/l10n/app_ar.arb
{
  "adminLogin": "تسجيل دخول المدير",
  "username": "اسم المستخدم",
  "password": "كلمة المرور",
  "login": "تسجيل الدخول",
  "register": "تسجيل",
  "employeeRegistration": "تسجيل الموظف",
  "employees": "الموظفون",
  "addEmployee": "إضافة موظف",
  "editEmployee": "تعديل الموظف",
  "deleteEmployee": "حذف الموظف",
  "employeeName": "اسم الموظف",
  "phone": "الهاتف",
  "email": "البريد الإلكتروني",
  "department": "القسم",
  "cardNumber": "رقم البطاقة",
  "isActive": "نشط",
  "attendance": "الحضور",
  "dailyAttendance": "الحضور اليومي",
  "addAttendance": "إضافة حضور",
  "timeIn": "وقت الدخول",
  "timeOut": "وقت الخروج",
  "status": "الحالة",
  "present": "حاضر",
  "absent": "غائب",
  "attendanceMap": "خريطة الحضور",
  "viewOnMap": "عرض على الخريطة",
  "adminDashboard": "لوحة تحكم المدير",
  "totalEmployees": "إجمالي الموظفين",
  "pendingRequests": "الطلبات المعلقة",
  "approvedRequests": "الطلبات الموافق عليها",
  "attendanceRate": "معدل الحضور",
  "save": "حفظ",
  "cancel": "إلغاء",
  "delete": "حذف",
  "edit": "تعديل",
  "view": "عرض",
  "back": "رجوع",
  "loading": "جاري التحميل",
  "error": "خطأ",
  "success": "نجح",
  "retry": "إعادة المحاولة",
  "filter": "تصفية",
  "search": "بحث",
  "date": "التاريخ",
  "actions": "الإجراءات"
}
```

## Flutter Implementation Guide

### 1. Project Setup
```bash
# Create Flutter project
flutter create hr5a_flutter_web
cd hr5a_flutter_web

# Add dependencies
flutter pub add provider
flutter pub add dio
flutter pub add shared_preferences
flutter pub add flutter_map
flutter pub add latlong2
flutter pub add url_launcher
flutter pub add image_picker
flutter pub add file_picker
flutter pub add intl
flutter pub add flutter_localizations --sdk=flutter

# Add dev dependencies
flutter pub add --dev build_runner
flutter pub add --dev json_annotation
flutter pub add --dev json_serializable
```

### 2. Main App Structure
```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/services/api_service.dart';
import 'core/services/auth_service.dart';
import 'shared/services/language_service.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/employees/providers/employees_provider.dart';
import 'features/attendance/providers/attendance_provider.dart';
import 'shared/theme/app_theme.dart';
import 'shared/routes/app_routes.dart';

void main() {
  runApp(const HR5AApp());
}

class HR5AApp extends StatelessWidget {
  const HR5AApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>(create: (_) => ApiService()),
        Provider<AuthService>(create: (_) => AuthService()),
        Provider<LanguageService>(create: (_) => LanguageService()),
        ChangeNotifierProxyProvider<ApiService, AuthProvider>(
          create: (context) => AuthProvider(context.read<ApiService>()),
          update: (context, apiService, previous) =>
              previous ?? AuthProvider(apiService),
        ),
        ChangeNotifierProxyProvider<ApiService, EmployeesProvider>(
          create: (context) => EmployeesProvider(context.read<ApiService>()),
          update: (context, apiService, previous) =>
              previous ?? EmployeesProvider(apiService),
        ),
        ChangeNotifierProxyProvider<ApiService, AttendanceProvider>(
          create: (context) => AttendanceProvider(context.read<ApiService>()),
          update: (context, apiService, previous) =>
              previous ?? AttendanceProvider(apiService),
        ),
      ],
      child: Consumer<LanguageService>(
        builder: (context, languageService, child) {
          return MaterialApp(
            title: 'HR5A',
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.dark,
            locale: languageService.currentLocale,
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
              AppLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en', 'US'),
              Locale('ar', 'SA'),
              Locale('it', 'IT'),
            ],
            initialRoute: AppRoutes.splash,
            onGenerateRoute: AppRoutes.generateRoute,
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
```

### 3. Routing System
```dart
// lib/shared/routes/app_routes.dart
import 'package:flutter/material.dart';

import '../../features/auth/pages/login_page.dart';
import '../../features/auth/pages/register_page.dart';
import '../../features/home/pages/home_page.dart';
import '../../features/employees/pages/employees_page.dart';
import '../../features/employees/pages/add_employee_page.dart';
import '../../features/employees/pages/edit_employee_page.dart';
import '../../features/attendance/pages/attendance_page.dart';
import '../../features/attendance/pages/add_attendance_page.dart';
import '../../features/attendance/pages/attendance_map_page.dart';
import '../../features/admin_dashboard/pages/admin_dashboard_page.dart';

class AppRoutes {
  static const String splash = '/';
  static const String home = '/home';
  static const String login = '/login';
  static const String register = '/register';
  static const String employees = '/employees';
  static const String addEmployee = '/employees/add';
  static const String editEmployee = '/employees/edit';
  static const String attendance = '/attendance';
  static const String addAttendance = '/attendance/add';
  static const String attendanceMap = '/attendance/map';
  static const String adminDashboard = '/admin/dashboard';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const HomePage());
      case home:
        return MaterialPageRoute(builder: (_) => const HomePage());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginPage());
      case register:
        return MaterialPageRoute(builder: (_) => const RegisterPage());
      case employees:
        return MaterialPageRoute(builder: (_) => const EmployeesPage());
      case addEmployee:
        return MaterialPageRoute(builder: (_) => const AddEmployeePage());
      case editEmployee:
        final employeeId = settings.arguments as int;
        return MaterialPageRoute(
          builder: (_) => EditEmployeePage(employeeId: employeeId),
        );
      case attendance:
        return MaterialPageRoute(builder: (_) => const AttendancePage());
      case addAttendance:
        return MaterialPageRoute(builder: (_) => const AddAttendancePage());
      case attendanceMap:
        return MaterialPageRoute(builder: (_) => const AttendanceMapPage());
      case adminDashboard:
        return MaterialPageRoute(builder: (_) => const AdminDashboardPage());
      default:
        return MaterialPageRoute(
          builder: (_) => const Scaffold(
            body: Center(child: Text('Page not found')),
          ),
        );
    }
  }
}
```

### 4. Map Integration
```dart
// lib/features/attendance/widgets/attendance_map.dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class AttendanceMap extends StatefulWidget {
  final List<Attendance> attendances;
  final Function(Attendance)? onMarkerTap;

  const AttendanceMap({
    Key? key,
    required this.attendances,
    this.onMarkerTap,
  }) : super(key: key);

  @override
  State<AttendanceMap> createState() => _AttendanceMapState();
}

class _AttendanceMapState extends State<AttendanceMap> {
  final MapController _mapController = MapController();
  
  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        center: LatLng(31.7683, 35.2137), // Default center (Palestine)
        zoom: 15.0,
        maxZoom: 18.0,
        minZoom: 5.0,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.example.hr5a',
        ),
        MarkerLayer(
          markers: _buildMarkers(),
        ),
      ],
    );
  }

  List<Marker> _buildMarkers() {
    return widget.attendances
        .where((attendance) => 
            attendance.latitude != null && attendance.longitude != null)
        .map((attendance) => Marker(
              point: LatLng(attendance.latitude!, attendance.longitude!),
              width: 40,
              height: 40,
              builder: (context) => GestureDetector(
                onTap: () => widget.onMarkerTap?.call(attendance),
                child: Container(
                  decoration: BoxDecoration(
                    color: _getMarkerColor(attendance),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    _getMarkerIcon(attendance),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ))
        .toList();
  }

  Color _getMarkerColor(Attendance attendance) {
    if (attendance.timeIn != null && attendance.timeOut != null) {
      return AppColors.purple500; // Both check-in and check-out
    } else if (attendance.timeIn != null) {
      return AppColors.success; // Check-in only
    } else if (attendance.timeOut != null) {
      return AppColors.error; // Check-out only
    }
    return AppColors.gray500; // Unknown
  }

  IconData _getMarkerIcon(Attendance attendance) {
    if (attendance.timeIn != null && attendance.timeOut != null) {
      return Icons.access_time; // Both
    } else if (attendance.timeIn != null) {
      return Icons.login; // Check-in
    } else if (attendance.timeOut != null) {
      return Icons.logout; // Check-out
    }
    return Icons.location_on; // Unknown
  }
}
```

### 5. WhatsApp Integration
```dart
// lib/core/services/whatsapp_service.dart
import 'package:url_launcher/url_launcher.dart';

class WhatsAppService {
  static Future<bool> sendMessage({
    required String phoneNumber,
    required String message,
  }) async {
    // Format phone number (remove any non-digits and ensure country code)
    String formattedPhone = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    
    // Add country code if not present (assuming international format)
    if (!formattedPhone.startsWith('972') && formattedPhone.startsWith('0')) {
      formattedPhone = '972${formattedPhone.substring(1)}';
    }
    
    final Uri whatsappUri = Uri.parse(
      'https://wa.me/$formattedPhone?text=${Uri.encodeComponent(message)}',
    );
    
    try {
      if (await canLaunchUrl(whatsappUri)) {
        return await launchUrl(
          whatsappUri,
          mode: LaunchMode.externalApplication,
        );
      }
      return false;
    } catch (e) {
      print('Error launching WhatsApp: $e');
      return false;
    }
  }

  static Future<bool> sendBulkMessage({
    required List<String> phoneNumbers,
    required String message,
  }) async {
    bool allSent = true;
    
    for (String phoneNumber in phoneNumbers) {
      final success = await sendMessage(
        phoneNumber: phoneNumber,
        message: message,
      );
      
      if (!success) {
        allSent = false;
      }
      
      // Add delay between messages to avoid rate limiting
      await Future.delayed(const Duration(milliseconds: 500));
    }
    
    return allSent;
  }
}
```

## Dependencies

### pubspec.yaml
```yaml
name: hr5a_flutter_web
description: HR5A Human Resources Management System - Flutter Web

publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: ">=3.10.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  provider: ^6.0.5
  riverpod: ^2.4.0
  flutter_riverpod: ^2.4.0

  # HTTP & API
  dio: ^5.3.2
  retrofit: ^4.0.3
  json_annotation: ^4.8.1

  # Storage
  shared_preferences: ^2.2.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0

  # UI & Design
  flutter_svg: ^2.0.7
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  lottie: ^2.7.0

  # Maps
  flutter_map: ^6.0.1
  latlong2: ^0.8.1
  geolocator: ^10.1.0

  # Utils
  intl: ^0.18.1
  url_launcher: ^6.2.1
  image_picker: ^1.0.4
  file_picker: ^6.1.1
  path_provider: ^2.1.1
  permission_handler: ^11.0.1

  # Icons
  font_awesome_flutter: ^10.6.0
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  
  # Code Generation
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
  retrofit_generator: ^8.0.4
  hive_generator: ^2.0.1

flutter:
  uses-material-design: true

  assets:
    - assets/images/
    - assets/icons/
    - assets/animations/
    - lib/l10n/

  fonts:
    - family: Roboto
      fonts:
        - asset: assets/fonts/Roboto-Regular.ttf
        - asset: assets/fonts/Roboto-Medium.ttf
          weight: 500
        - asset: assets/fonts/Roboto-Bold.ttf
          weight: 700

flutter_intl:
  enabled: true
  class_name: AppLocalizations
  main_locale: en
  arb_dir: lib/l10n
  output_dir: lib/l10n/generated
```

## Deployment

### Web Deployment Configuration
```yaml
# web/index.html
<!DOCTYPE html>
<html>
<head>
  <base href="$FLUTTER_BASE_HREF">
  <meta charset="UTF-8">
  <meta content="IE=Edge" http-equiv="X-UA-Compatible">
  <meta name="description" content="HR5A Human Resources Management System">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="HR5A">
  <link rel="apple-touch-icon" href="icons/Icon-192.png">
  <link rel="icon" type="image/png" href="favicon.png"/>
  <title>HR5A - Human Resources Management</title>
  <link rel="manifest" href="manifest.json">
  
  <!-- Leaflet CSS for maps -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Roboto', sans-serif;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: white;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loading" class="loading">
    <div class="spinner"></div>
    <p style="margin-top: 20px;">Loading HR5A...</p>
  </div>
  
  <script>
    window.addEventListener('flutter-first-frame', function () {
      const loading = document.querySelector('#loading');
      if (loading) {
        loading.remove();
      }
    });
  </script>
  
  <script src="main.dart.js" type="application/javascript"></script>
</body>
</html>
```

### Build Commands
```bash
# Development build
flutter build web --web-renderer html --dart-define=FLUTTER_WEB_USE_SKIA=false

# Production build
flutter build web --release --web-renderer html --dart-define=FLUTTER_WEB_USE_SKIA=false

# Build with specific base href for deployment
flutter build web --base-href /hr5a/ --release
```

### Vercel Deployment
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "build/web/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/build/web/$1"
    },
    {
      "src": "/",
      "dest": "/build/web/index.html"
    }
  ],
  "headers": [
    {
      "source": "/build/web/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Key Implementation Notes

### 1. Responsive Design
- Use `LayoutBuilder` and `MediaQuery` for responsive layouts
- Implement breakpoints: mobile (<768px), tablet (768-1200px), desktop (>1200px)
- Create responsive widgets that adapt to screen size
- Use `Flexible` and `Expanded` widgets appropriately

### 2. State Management Best Practices
- Use Provider or Riverpod for state management
- Implement proper error handling and loading states
- Cache data locally using SharedPreferences or Hive
- Implement optimistic updates for better UX

### 3. Performance Optimization
- Use `const` constructors wherever possible
- Implement lazy loading for large lists
- Use `ListView.builder` for dynamic lists
- Optimize images and assets
- Implement proper disposal of resources

### 4. Security Considerations
- Store sensitive data securely (tokens, credentials)
- Implement proper input validation
- Use HTTPS for all API calls
- Implement proper authentication flow
- Validate user permissions on each action

### 5. Testing Strategy
- Write unit tests for business logic
- Implement widget tests for UI components
- Create integration tests for critical flows
- Test on multiple screen sizes and orientations
- Test offline functionality

This comprehensive guide provides all the necessary information to recreate the HR5A application using Flutter Web while maintaining the same design aesthetic, functionality, and user experience as the original Angular application.

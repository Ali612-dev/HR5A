# 🔍 Salary Report 500 Error - Debug Guide

## المشكلة
خطأ 500 (Internal Server Error) عند إنشاء تقرير الراتب عبر `POST /api/SalaryReport/calculate`

## التشخيص المطلوب

### 1. تحقق من البيانات المرسلة
```javascript
// في console المتصفح، شغل هذا الكود:
localStorage.getItem('authToken') // تأكد من وجود token
```

### 2. اختبر الـ API مباشرة
```javascript
// انسخ والصق هذا الكود في console المتصفح:

async function testSalaryReportAPI() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.error('❌ No auth token found');
        return;
    }
    
    const testData = {
        employeeId: 2, // Mahmoud adel's ID
        reportMonth: 12,
        reportYear: 2024,
        notes: "Test salary report creation"
    };
    
    console.log('🧪 Testing with data:', testData);
    
    try {
        const response = await fetch('http://172.20.208.1:6365/api/SalaryReport/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept-Language': 'en-US'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📡 Response status:', response.status);
        const responseText = await response.text();
        console.log('📡 Response text:', responseText);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testSalaryReportAPI();
```

### 3. تحقق من بيانات الموظف
```javascript
// تحقق من أن الموظف له WorkRule و EmployeeSalary:

async function checkEmployeeData() {
    const token = localStorage.getItem('authToken');
    
    // 1. تحقق من Employee Salary
    const salaryResponse = await fetch('http://172.20.208.1:6365/api/EmployeeSalary/employee/2', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': 'en-US'
        }
    });
    
    const salaryData = await salaryResponse.json();
    console.log('👤 Employee Salary:', salaryData);
    
    // 2. تحقق من Work Rule
    const workRuleResponse = await fetch('http://172.20.208.1:6365/api/WorkRule?employeeId=2', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': 'en-US'
        }
    });
    
    const workRuleData = await workRuleResponse.json();
    console.log('⏰ Work Rules:', workRuleData);
}

checkEmployeeData();
```

## الأسباب المحتملة للخطأ 500

### 1. **موظف بدون WorkRule**
- الموظف يجب أن يكون له WorkRule مُعين
- بدون WorkRule، لا يمكن حساب الساعات المتوقعة

### 2. **موظف بدون EmployeeSalary**
- الموظف يجب أن يكون له EmployeeSalary مُعين
- بدون EmployeeSalary، لا يمكن حساب الراتب الأساسي

### 3. **بيانات Attendance مفقودة**
- قد يحتاج النظام بيانات حضور للشهر المحدد
- في حالة عدم وجود بيانات، قد يفشل الحساب

### 4. **مشكلة في Backend Logic**
- خطأ في حساب الساعات
- خطأ في حساب العمل الإضافي
- خطأ في قاعدة البيانات

## الحلول المقترحة

### 1. **تأكد من البيانات المطلوبة**
```sql
-- تحقق من وجود EmployeeSalary للموظف
SELECT * FROM EmployeeSalaries WHERE EmployeeId = 2;

-- تحقق من وجود WorkRule للموظف
SELECT * FROM WorkRules WHERE EmployeeId = 2 OR IsPrivate = 0;

-- تحقق من وجود بيانات Attendance
SELECT * FROM Attendances WHERE EmployeeId = 2 AND MONTH(Date) = 12 AND YEAR(Date) = 2024;
```

### 2. **اختبر مع موظف آخر**
- جرب مع موظف لديه بيانات كاملة
- تأكد من أن جميع البيانات المطلوبة موجودة

### 3. **تحقق من Backend Logs**
- راجع logs الخادم للتفاصيل الكاملة للخطأ
- قد تحتوي على معلومات أكثر تفصيلاً

## البيانات المطلوبة للـ API

```json
{
  "employeeId": 2,           // معرف الموظف (مطلوب)
  "reportMonth": 12,         // الشهر (1-12) (مطلوب)
  "reportYear": 2024,        // السنة (2020-2030) (مطلوب)
  "notes": "Optional notes"  // ملاحظات (اختياري)
}
```

## النتائج المتوقعة

### ✅ نجح (200 OK)
```json
{
  "data": {
    "id": 1,
    "employeeId": 2,
    "employeeName": "Mahmoud adel",
    "reportMonth": 12,
    "reportYear": 2024,
    "baseSalary": 5000.00,
    "netCalculatedSalary": 5500.00,
    // ... باقي البيانات
  },
  "message": "تم حساب تقرير المرتب بنجاح",
  "isSuccess": true
}
```

### ❌ فشل (500 Internal Server Error)
```json
{
  "data": null,
  "message": "Internal server error.",
  "isSuccess": false,
  "errors": []
}
```

## الخطوات التالية

1. شغل الكود أعلاه في console المتصفح
2. راجع النتائج
3. تأكد من وجود جميع البيانات المطلوبة
4. إذا استمر الخطأ، راجع Backend logs


@using Microsoft.AspNetCore.Mvc.Localization
@using CustomAttendance.Entities
@model EmployeeRegistrationViewModel
@inject IViewLocalizer Localizer

@{
    ViewData["Title"] = Localizer["RegisterTitle"];
    Layout = "_LayoutMinimal";
}

@section Styles {
    <style>
    :root {
        --primary-color: #4e73df;
        --primary-hover: #2e59d9;
        --glass-bg: rgba(255, 255, 255, 0.1);
        --glass-border: rgba(255, 255, 255, 0.2);
        --text-color: #2d3748;
    }

    body {
        min-height: 100vh;
        margin: 0;
        padding: 0.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: var(--text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        max-width: 100%;
        overflow-x: hidden;
    }

    .glass-card {
        background: var(--glass-bg);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid var(--glass-border);
        border-radius: 10px;
        box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.25);
        overflow: hidden;
        width: 100%;
        max-width: 100%;
        margin: 0.5rem;
    }

    .glass-body {
        padding: 1.25rem;
    }

    .form-control {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 0.7rem 0.9rem;
        font-size: 0.95rem;
        transition: all 0.2s ease;
        height: auto;
    }

    .form-control:focus {
        background: white;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
    }

    .btn-primary {
        background: var(--primary-color);
        border: none;
        border-radius: 8px;
        padding: 0.8rem 1.5rem;
        font-weight: 600;
        font-size: 1rem;
        letter-spacing: 0.5px;
        transition: all 0.2s ease;
        width: 100%;
        margin-top: 0.5rem;
    }

    .btn-primary:hover, .btn-primary:focus {
        background: var(--primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .form-label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: white;
    }

    .input-group-text {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-right: none;
        border-radius: 8px 0 0 8px;
    }

    .text-muted {
        color: rgba(255, 255, 255, 0.8) !important;
        font-size: 0.85rem;
    }

    .alert {
        border-radius: 8px;
        border: none;
    }

    .validation-summary-errors {
        background: rgba(220, 53, 69, 0.1);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .field-validation-error {
        color: #ff6b6b;
        font-size: 0.85rem;
        margin-top: 0.25rem;
        display: block;
    }

    .logo {
        width: 60px;
        height: 60px;
        margin: 0 auto 0.75rem;
        display: block;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        padding: 0.35rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .title {
        color: white;
        font-weight: 700;
        margin: 0.5rem 0 0.25rem;
        font-size: 1.5rem;
        line-height: 1.2;
    }

    .subtitle {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.85rem;
        margin: 0 0 1.5rem;
        line-height: 1.5;
        padding: 0 0.5rem;
    }

    .form-group {
        margin-bottom: 1.1rem;
    }

    .btn-block {
        display: block;
        width: 100%;
        padding: 0.75rem;
        font-size: 1.05rem;
        margin-top: 0.5rem;
    }

    @@media (min-width: 400px) {
        .logo {
            width: 70px;
            height: 70px;
            padding: 0.4rem;
        }

        .subtitle {
            font-size: 0.9rem;
            padding: 0;
        }

        .btn-block {
            width: auto;
            display: inline-block;
            margin-top: 0;
        }

        .glass-body {
            padding: 1.5rem;
        }

        .form-control {
            padding: 0.75rem 1rem;
            font-size: 1rem;
        }
    }

    @@media (min-width: 576px) {
        body {
            padding: 1rem;
        }

        .glass-card {
            border-radius: 12px;
            max-width: 450px;
            margin: 1rem auto;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }

        .glass-body {
            padding: 2rem 2.5rem;
        }

        .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 1.25rem;
            padding: 0.5rem;
        }

        .title {
            font-size: 1.85rem;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            font-size: 0.95rem;
            margin-bottom: 2rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }
    }
    /* Modern Table Styles */
    .table-responsive {
        border-radius: 10px;
        overflow: hidden;
        margin: 1.5rem 0;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .table {
        margin-bottom: 0;
        color: white;
    }

    .table thead th {
        background: rgba(255, 255, 255, 0.15);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: 600;
        padding: 1rem;
        vertical-align: middle;
    }

    .table tbody td {
        padding: 1rem;
        vertical-align: middle;
        border-color: rgba(255, 255, 255, 0.1);
    }

    .table tbody tr {
        transition: all 0.2s ease;
    }

    .table tbody tr:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateX(4px);
    }

    /* Responsive Table */
    @@media (max-width: 767.98px) {
        .table-responsive {
            border: none;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }

        .table thead {
            display: none;
        }

        .table, .table tbody, .table tr, .table td {
            display: block;
            width: 100%;
        }

        .table tbody tr {
            margin-bottom: 1.5rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .table tbody tr:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .table td {
            text-align: right;
            padding-left: 50%;
            position: relative;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .table td:before {
            content: attr(data-label);
            position: absolute;
            left: 1rem;
            width: 45%;
            padding-right: 1rem;
            font-weight: 600;
            text-align: left;
        }

        .table td:last-child {
            border-bottom: none;
        }
    }

    /* Status Badges */
    .badge {
        padding: 0.5em 0.8em;
        font-weight: 600;
        border-radius: 6px;
        font-size: 0.8em;
        letter-spacing: 0.5px;
    }

    .badge-pending {
        background: rgba(255, 193, 7, 0.2);
        color: #ffc107;
    }

    .badge-approved {
        background: rgba(40, 167, 69, 0.2);
        color: #28a745;
    }

    .badge-rejected {
        background: rgba(220, 53, 69, 0.2);
        color: #dc3545;
    }
    </style>
}

<div class="container my-4">
    <div class="row justify-content-center">
        <div class="col-12 col-md-10 col-lg-8">
            <div class="glass-card">
                <div class="glass-body">
                    <div class="text-center mb-4">
                        <svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <h2 class="title">@Localizer["EmployeeRegistration"]</h2>
                        <p class="subtitle">@Localizer["FillDetailsToRegister"]</p>
                    </div>

                    @if (TempData["SuccessMessage"] != null)
{
    <div class="alert alert-success">
        <i class="bi bi-check-circle-fill me-2" aria-label="@Localizer["RegistrationSuccess"]"></i>@Localizer["RegistrationSuccess"]: @TempData["SuccessMessage"]
    </div>
}
@if (TempData["ErrorMessage"] != null)
{
    <div class="alert alert-danger">
        <i class="bi bi-x-circle-fill me-2" aria-label="@Localizer["RegistrationError"]"></i>@Localizer["RegistrationError"]: @TempData["ErrorMessage"]
    </div>
}

                    <form id="registerForm" asp-action="Register" method="post" class="needs-validation" novalidate>
                        <div asp-validation-summary="ModelOnly" class="text-danger mb-4"></div>

                        <div class="form-group">
                            <label asp-for="FullName" class="form-label">@Localizer["FullName"]</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-person-fill"></i></span>
                                <input asp-for="FullName" class="form-control" placeholder="John Doe" required />
                            </div>
                            <span asp-validation-for="FullName" class="text-danger"></span>
                        </div>

                        <div class="form-group">
                            <label asp-for="PhoneNumber" class="form-label">@Localizer["WhatsAppNumber"]</label>
                            <div class="input-group">
                                <span class="input-group-text">+</span>
                                <input asp-for="PhoneNumber" class="form-control" placeholder="201234567890" required />
                            </div>
                            <small class="text-muted">@Localizer["WhatsAppNumberHint"]</small>
                            <span asp-validation-for="PhoneNumber" class="text-danger"></span>
                        </div>

                        <div class="form-group">
                            <label asp-for="CardNumber" class="form-label">@Localizer["CardNumber"]</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-credit-card-fill"></i></span>
                                <input asp-for="CardNumber" class="form-control" placeholder="@Localizer["EnterCardNumber"]" required />
                            </div>
                            <span asp-validation-for="CardNumber" class="text-danger"></span>
                        </div>

                        <div class="form-group">
                            <label asp-for="Email" class="form-label">@Localizer["EmailOptional"]</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-envelope-fill"></i></span>
                                <input asp-for="Email" class="form-control" type="email" placeholder="example@domain.com" />
                            </div>
                            <span asp-validation-for="Email" class="text-danger"></span>
                        </div>

                        <div class="form-group">
                            <label asp-for="Department" class="form-label">@Localizer["DepartmentOptional"]</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-building"></i></span>
                                <input asp-for="Department" class="form-control" placeholder="e.g., IT, HR, Finance" />
                            </div>
                            <span asp-validation-for="Department" class="text-danger"></span>
                        </div>

                        <div class="form-group mt-4">
                            <button type="submit" id="registerButton" class="btn btn-primary btn-block">
                                <span id="buttonText">
                                    <i class="bi bi-person-plus-fill me-2"></i>@Localizer["RegisterNow"]
                                </span>
                                <span id="buttonSpinner" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            </button>
                        </div>
                    </form>

                    <!-- Recent Registrations Table -->
                    @if (ViewBag.RecentRegistrations != null && ((List<Employee>)ViewBag.RecentRegistrations).Any())
                    {
                        <div class="mt-5">
                            <h5 class="mb-3 text-white">@Localizer["RecentRegistrations"]</h5>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>@Localizer["Name"]</th>
                                            <th>@Localizer["CardNumber"]</th>
                                            <th>@Localizer["Department"]</th>
                                            <th>@Localizer["DateRegistered"]</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach (var employee in ViewBag.RecentRegistrations)
                                        {
                                            <tr>
                                                <td data-label="Name">@employee.Name</td>
                                                <td data-label="Card Number">@employee.CardNumber</td>
                                                <td data-label="Department">@(employee.Department ?? "N/A")</td>
                                                <td data-label="Date">@employee.CreatedDateTime.ToString("g")</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    </div>
</div>

@section Scripts {
    @{await Html.RenderPartialAsync("_ValidationScriptsPartial");}

    <script>
        // Enable Bootstrap form validation and handle form submission
        (function () {
            'use strict'

            const form = document.getElementById('registerForm');
            const registerButton = document.getElementById('registerButton');
            const buttonText = document.getElementById('buttonText');
            const buttonSpinner = document.getElementById('buttonSpinner');

            // Form validation
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    // Disable button and show spinner when form is valid and being submitted
                    registerButton.disabled = true;
                    buttonText.textContent = 'Processing...';
                    buttonSpinner.classList.remove('d-none');
                }

                form.classList.add('was-validated');
            }, false);

            // Re-enable the button if form validation fails
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('invalid', function() {
                    registerButton.disabled = false;
                    buttonText.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Register Now';
                    buttonSpinner.classList.add('d-none');
                });
            });
        })();
    </script>
}

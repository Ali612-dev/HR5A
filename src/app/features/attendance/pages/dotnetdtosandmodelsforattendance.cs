namespace DefaultNamespace;

public class dotnetdtosandmodelsforattendance
{

}
using System;
using System.ComponentModel.DataAnnotations;

namespace CustomAttendance.Module.Attendance.DTOs;

public class AddAttendanceDto
{
  [Required]
  public int EmployeeId { get; set; }

  [Required]
  [DataType(DataType.Date)]
  public DateTime Date { get; set; }

  [DataType(DataType.DateTime)]
  public DateTime? TimeIn { get; set; }

  [DataType(DataType.DateTime)]
  public DateTime? TimeOut { get; set; }

  public double? Latitude { get; set; }
  public double? Longitude { get; set; }
  public double? OutLatitude { get; set; }
  public double? OutLongitude { get; set; }

  [MaxLength(500)]
  public string? LocationName { get; set; }

  public TimeSpan Time { get; set; }
  public string? Status { get; set; }
  public int AttType { get; set; }
}
using System;

namespace CustomAttendance.Module.Attendance.DTOs;

public class AttendanceViewModel
{
  public int Id { get; set; }
  public int EmployeeId { get; set; }
  public string EmployeeName { get; set; } // Added for convenience
  public DateTime Date { get; set; }
  public DateTime? TimeIn { get; set; }
  public DateTime? TimeOut { get; set; }
  public double? Latitude { get; set; }
  public double? Longitude { get; set; }
  public double? OutLatitude { get; set; }
  public double? OutLongitude { get; set; }
  public string? LocationName { get; set; }
  public DateTime CreatedAt { get; set; }
  public TimeSpan Time { get; set; }
  public string? Status { get; set; }
  public int AttType { get; set; }
}
using System;
using System.ComponentModel.DataAnnotations;

namespace CustomAttendance.Module.Attendance.DTOs;

public class GetDailyAttendanceDto
{
  [DataType(DataType.Date)]
  public DateTime? Date { get; set; } = DateTime.Today;
  private const int MaxPageSize = 50;
  private int _pageSize = 10;

  public int PageNumber { get; set; } = 1;

  public int PageSize
  {
    get => _pageSize;
    set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
  }

  public string? SortField { get; set; }
  public string? SortOrder { get; set; } = "asc";
}
using System;
using System.ComponentModel.DataAnnotations;

namespace CustomAttendance.Module.Attendance.DTOs;

public class GetEmployeeAttendanceHistoryDto
{
  [Required]
  public int EmployeeId { get; set; }

  [DataType(DataType.Date)]
  public DateTime? StartDate { get; set; }

  [DataType(DataType.Date)]
  public DateTime? EndDate { get; set; }
  private const int MaxPageSize = 50;
  private int _pageSize = 10;

  public int PageNumber { get; set; } = 1;

  public int PageSize
  {
    get => _pageSize;
    set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
  }

  public string? SortField { get; set; }
  public string? SortOrder { get; set; } = "asc";
}
using System.Collections.Generic;

namespace CustomAttendance.Module.Attendance.DTOs;

public class PaginatedAttendanceResponseDto
{
  public IEnumerable<AttendanceViewModel> Attendances { get; set; } = new List<AttendanceViewModel>();
  public int TotalCount { get; set; }
}
using System.Collections.Generic;

namespace CustomAttendance.Module.Attendance.DTOs;

public class PaginatedEmployeeAttendanceHistoryResponseDto
{
  public IEnumerable<AttendanceViewModel> Attendances { get; set; } = new List<AttendanceViewModel>();
  public int TotalCount { get; set; }
}
using System;
using System.ComponentModel.DataAnnotations;

namespace CustomAttendance.Module.Attendance.DTOs;

public class UpdateAttendanceDto
{
  [Required]
  public int Id { get; set; }

  public int? EmployeeId { get; set; }

  [DataType(DataType.Date)]
  public DateTime? Date { get; set; }

  [DataType(DataType.DateTime)]
  public DateTime? TimeIn { get; set; }

  [DataType(DataType.DateTime)]
  public DateTime? TimeOut { get; set; }

  public double? Latitude { get; set; }
  public double? Longitude { get; set; }
  public double? OutLatitude { get; set; }
  public double? OutLongitude { get; set; }

  [MaxLength(500)]
  public string? LocationName { get; set; }

  public TimeSpan? Time { get; set; }
  public string? Status { get; set; }
  public int? AttType { get; set; }
}
using CustomAttendance.Module.Attendance.DTOs;
using CustomAttendance.Module.Attendance.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace CustomAttendance.Module.Attendance.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;
    private readonly IStringLocalizer<AttendanceController> _localizer;

    public AttendanceController(IAttendanceService attendanceService, IStringLocalizer<AttendanceController> localizer)
    {
        _attendanceService = attendanceService;
        _localizer = localizer;
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyAttendance([FromQuery] GetDailyAttendanceDto dto)
    {
        var result = await _attendanceService.GetDailyAttendanceAsync(dto);
        if (result.IsSuccess)
        {
            result.Message = _localizer["DailyAttendanceRetrievedSuccessfully"];
            return Ok(result);
        }

        result.Message = _localizer["NoDailyAttendanceFound"];
        return NotFound(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetEmployeeAttendanceHistory([FromQuery] GetEmployeeAttendanceHistoryDto dto)
    {
        var result = await _attendanceService.GetEmployeeAttendanceHistoryAsync(dto);
        if (result.IsSuccess)
        {
            result.Message = _localizer["EmployeeAttendanceHistoryRetrievedSuccessfully"];
            return Ok(result);
        }

        result.Message = _localizer["NoEmployeeAttendanceHistoryFound"];
        return NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddAttendance([FromBody] AddAttendanceDto dto)
    {
        var result = await _attendanceService.AddAttendanceAsync(dto);
        if (result.IsSuccess)
        {
            result.Message = _localizer["AttendanceAddedSuccessfully"];
            return Ok(result);
        }

        return BadRequest(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAttendance(int id, [FromBody] UpdateAttendanceDto dto)
    {
        if (id != dto.Id)
        {
            return BadRequest(_localizer["AttendanceIdMismatch"]);
        }

        var result = await _attendanceService.UpdateAttendanceAsync(dto);
        if (result.IsSuccess)
        {
            result.Message = _localizer["AttendanceUpdatedSuccessfully"];
            return Ok(result);
        }

        result.Message = _localizer["AttendanceNotFound"];
        return NotFound(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAttendance(int id)
    {
        var result = await _attendanceService.DeleteAttendanceAsync(id);
        if (result.IsSuccess)
        {
            result.Message = _localizer["AttendanceDeletedSuccessfully"];
            return Ok(result);
        }

        result.Message = _localizer["AttendanceNotFound"];
        return NotFound(result);
    }
}

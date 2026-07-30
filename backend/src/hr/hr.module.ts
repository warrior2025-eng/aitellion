import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments/departments.controller';
import { DepartmentsService } from './departments/departments.service';
import { EmployeesController } from './employees/employees.controller';
import { EmployeesService } from './employees/employees.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { LeavesController } from './leaves/leaves.controller';
import { LeavesService } from './leaves/leaves.service';

@Module({
  controllers: [DepartmentsController, EmployeesController, AttendanceController, LeavesController],
  providers: [DepartmentsService, EmployeesService, AttendanceService, LeavesService],
  exports: [DepartmentsService, EmployeesService, AttendanceService, LeavesService],
})
export class HrModule {}
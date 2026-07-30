import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/attendance.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('hr/attendance')
@ApiBearerAuth()
@Controller('hr/attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('employeeId') employeeId?: string,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.list(organizationId, { employeeId, date });
  }

  @Get('summary')
  summary(@CurrentUser('organizationId') organizationId: string, @Query('date') date: string) {
    return this.attendanceService.summaryForDate(organizationId, date);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR, OrgRole.MANAGER)
  mark(@CurrentUser('organizationId') organizationId: string, @Body() dto: MarkAttendanceDto) {
    return this.attendanceService.mark(organizationId, dto);
  }
}
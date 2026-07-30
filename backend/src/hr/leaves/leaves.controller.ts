import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CreateLeaveRequestDto } from './dto/leave.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('hr/leaves')
@ApiBearerAuth()
@Controller('hr/leaves')
export class LeavesController {
  constructor(private leavesService: LeavesService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.leavesService.list(organizationId, { employeeId, status });
  }

  @Post()
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateLeaveRequestDto) {
    return this.leavesService.create(organizationId, dto);
  }

  @Patch(':id/approve')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR, OrgRole.MANAGER)
  approve(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.leavesService.setStatus(organizationId, id, 'APPROVED', userId);
  }

  @Patch(':id/reject')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR, OrgRole.MANAGER)
  reject(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.leavesService.setStatus(organizationId, id, 'REJECTED', userId);
  }
}
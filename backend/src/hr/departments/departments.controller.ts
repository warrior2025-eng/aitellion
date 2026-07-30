import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/department.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('hr/departments')
@ApiBearerAuth()
@Controller('hr/departments')
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  list(@CurrentUser('organizationId') organizationId: string) {
    return this.departmentsService.list(organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR)
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(organizationId, dto);
  }

  @Delete(':id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR)
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.departmentsService.remove(organizationId, id);
  }
}
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('hr/employees')
@ApiBearerAuth()
@Controller('hr/employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.employeesService.list(organizationId, { search, departmentId });
  }

  @Get(':id')
  get(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.employeesService.get(organizationId, id);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR)
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(organizationId, dto);
  }

  @Patch(':id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR)
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.HR)
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.employeesService.remove(organizationId, id);
  }
}
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Users')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) { }

  @Get()
  @ApiOperation({ summary: 'Get all admin users' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Post('emergency-seed')
  @ApiOperation({ summary: 'Emergency seed for admin user' })
  async emergencySeed() {
    return this.service.create({
      email: 'admin@elektrik.com',
      password: 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from './dto/system-config.dto';

@ApiTags('System Configuration')
@Controller('admin/config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) { }

  @Post()
  @ApiOperation({ summary: 'Create a system configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created' })
  create(@Body() dto: CreateSystemConfigDto) {
    return this.configService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all configurations' })
  @ApiResponse({ status: 200, description: 'Return all configurations' })
  findAll() {
    return this.configService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiResponse({ status: 200, description: 'Return configuration details' })
  findOne(@Param('key') key: string) {
    return this.configService.findByKey(key);
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Update configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  update(@Param('key') key: string, @Body() dto: UpdateSystemConfigDto) {
    return this.configService.update(key, dto);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete configuration' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  remove(@Param('key') key: string) {
    return this.configService.remove(key);
  }
}

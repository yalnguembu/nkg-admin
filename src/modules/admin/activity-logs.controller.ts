import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Activity Logs')
@Controller('admin/activity-logs')
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) { }

  @Get()
  @ApiOperation({ summary: 'Get activity logs with filtering' })
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }
}

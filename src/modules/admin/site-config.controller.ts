import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { SiteConfigService } from './site-config.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Site Config')
@Controller('admin/site-config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) { }

  @Get()
  @ApiOperation({ summary: 'Get all site configurations' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':key')
  async findByKey(@Param('key') key: string) {
    return this.service.findByKey(key);
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() body: { value: any; updatedBy: string }) {
    return this.service.update(key, body.value, body.updatedBy);
  }
}

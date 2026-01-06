import { Controller, Get, Param } from '@nestjs/common';
import { InstallationPricingService } from './installation-pricing.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Installation Pricing')
@Controller('installation-pricing')
export class InstallationPricingController {
  constructor(private readonly installationPricingService: InstallationPricingService) { }

  @Get()
  @ApiOperation({ summary: 'Get all installation pricing' })
  findAll() {
    return this.installationPricingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get installation pricing details' })
  findOne(@Param('id') id: string) {
    return this.installationPricingService.findOne(id);
  }
}

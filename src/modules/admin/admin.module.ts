import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { SiteConfigService } from './site-config.service';
import { SiteConfigController } from './site-config.controller';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';

import { SystemConfigModule } from './system-config/system-config.module';

@Module({
  imports: [SystemConfigModule],
  controllers: [AdminUsersController, SiteConfigController, ActivityLogsController],
  providers: [AdminUsersService, SiteConfigService, ActivityLogsService],
  exports: [AdminUsersService, SiteConfigService, ActivityLogsService, SystemConfigModule],
})
export class AdminModule { }

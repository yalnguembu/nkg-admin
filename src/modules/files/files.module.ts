import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesController, StaticFilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaModule } from '../../database/prisma.module';

import { UPLOAD_DIR } from '../../config/storage.config';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [FilesController, StaticFilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule { }

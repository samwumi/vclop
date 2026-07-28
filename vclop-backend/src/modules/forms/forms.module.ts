import { Module } from '@nestjs/common';
import { FormTemplatesController } from './form-templates.controller';
import { FormTemplatesService } from './form-templates.service';
import { FormSubmissionsController } from './form-submissions.controller';
import { FormSubmissionsService } from './form-submissions.service';

@Module({
  controllers: [FormTemplatesController, FormSubmissionsController],
  providers: [FormTemplatesService, FormSubmissionsService],
  exports: [FormTemplatesService, FormSubmissionsService],
})
export class FormsModule {}

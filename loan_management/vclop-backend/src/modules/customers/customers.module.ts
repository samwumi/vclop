import { Module } from '@nestjs/common';
import { FormsModule } from '../forms/forms.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { DocumentTypesController } from './document-types.controller';
import { DocumentTypesService } from './document-types.service';
import { CustomerDocumentsController } from './customer-documents.controller';
import { CustomerDocumentsService } from './customer-documents.service';

@Module({
  imports: [FormsModule],
  controllers: [CustomersController, DocumentTypesController, CustomerDocumentsController],
  providers: [CustomersService, DocumentTypesService, CustomerDocumentsService],
  exports: [CustomersService, DocumentTypesService, CustomerDocumentsService],
})
export class CustomersModule {}

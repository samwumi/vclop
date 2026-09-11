import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { CustomerDocumentsService } from './customer-documents.service';
import { VerifyDocumentDto } from './dto/document-type.dto';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

@ApiTags('Customer Documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'customers/:customerId/documents', version: '1' })
export class CustomerDocumentsController {
  constructor(
    private readonly service: CustomerDocumentsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @RequirePermissions('documents:read')
  @ApiOperation({ summary: "List a customer's uploaded documents" })
  findAll(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.service.findAll(customerId);
  }

  @Post()
  @RequirePermissions('documents:upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document against a customer' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body('documentTypeId') documentTypeId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: RequestUser,
  ) {
    if (!file) throw new BusinessException('file is required');
    if (file.size > MAX_UPLOAD_BYTES) throw new BusinessException('File exceeds the 10MB upload limit');
    if (!documentTypeId) throw new BusinessException('documentTypeId is required');

    return ok(await this.service.upload(customerId, documentTypeId, file, actor.id), 'Document uploaded');
  }

  @Patch(':documentId/verify')
  @RequirePermissions('documents:verify')
  @ApiOperation({ summary: 'Verify or reject a single document (individual, not global, verification)' })
  async verify(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: VerifyDocumentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.verify(documentId, dto, actor.id), 'Document verification recorded');
  }

  @Delete(':documentId')
  @RequirePermissions('documents:delete')
  @ApiOperation({ summary: 'Delete an uploaded document' })
  async remove(@Param('documentId', ParseUUIDPipe) documentId: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(documentId, actor.id);
    return ok(null, 'Document deleted');
  }

  @Get(':documentId/download')
  @RequirePermissions('documents:read')
  @ApiOperation({ summary: 'Download a document file' })
  async download(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Res() res: Response,
  ) {
    // Get document record
    const document = await this.service.findOne(documentId, customerId);
    if (!document) {
      throw new ResourceNotFoundException('Document', documentId);
    }

    // Get upload directory from config
    const uploadDir = this.configService.get<string>('storage.local.uploadDir') ?? './uploads';
    const filePath = path.join(uploadDir, document.fileKey);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new ResourceNotFoundException('File', document.fileKey);
    }

    // Stream file to response
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}

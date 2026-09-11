import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CustomerType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { DocumentTypesService } from './document-types.service';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from './dto/document-type.dto';

@ApiTags('Document Checklist')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'document-types', version: '1' })
export class DocumentTypesController {
  constructor(private readonly service: DocumentTypesService) {}

  @Get()
  @RequirePermissions('documents:read')
  @ApiOperation({ summary: 'List configured document types (the checklist)' })
  @ApiQuery({ name: 'appliesTo', enum: CustomerType, required: false })
  @ApiQuery({ name: 'withInactive', required: false })
  findAll(@Query('appliesTo') appliesTo?: CustomerType, @Query('withInactive') withInactive?: string) {
    return this.service.findAll(appliesTo, withInactive === 'true');
  }

  @Get(':id')
  @RequirePermissions('documents:read')
  @ApiOperation({ summary: 'Get a document type' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('documents:manage_types')
  @ApiOperation({ summary: 'Create a document type in the checklist' })
  async create(@Body() dto: CreateDocumentTypeDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.create(dto, actor.id), 'Document type created');
  }

  @Patch(':id')
  @RequirePermissions('documents:manage_types')
  @ApiOperation({ summary: 'Update a document type' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentTypeDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.update(id, dto, actor.id), 'Document type updated');
  }

  @Delete(':id')
  @RequirePermissions('documents:manage_types')
  @ApiOperation({ summary: 'Delete a document type (blocked once documents reference it — deactivate instead)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Document type deleted');
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FormEntityType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { FormTemplatesService } from './form-templates.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateFormSectionDto, ReorderSectionsDto, UpdateFormSectionDto } from './dto/form-section.dto';
import { CreateFormFieldDto, MoveFieldsDto, UpdateFormFieldDto } from './dto/form-field.dto';
import { QueryFormTemplatesDto } from './dto/query-form-templates.dto';

@ApiTags('Form Engine — Templates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'forms/templates', version: '1' })
export class FormTemplatesController {
  constructor(private readonly service: FormTemplatesService) {}

  @Get()
  @RequirePermissions('forms:read')
  @ApiOperation({ summary: 'List form templates' })
  @ApiQuery({ name: 'entityType', enum: FormEntityType, required: false })
  findAll(@Query() query: QueryFormTemplatesDto) {
    return this.service.findAll(query);
  }

  @Get('default/:entityType')
  @RequirePermissions('forms:read')
  @ApiOperation({ summary: 'Get the active default template for an entity type (e.g. what the Customer registration screen renders)' })
  findDefault(@Param('entityType', new ParseEnumPipe(FormEntityType)) entityType: FormEntityType) {
    return this.service.findDefaultForEntityType(entityType);
  }

  @Get(':id')
  @RequirePermissions('forms:read')
  @ApiOperation({ summary: 'Get one form template with its sections and fields' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('forms:create')
  @ApiOperation({ summary: 'Create a new form template' })
  async create(@Body() dto: CreateFormTemplateDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.create(dto, actor.id), 'Form template created');
  }

  @Post(':id/clone')
  @RequirePermissions('forms:create')
  @ApiOperation({ summary: 'Clone a template under a new code (bumps version, preserves historical submissions on the original)' })
  async clone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('code') newCode: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.clone(id, newCode, actor.id), 'Form template cloned');
  }

  @Patch(':id')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Update a form template' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormTemplateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.update(id, dto, actor.id), 'Form template updated');
  }

  @Delete(':id')
  @RequirePermissions('forms:delete')
  @ApiOperation({ summary: 'Delete a form template (blocked once it has submissions — deactivate instead)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Form template deleted');
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  @Post(':id/sections')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Add a section to a template' })
  async addSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFormSectionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.addSection(id, dto, actor.id), 'Section added');
  }

  @Patch(':id/sections/:sectionId')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Rename/edit/deactivate a section' })
  async updateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: UpdateFormSectionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.updateSection(id, sectionId, dto, actor.id), 'Section updated');
  }

  @Delete(':id/sections/:sectionId')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Remove a section (soft — deactivates it, keeps historical data intact)' })
  async removeSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.removeSection(id, sectionId, actor.id), 'Section removed');
  }

  @Patch(':id/sections/reorder')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Reorder sections (drag-and-drop from the admin builder)' })
  async reorderSections(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderSectionsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.reorderSections(id, dto, actor.id), 'Sections reordered');
  }

  // ── Fields ───────────────────────────────────────────────────────────────

  @Post(':id/sections/:sectionId/fields')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Add a field to a section' })
  async addField(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: CreateFormFieldDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.addField(id, sectionId, dto, actor.id), 'Field added');
  }

  @Patch(':id/fields/:fieldId')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Edit a field' })
  async updateField(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: UpdateFormFieldDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.updateField(id, fieldId, dto, actor.id), 'Field updated');
  }

  @Delete(':id/fields/:fieldId')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Remove a field (soft — deactivates it, keeps historical submission values intact)' })
  async removeField(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.removeField(id, fieldId, actor.id), 'Field removed');
  }

  @Patch(':id/fields/move')
  @RequirePermissions('forms:update')
  @ApiOperation({ summary: 'Move fields between sections and/or reorder them' })
  async moveFields(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveFieldsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.moveFields(id, dto, actor.id), 'Fields moved');
  }
}

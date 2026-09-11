import { Body, Controller, Get, Param, ParseEnumPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormEntityType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { FormSubmissionsService } from './form-submissions.service';
import { SubmitFormDto } from './dto/submit-form.dto';

@ApiTags('Form Engine — Submissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'forms/submissions', version: '1' })
export class FormSubmissionsController {
  constructor(private readonly service: FormSubmissionsService) {}

  @Post()
  @RequirePermissions('forms:submit')
  @ApiOperation({ summary: 'Submit (or re-submit) values against a form template for a given entity' })
  async submit(@Body() dto: SubmitFormDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.submit(dto, actor.id), 'Form submitted');
  }

  @Get(':formTemplateId/:entityType/:entityId')
  @RequirePermissions('forms:read')
  @ApiOperation({ summary: 'Get captured values for an entity, keyed by field code (used to pre-fill a form)' })
  async findForEntity(
    @Param('formTemplateId') formTemplateId: string,
    @Param('entityType', new ParseEnumPipe(FormEntityType)) entityType: FormEntityType,
    @Param('entityId') entityId: string,
  ) {
    return ok(await this.service.findForEntity(formTemplateId, entityType, entityId), 'Submission loaded');
  }
}

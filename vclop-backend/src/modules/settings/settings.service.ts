import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { Setting, SettingScope, SettingType, AuditAction } from '@prisma/client';
import { CreateSettingDto } from './dto/create-setting.dto';
import { BulkUpdateSettingsDto, UpdateSettingDto } from './dto/update-setting.dto';
import {
  ResourceNotFoundException,
  ResourceAlreadyExistsException,
  BusinessException,
  ForbiddenActionException,
} from '../../common/exceptions/app.exceptions';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  // In-memory cache to avoid hammering DB for every request that reads settings
  private cache = new Map<string, string | null>();
  private cacheExpiry = 0;
  private readonly CACHE_TTL_MS = 30_000; // 30 seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ────────────────────────────────────────────────────────────────────────────

  /** Return all public settings (no auth required — used by frontend on init) */
  async getPublicSettings(): Promise<Record<string, string | null>> {
    const settings = await this.prisma.setting.findMany({
      where: { isPublic: true, scope: SettingScope.SYSTEM },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    });
    return this.toKeyValueMap(settings);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SYSTEM SETTINGS
  // ────────────────────────────────────────────────────────────────────────────

  async getSystemSettings(group?: string): Promise<Record<string, Setting[]>> {
    const settings = await this.prisma.setting.findMany({
      where: {
        scope: SettingScope.SYSTEM,
        ...(group && { group }),
      },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    });

    return settings.reduce<Record<string, Setting[]>>((acc, s) => {
      if (!acc[s.group]) acc[s.group] = [];
      acc[s.group].push(s);
      return acc;
    }, {});
  }

  async getSystemSettingGroups(): Promise<string[]> {
    const result = await this.prisma.setting.findMany({
      where: { scope: SettingScope.SYSTEM },
      select: { group: true },
      distinct: ['group'],
      orderBy: { group: 'asc' },
    });
    return result.map((r) => r.group);
  }

  async getByKey(key: string, scope = SettingScope.SYSTEM, branchId?: string): Promise<Setting> {
    const setting = await this.prisma.setting.findFirst({
      where: { key, scope, branchId: branchId ?? null },
    });
    if (!setting) throw new ResourceNotFoundException('Setting', key);
    return setting;
  }

  async getValue(key: string, defaultValue?: string): Promise<string | null> {
    // Check in-memory cache first
    if (Date.now() < this.cacheExpiry && this.cache.has(key)) {
      return this.cache.get(key) ?? defaultValue ?? null;
    }

    const setting = await this.prisma.setting.findFirst({
      where: { key, scope: SettingScope.SYSTEM },
    });

    const value = setting?.value ?? setting?.defaultValue ?? defaultValue ?? null;
    this.cache.set(key, value);
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

    return value;
  }

  async getValueAsNumber(key: string, defaultValue = 0): Promise<number> {
    const value = await this.getValue(key);
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  async getValueAsBoolean(key: string, defaultValue = false): Promise<boolean> {
    const value = await this.getValue(key);
    if (value === null) return defaultValue;
    return value === 'true' || value === '1' || value === 'yes';
  }

  async updateByKey(
    key: string,
    dto: UpdateSettingDto,
    updatedById: string,
    scope = SettingScope.SYSTEM,
    branchId?: string,
  ): Promise<Setting> {
    const setting = await this.prisma.setting.findFirst({
      where: { key, scope, branchId: branchId ?? null },
    });

    if (!setting) throw new ResourceNotFoundException('Setting', key);
    if (setting.isReadonly) throw new ForbiddenActionException(`Setting '${key}' is read-only`);

    const newValue = dto.value === null ? setting.defaultValue : (dto.value ?? null);

    await this.validateSettingValue(setting, newValue);

    const updated = await this.prisma.setting.update({
      where: { id: setting.id },
      data: { value: newValue, updatedById },
    });

    // Invalidate cache
    this.cache.delete(key);

    this.events.emit('audit.log', {
      userId: updatedById,
      action: AuditAction.UPDATE,
      module: 'settings',
      entityId: setting.id,
      entityType: 'Setting',
      description: `Updated setting: ${key}`,
      oldValues: { key, value: setting.value },
      newValues: { key, value: newValue },
      isSuccess: true,
    });

    return updated;
  }

  async bulkUpdate(dto: BulkUpdateSettingsDto, updatedById: string): Promise<void> {
    for (const item of dto.settings) {
      await this.updateByKey(item.key, { value: item.value }, updatedById);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // BRANCH SETTINGS
  // ────────────────────────────────────────────────────────────────────────────

  async getBranchSettings(branchId: string): Promise<Record<string, Setting[]>> {
    const settings = await this.prisma.setting.findMany({
      where: { scope: SettingScope.BRANCH, branchId },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    });

    return settings.reduce<Record<string, Setting[]>>((acc, s) => {
      if (!acc[s.group]) acc[s.group] = [];
      acc[s.group].push(s);
      return acc;
    }, {});
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN — CREATE / DELETE (custom settings)
  // ────────────────────────────────────────────────────────────────────────────

  async create(dto: CreateSettingDto, createdById: string): Promise<Setting> {
    if (dto.scope === SettingScope.BRANCH && !dto.branchId) {
      throw new BusinessException('branchId is required for BRANCH scope settings');
    }

    const existing = await this.prisma.setting.findFirst({
      where: { key: dto.key, scope: dto.scope, branchId: dto.branchId ?? null },
    });
    if (existing) throw new ResourceAlreadyExistsException('Setting', 'key', dto.key);

    const setting = await this.prisma.setting.create({
      data: {
        key: dto.key.toLowerCase(),
        value: dto.value ?? null,
        defaultValue: dto.value ?? null,
        type: dto.type,
        scope: dto.scope,
        branchId: dto.branchId,
        label: dto.label,
        description: dto.description,
        group: dto.group,
        isPublic: dto.isPublic ?? false,
        isReadonly: dto.isReadonly ?? false,
        isEncrypted: dto.isEncrypted ?? false,
        updatedById: createdById,
      },
    });

    this.events.emit('audit.log', {
      userId: createdById, action: AuditAction.CREATE, module: 'settings',
      entityId: setting.id, entityType: 'Setting',
      description: `Created setting: ${setting.key}`, isSuccess: true,
    });

    return setting;
  }

  async delete(id: string, deletedById: string): Promise<void> {
    const setting = await this.prisma.setting.findUnique({ where: { id } });
    if (!setting) throw new ResourceNotFoundException('Setting', id);

    if (setting.isReadonly) {
      throw new ForbiddenActionException('System read-only settings cannot be deleted');
    }

    await this.prisma.setting.delete({ where: { id } });
    this.cache.delete(setting.key);

    this.events.emit('audit.log', {
      userId: deletedById, action: AuditAction.DELETE, module: 'settings',
      entityId: id, entityType: 'Setting',
      description: `Deleted setting: ${setting.key}`, isSuccess: true,
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // VALIDATION
  // ────────────────────────────────────────────────────────────────────────────

  private async validateSettingValue(setting: Setting, value: string | null): Promise<void> {
    if (value === null) return;

    switch (setting.type) {
      case SettingType.NUMBER: {
        if (isNaN(Number(value))) throw new BusinessException(`Setting '${setting.key}' must be a number`);
        break;
      }
      case SettingType.BOOLEAN: {
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
          throw new BusinessException(`Setting '${setting.key}' must be a boolean (true/false)`);
        }
        break;
      }
      case SettingType.EMAIL: {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) throw new BusinessException(`Setting '${setting.key}' must be a valid email`);
        break;
      }
      case SettingType.URL: {
        try { new URL(value); } catch {
          if (value) throw new BusinessException(`Setting '${setting.key}' must be a valid URL`);
        }
        break;
      }
      case SettingType.JSON: {
        try { JSON.parse(value); } catch {
          throw new BusinessException(`Setting '${setting.key}' must be valid JSON`);
        }
        break;
      }
    }

    // Apply custom validation rules if defined
    if (setting.validationRules) {
      const rules = setting.validationRules as { min?: number; max?: number; pattern?: string };
      if (rules.min !== undefined && Number(value) < rules.min) {
        throw new BusinessException(`Setting '${setting.key}' must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && Number(value) > rules.max) {
        throw new BusinessException(`Setting '${setting.key}' must be at most ${rules.max}`);
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        throw new BusinessException(`Setting '${setting.key}' does not match required pattern`);
      }
    }
  }

  private toKeyValueMap(settings: Setting[]): Record<string, string | null> {
    return settings.reduce<Record<string, string | null>>((acc, s) => {
      acc[s.key] = s.value ?? s.defaultValue ?? null;
      return acc;
    }, {});
  }
}

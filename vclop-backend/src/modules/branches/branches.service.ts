import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import {
  ResourceNotFoundException,
  ResourceAlreadyExistsException,
  BusinessException,
} from '../../common/exceptions/app.exceptions';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /** Minimal list for dropdowns — only id, code, name of active non-HQ branches */
  async listLocations(): Promise<Array<{ id: string; code: string; name: string }>> {
    return this.prisma.branch.findMany({
      where: { deletedAt: null, isActive: true, isHeadOffice: false },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(query: PaginationDto & { withInactive?: boolean }): Promise<PaginatedResult<unknown>> {
    const where = {
      deletedAt: null,
      ...(!query.withInactive && { isActive: true }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { code: { contains: query.search } },
          { city: { contains: query.search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where,
        include: { _count: { select: { users: true } } },
        orderBy: [{ isHeadOffice: 'desc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  async findOne(id: string): Promise<unknown> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { users: true } },
        settings: { where: { scope: 'BRANCH' }, select: { key: true, value: true, label: true } },
      },
    });
    if (!branch) throw new ResourceNotFoundException('Branch', id);
    return branch;
  }

  async create(dto: CreateBranchDto, createdById: string): Promise<unknown> {
    const existing = await this.prisma.branch.findFirst({
      where: { code: dto.code.toUpperCase(), deletedAt: null },
    });
    if (existing) throw new ResourceAlreadyExistsException('Branch', 'code', dto.code);

    // Only one head office allowed
    if (dto.isHeadOffice) {
      await this.prisma.branch.updateMany({
        where: { isHeadOffice: true },
        data: { isHeadOffice: false },
      });
    }

    const branch = await this.prisma.branch.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country ?? 'Philippines',
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        email: dto.email,
        managerName: dto.managerName,
        isHeadOffice: dto.isHeadOffice ?? false,
        isActive: true,
      },
    });

    this.events.emit('audit.log', {
      userId: createdById, action: AuditAction.CREATE, module: 'branches',
      entityId: branch.id, entityType: 'Branch',
      description: `Created branch ${branch.code}`, isSuccess: true,
    });

    return this.findOne(branch.id);
  }

  async update(id: string, dto: UpdateBranchDto, updatedById: string): Promise<unknown> {
    await this.assertExists(id);

    const updated = await this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.country && { country: dto.country }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.managerName !== undefined && { managerName: dto.managerName }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.events.emit('audit.log', {
      userId: updatedById, action: AuditAction.UPDATE, module: 'branches',
      entityId: id, entityType: 'Branch',
      description: `Updated branch ${updated.code}`, newValues: dto, isSuccess: true,
    });

    return this.findOne(id);
  }

  async remove(id: string, deletedById: string): Promise<void> {
    const branch = await this.assertExists(id);

    if (branch.isHeadOffice) {
      throw new BusinessException('The head office branch cannot be deleted');
    }

    const userCount = await this.prisma.user.count({ where: { branchId: id, deletedAt: null } });
    if (userCount > 0) {
      throw new BusinessException(`Cannot delete — ${userCount} user(s) are assigned to this branch`);
    }

    await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.events.emit('audit.log', {
      userId: deletedById, action: AuditAction.DELETE, module: 'branches',
      entityId: id, entityType: 'Branch', description: `Deleted branch ${branch.code}`, isSuccess: true,
    });
  }

  private async assertExists(id: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id, deletedAt: null } });
    if (!branch) throw new ResourceNotFoundException('Branch', id);
    return branch;
  }
}

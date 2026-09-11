import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import {
  ResourceNotFoundException,
  ResourceAlreadyExistsException,
  BusinessException,
} from '../../common/exceptions/app.exceptions';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: PaginationDto & { withInactive?: boolean }): Promise<PaginatedResult<unknown>> {
    const where = {
      deletedAt: null,
      ...(!query.withInactive && { isActive: true }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { code: { contains: query.search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        include: {
          parent: { select: { id: true, name: true, code: true } },
          children: { where: { deletedAt: null, isActive: true }, select: { id: true, name: true, code: true } },
          _count: { select: { users: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.department.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  async findTree(): Promise<unknown[]> {
    const all = await this.prisma.department.findMany({
      where: { deletedAt: null, isActive: true },
      include: { children: { where: { deletedAt: null, isActive: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return all.filter((d) => !d.parentId);
  }

  async findOne(id: string): Promise<unknown> {
    const dept = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, code: true } },
        children: { where: { deletedAt: null }, select: { id: true, name: true, code: true } },
        _count: { select: { users: true } },
      },
    });
    if (!dept) throw new ResourceNotFoundException('Department', id);
    return dept;
  }

  async create(dto: CreateDepartmentDto, createdById: string): Promise<unknown> {
    const existing = await this.prisma.department.findFirst({
      where: { code: dto.code.toUpperCase(), deletedAt: null },
    });
    if (existing) throw new ResourceAlreadyExistsException('Department', 'code', dto.code);

    if (dto.parentId) {
      const parent = await this.prisma.department.findFirst({ where: { id: dto.parentId, deletedAt: null } });
      if (!parent) throw new ResourceNotFoundException('Parent department', dto.parentId);
    }

    const dept = await this.prisma.department.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });

    this.events.emit('audit.log', {
      userId: createdById, action: AuditAction.CREATE, module: 'departments',
      entityId: dept.id, entityType: 'Department',
      description: `Created department ${dept.code}`, isSuccess: true,
    });

    return this.findOne(dept.id);
  }

  async update(id: string, dto: UpdateDepartmentDto, updatedById: string): Promise<unknown> {
    await this.assertExists(id);

    // Prevent circular parentage
    if (dto.parentId) {
      if (dto.parentId === id) throw new BusinessException('A department cannot be its own parent');
      const isCircular = await this.checkCircularParent(id, dto.parentId);
      if (isCircular) throw new BusinessException('Circular department hierarchy detected');
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    this.events.emit('audit.log', {
      userId: updatedById, action: AuditAction.UPDATE, module: 'departments',
      entityId: id, entityType: 'Department',
      description: `Updated department ${updated.code}`, newValues: dto, isSuccess: true,
    });

    return this.findOne(id);
  }

  async remove(id: string, deletedById: string): Promise<void> {
    const dept = await this.assertExists(id);

    const userCount = await this.prisma.user.count({ where: { departmentId: id, deletedAt: null } });
    if (userCount > 0) {
      throw new BusinessException(`Cannot delete — ${userCount} user(s) are assigned to this department`);
    }

    const childCount = await this.prisma.department.count({ where: { parentId: id, deletedAt: null } });
    if (childCount > 0) {
      throw new BusinessException(`Cannot delete — ${childCount} sub-department(s) exist. Remove them first.`);
    }

    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.events.emit('audit.log', {
      userId: deletedById, action: AuditAction.DELETE, module: 'departments',
      entityId: id, entityType: 'Department', description: `Deleted department ${dept.code}`, isSuccess: true,
    });
  }

  private async assertExists(id: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, deletedAt: null } });
    if (!dept) throw new ResourceNotFoundException('Department', id);
    return dept;
  }

  private async checkCircularParent(id: string, newParentId: string): Promise<boolean> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();
    while (currentId) {
      if (currentId === id) return true;
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const dept = await this.prisma.department.findUnique({ where: { id: currentId }, select: { parentId: true } }) as { parentId?: string | null } | null;
      currentId = dept?.parentId ?? null;
    }
    return false;
  }
}

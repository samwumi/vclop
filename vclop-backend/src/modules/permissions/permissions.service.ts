import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Permission, PermissionCategory } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto & { category?: PermissionCategory; module?: string }): Promise<PaginatedResult<Permission>> {
    const where = {
      ...(query.category && { category: query.category }),
      ...(query.module && { module: query.module }),
      ...(query.search && {
        OR: [
          { code: { contains: query.search } },
          { name: { contains: query.search } },
        ],
      }),
      isActive: true,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder }
          : [{ category: 'asc' }, { sortOrder: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.permission.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  async findAllGrouped(): Promise<Record<string, Permission[]>> {
    const permissions = await this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
      const key = perm.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    }, {});
  }

  async findByModule(module: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { module, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findModules(): Promise<string[]> {
    const result = await this.prisma.permission.findMany({
      where: { isActive: true },
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });
    return result.map((r) => r.module);
  }
}

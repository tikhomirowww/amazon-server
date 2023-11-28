import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  returnProductObject,
  returnProductObjectFullest,
} from './return-product.object';
import { ProductDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';
import { generateSlug } from 'src/utils/generate-slug';
import { EnumProductSort, GetAllProductsDto } from './dto/get-all.product.dto';
import { PaginationService } from 'src/pagination/pagination.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async getAll(dto: GetAllProductsDto = {}) {
    const { searchTerm, sort } = dto;

    const prismaSort: Prisma.ProductOrderByWithRelationInput[] = [];

    if (sort === EnumProductSort.LOW_PRICE) {
      prismaSort.push({ price: 'asc' });
    } else if (sort === EnumProductSort.HIGH_PRICE) {
      prismaSort.push({ price: 'desc' });
    } else if (sort === EnumProductSort.OLDEST) {
      prismaSort.push({ createdAt: 'asc' });
    } else {
      prismaSort.push({ createdAt: 'desc' });
    }

    const prismaSearchTermFilter: Prisma.ProductWhereInput = searchTerm
      ? {
          OR: [
            {
              category: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const { perPage, skip } = this.paginationService.getPagination(dto);

    const products = await this.prisma.product.findMany({
      where: prismaSearchTermFilter,
      orderBy: prismaSort,
      skip,
      take: perPage,
    });

    return {
      products,
      length: await this.prisma.product.count({
        where: prismaSearchTermFilter,
      }),
    };
  }

  async byId(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
      select: returnProductObjectFullest,
    });

    if (!product) throw new NotFoundException('product not found');

    return product;
  }

  async bySlug(slug: string) {
    const category = await this.prisma.product.findUnique({
      where: {
        slug,
      },
      select: returnProductObjectFullest,
    });

    if (!category) throw new NotFoundException('category not found');

    return category;
  }

  async byCategory(categorySlug: string) {
    const category = await this.prisma.product.findMany({
      where: {
        category: {
          slug: categorySlug,
        },
      },
      select: returnProductObjectFullest,
    });

    if (!category || category.length === 0)
      throw new NotFoundException('category not found');

    return category;
  }

  async getSimilar(id: number) {
    const currentProduct = await this.byId(id);
    if (!currentProduct)
      throw new NotFoundException('Current product not found');

    const products = await this.prisma.product.findMany({
      where: {
        category: {
          name: currentProduct.category.name,
        },
        NOT: {
          id: currentProduct.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: returnProductObject,
    });

    return products;
  }

  async create() {
    const product = await this.prisma.product.create({
      data: {
        description: '',
        name: '',
        price: 0,
        slug: '',
      } as Prisma.ProductCreateInput,
    });

    return product.id;
  }

  async update(id: number, dto: ProductDto) {
    const { description, images, price, name, categoryId } = dto;

    return this.prisma.category.update({
      where: {
        id,
      },
      data: {
        description,
        images,
        price,
        name,
        slug: generateSlug(name.toString()),
        category: {
          connect: {
            id: categoryId,
          },
        },
      } as Prisma.ProductUpdateInput,
    });
  }

  async delete(id: number) {
    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }
}

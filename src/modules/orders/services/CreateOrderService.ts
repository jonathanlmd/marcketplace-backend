import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const findProducts = await this.productsRepository.findAllById(
      products.map(product => {
        return { id: product.id };
      }),
    );

    if (findProducts.length !== products.length) {
      throw new AppError('Some product was not found');
    }

    const updatedQuantities: IUpdateProductsQuantityDTO[] = [];
    const productsWithPrice = products.map(product => {
      const finded = findProducts.filter(
        findProduct => findProduct.id === product.id,
      );
      const { price } = finded[0];
      const quantity = finded[0].quantity - product.quantity;

      if (quantity < 0) {
        throw new AppError(
          `Product insufficient quantity of product ${finded[0].name}`,
        );
      }

      updatedQuantities.push({
        id: product.id,
        quantity,
      });
      return {
        product_id: product.id,
        quantity: product.quantity,
        price,
      };
    });

    await this.productsRepository.updateQuantity(updatedQuantities);

    const order = await this.ordersRepository.create({
      customer,
      products: productsWithPrice,
    });

    return order;
  }
}

export default CreateProductService;

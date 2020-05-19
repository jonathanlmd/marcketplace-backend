import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import AppError from '@shared/errors/AppError';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order_products = products.map(({ product_id, price, quantity }) => {
      const orderProduct = new OrdersProducts();
      Object.assign(orderProduct, {
        product_id,
        price,
        quantity,
      });
      return orderProduct;
    });
    const order = this.ormRepository.create({
      customer,
      order_products,
    });
    await this.ormRepository.save(order);
    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const findOrder = await this.ormRepository.findOne(id);
    return findOrder;
  }
}

export default OrdersRepository;

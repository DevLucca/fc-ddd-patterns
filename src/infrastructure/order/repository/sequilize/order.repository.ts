import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total(),
      },
      {
        where: {
          id: entity.id,
        },
      },
    );

    entity.items.forEach(async (item) => {
      await OrderItemModel.upsert(
        {
          id: item.id,
          name: item.name,
          price: item.price,
          order_id: entity.id,
          product_id: item.productId,
          quantity: item.quantity,
        },
      );

    });
  }

  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        include: ["items"],
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error("Customer not found");
    }

    const order = new Order(id, orderModel.customer_id, 
      orderModel.items.map((item) => {
        let ordemItem = new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity)
        return ordemItem
      })
    );

    return order;
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({ include: ["items"] });

    const orders = orderModels.map((orderModel) => {
      let order = new Order(orderModel.id, orderModel.customer_id, orderModel.items.map((orderItemModel) => {
        let item = new OrderItem(orderItemModel.id, orderItemModel.name, orderItemModel.price, orderItemModel.product_id, orderItemModel.quantity)
        return item
      }));
      return order;
    })
    return orders;
  }
}

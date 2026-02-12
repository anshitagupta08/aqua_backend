const { Request, Response, NextFunction } = require('express');
const { Op } = require('sequelize');
const { Order, OrderItem, Product, Customer } = require('../../models');

exports.getAllOrders = async (req, res, next) => {
  try {
    const { orderId, customerId, customerPhoneNo } = req.query;

    const where = {};

    // Filter by orderId
    if (orderId) {
      where.id = Number(orderId);
    }

    // Filter by customerId
    if (customerId) {
      where.customerId = Number(customerId);
    }

    // If phone is provided, find customer first
    if (customerPhoneNo && !customerId) {
      const customer = await Customer.findOne({
        where: { phone: customerPhoneNo },
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer with the given phone number not found',
        });
      }

      where.customerId = customer.id;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Customer,
          attributes: ['name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price'],
            },
          ],
        },
      ],
      order: [['orderedAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Customer,
          attributes: ['name', 'email', 'phone', 'address'],
        },
        {
          model: OrderItem,
          attributes: ['id', 'productId', 'quantity', 'price'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'description', 'price'],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const { Request, Response, NextFunction } = require('express');
const { Op } = require('sequelize');
const { Order, OrderItem, Product, Customer } = require('../../models');

exports.getAllOrderItems = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const orderId = req.query.orderId;
    const productId = req.query.productId;

    const where = {};
    if (orderId) where.orderId = orderId;
    if (productId) where.productId = productId;

    const { count, rows } = await OrderItem.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'description', 'price'],
        },
        {
          model: Order,
          attributes: ['id', 'customerId', 'orderedAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        orderItems: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

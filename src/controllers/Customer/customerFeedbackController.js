const { Request, Response } = require('express');
const { Customer, Order, CustomerFeedback, OrderItem, Product } = require('../../models');

// get customer remark
exports.getCustomerFeedback = async (req, res) => {
  try {
    const { customerPhoneNo, customerId, orderId, status, formtype } = req.query;

    // Validate input
    if (!customerPhoneNo && !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Either customerPhoneNo or customerId is required',
      });
    }

    // Fetch customer
    let customer;

    if (customerId) {
      customer = await Customer.findByPk(Number(customerId));
    } else {
      const customerPhone = Array.isArray(customerPhoneNo) ? customerPhoneNo[0] : customerPhoneNo;

      customer = await Customer.findOne({ where: { phone: customerPhone } });
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Parse orderId safely
    const orderIdNumber = orderId ? Number(orderId) : undefined;

    // Build feedback filter
    const feedbackWhere = {
      ...(formtype ? { formtype: formtype } : {}),
      ...(status && formtype === 'complaint' ? { status: status } : {}),
    };

    // Fetch orders and feedbacks
    const orders = await Order.findAll({
      where: {
        customerId: customer.id,
        ...(orderIdNumber ? { id: orderIdNumber } : {}),
      },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price', 'isActive'],
            },
          ],
        },
        {
          model: CustomerFeedback,
          as: 'feedbacks',
          where: Object.keys(feedbackWhere).length ? feedbackWhere : undefined,
          required: false,
        },
      ],
      order: [['orderedAt', 'DESC']],
    });

    const responseData = {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      orders: orders.map((order) => ({
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        orderedAt: order.orderedAt,
        items:
          order.OrderItems?.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: item.Product,
          })) || [],
        feedbacks:
          order.feedbacks?.map((feedback) => ({
            id: feedback.id,
            formtype: feedback.formtype,
            description: feedback.description,
            ...(feedback.formtype === 'complaint' && {
              subject: feedback.subject,
              status: feedback.status,
              followUpDate: feedback.followUpDate,
            }),
            createdAt: feedback.createdAt,
          })) || [],
      })),
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching customer feedback:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.createCustomerFeedback = async (req, res) => {
  try {
    const {
      customerId,
      orderId,
      formtype, // "feedback" or "complaint"
      description,
      subject, // Required for complaints
      status, // Required for complaints: "open" or "closed"
      followUpDate, // Optional, but recommended for complaints
    } = req.body;

    // Validate base fields
    if (!customerId || !orderId || !formtype || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, orderId, formtype, description',
      });
    }

    if (!['feedback', 'complaint'].includes(formtype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid formtype. Must be "feedback" or "complaint"',
      });
    }

    // Complaint-specific validation
    if (formtype === 'complaint') {
      if (!subject || typeof subject !== 'string' || !subject.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Complaints must include a non-empty subject',
        });
      }

      if (!status || !['open', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Complaints must include a valid status ("open" or "closed")',
        });
      }

      if (followUpDate && isNaN(Date.parse(followUpDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid followUpDate format',
        });
      }
    }

    // Check customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Check order exists and belongs to customer
    const order = await Order.findOne({
      where: { id: orderId, customerId },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for this customer' });
    }

    // Create entry
    const newFeedback = await CustomerFeedback.create({
      customerId,
      orderId,
      formtype,
      description,
      subject: formtype === 'complaint' ? subject : null,
      status: formtype === 'complaint' ? status : null,
      followUpDate: formtype === 'complaint' ? followUpDate : null,
    });

    // Clean response object
    const responseData = {
      id: newFeedback.id,
      customerId: newFeedback.customerId,
      orderId: newFeedback.orderId,
      formtype: newFeedback.formtype,
      description: newFeedback.description,
      createdAt: newFeedback.createdAt,
    };

    if (formtype === 'complaint') {
      responseData.subject = newFeedback.subject;
      responseData.status = newFeedback.status;
      responseData.followUpDate = newFeedback.followUpDate;
    }

    return res.status(201).json({
      success: true,
      message: 'Customer feedback submitted successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('Error creating customer feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

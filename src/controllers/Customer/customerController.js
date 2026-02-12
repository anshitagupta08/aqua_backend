const { AppError } = require('../../utils/AppError');
const { Customer, Order, OrderItem, Product } = require('../../models');
const { Op, literal } = require('sequelize');

// exports.customers = async (req, res, next) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
//     const search = req.query.search || '';
//     const isActive =
//       req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

//     const where = {};

//     if (search) {
//       where[Op.or] = [
//         { name: { [Op.like]: `%${search}%` } },
//         { email: { [Op.like]: `%${search}%` } },
//         { phone: { [Op.like]: `%${search}%` } },
//       ];
//     }

//     if (isActive !== undefined) {
//       where.isActive = isActive;
//     }

//     const { count, rows } = await Customer.findAndCountAll({
//       where,
//       offset,
//       limit,
//       attributes: {
//         include: [
//           [
//             literal(`(
//               SELECT COUNT(*) FROM Orders WHERE Orders.customerId = Customer.id
//             )`),
//             'totalOrders',
//           ],
//           [
//             literal(`(
//               SELECT IFNULL(SUM(totalAmount), 0) FROM Orders WHERE Orders.customerId = Customer.id
//             )`),
//             'totalSpent',
//           ],
//         ],
//       },
//       order: [['createdAt', 'DESC']],
//     });

//     const totalPages = Math.ceil(count / limit);

//     res.status(200).json({
//       success: true,
//       data: {
//         customers: rows,
//         pagination: {
//           total: count,
//           page,
//           limit,
//           pages: totalPages,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.customers = async (req, res, next) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
//     const search = req.query.search || '';
//     const isActive =
//       req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

//     const where = {};

//     if (search) {
//       where[Op.or] = [
//         { name: { [Op.like]: `%${search}%` } },
//         { email: { [Op.like]: `%${search}%` } },
//         { phone: { [Op.eq]: `%${search}%` } },
//       ];
//     }

//     if (isActive !== undefined) {
//       where.isActive = isActive;
//     }

//     const { count, rows } = await Customer.findAndCountAll({
//       where,
//       offset,
//       limit,
//       order: [['createdAt', 'DESC']],
//     });

//     const totalPages = Math.ceil(count / limit);

//     res.status(200).json({
//       success: true,
//       data: {
//         customers: rows,
//         pagination: {
//           total: count,
//           page,
//           limit,
//           pages: totalPages,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.customers = async (req, res, next) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
//     const { search, name, email, phone, isActive } = req.query;

//     const where = {};

//     // Name filter
//     if (name) {
//       where.name = { [Op.like]: `%${name}%` };
//     }

//     // Email filter
//     if (email) {
//       where.email = { [Op.like]: `%${email}%` };
//     }

//     // Phone filter (ambiguous: 10 or 11 digits with leading 0)
//     if (phone) {
//       // Remove non-digits
//       const cleanedPhone = phone.replace(/\D/g, '');
//       // Match either the cleaned phone or with a leading zero
//       where[Op.or] = [{ phone: cleanedPhone }, { phone: '0' + cleanedPhone }];
//     }

//     // Search filter (matches name, email, or phone)
//     if (search) {
//       const cleanedSearchPhone = search.replace(/\D/g, '');
//       where[Op.or] = [
//         { name: { [Op.like]: `%${search}%` } },
//         { email: { [Op.like]: `%${search}%` } },
//         { phone: { [Op.like]: `%${search}%` } },
//         ...(cleanedSearchPhone
//           ? [{ phone: cleanedSearchPhone }, { phone: '0' + cleanedSearchPhone }]
//           : []),
//       ];
//     }

//     // isActive filter
//     if (isActive !== undefined) {
//       where.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
//     }

//     const { count, rows } = await Customer.findAndCountAll({
//       where,
//       offset,
//       limit,
//       order: [['createdAt', 'DESC']],
//     });

//     const totalPages = Math.ceil(count / limit);

//     res.status(200).json({
//       success: true,
//       data: {
//         customers: rows,
//         pagination: {
//           total: count,
//           page,
//           limit,
//           pages: totalPages,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

exports.customers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, name, email, phone, isActive } = req.query;

    const where = {};

    // ------------------------------
    // FILTERS
    // ------------------------------

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (email) {
      where.email = { [Op.like]: `%${email}%` };
    }

    if (phone) {
      const cleanedPhone = phone.replace(/\D/g, "");
      where[Op.or] = [{ phone: cleanedPhone }, { phone: "0" + cleanedPhone }];
    }

    if (search) {
      const cleanedSearchPhone = search.replace(/\D/g, "");
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        ...(cleanedSearchPhone
          ? [{ phone: cleanedSearchPhone }, { phone: "0" + cleanedSearchPhone }]
          : []),
      ];
    }

    if (isActive !== undefined) {
      where.isActive =
        isActive === "true" ? true : isActive === "false" ? false : undefined;
    }



    // Only do API sync if user is searching by exact phone number
    if (phone) {
      const cleanedPhone = phone.replace(/\D/g, "");
      const possiblePhones = [cleanedPhone, "0" + cleanedPhone];

      // Check if exists locally
      const localCustomer = await Customer.findOne({
        where: {
          phone: { [Op.in]: possiblePhones },
        },
      });

      if (!localCustomer) {
        console.log("📡 Customer NOT found locally → fetching from external API…");

        try {
          // 👇 Call your existing central DB service
          const externalData = await getExternalCustomer(cleanedPhone);

          if (externalData) {
            console.log("✅ External customer found → inserting into DB");

            await Customer.create({
              name: externalData.name || null,
              email: externalData.email || null,
              phone: externalData.phone || cleanedPhone,
              address: externalData.address || null,
              city: externalData.city || null,
              state: externalData.state || null,
              pincode: externalData.pincode || null,
              isActive: true,
            });
          }
        } catch (err) {
          console.log("⚠️ External API error (ignored):", err.message);
        }
      }
    }

    // -------------------------------------------
    // Fetch from DB (includes new inserted record)
    // -------------------------------------------

    const { count, rows } = await Customer.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        customers: rows,
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


exports.checkCustomerByPhone = async (req, res, next) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      throw new AppError('Phone number is required');
    }

    // Clean the phone number
    const cleanedPhone = phone.replace(/\D/g, '');
    console.log(`[DEBUG] Checking customer existence for phone: ${cleanedPhone}`);

    // Search for customer by exact phone match
    const customer = await Customer.findOne({
      where: {
        phone: cleanedPhone,
      },
      attributes: ['id', 'name', 'email', 'phone', 'address'],
    });

    if (customer) {
      console.log(`[DEBUG] Customer found:`, {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      });

      return res.status(200).json({
        success: true,
        message: 'Customer found',
        data: customer,
        exists: true,
      });
    } else {
      console.log(`[DEBUG] No customer found with phone: ${cleanedPhone}`);

      return res.status(200).json({
        success: true,
        message: 'No customer found with this phone number',
        data: null,
        exists: false,
      });
    }
  } catch (error) {
    console.error(`[ERROR] Error checking customer by phone:`, error);
    next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findByPk(customerId, {
      attributes: {
        include: [
          [
            literal(`(
              SELECT COUNT(*) FROM Orders WHERE Orders.customerId = Customer.id
            )`),
            'totalOrders',
          ],
          [
            literal(`(
              SELECT IFNULL(SUM(totalAmount), 0) FROM Orders WHERE Orders.customerId = Customer.id
            )`),
            'totalSpent',
          ],
        ],
      },
      include: [
        {
          model: Order,
          include: [
            {
              model: OrderItem,
              attributes: ['productId', 'quantity', 'price'],
            },
          ],
          order: [['orderedAt', 'DESC']],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    const orders = await Order.findAll({
      where: { customerId },
      include: [
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

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerStats = async (req, res, next) => {
  try {
    const [results] = await Customer.sequelize?.query(`
      SELECT 
        COUNT(*) AS totalCustomers,
        SUM(CASE WHEN isActive THEN 1 ELSE 0 END) AS activeCustomers,
        SUM(CASE WHEN isActive = FALSE THEN 1 ELSE 0 END) AS inactiveCustomers,
        (SELECT COUNT(*) FROM Orders) AS totalOrders,
        (SELECT IFNULL(SUM(totalAmount), 0) FROM Orders) AS totalRevenue,
        (SELECT IFNULL(AVG(totalAmount), 0) FROM Orders) AS avgOrderValue
      FROM Customers;
    `);

    res.status(200).json({ success: true, data: results[0] });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [summary] = await Customer.sequelize?.query(`
      SELECT
        (SELECT COUNT(*) FROM Customers) AS totalCustomers,
        (SELECT COUNT(*) FROM Customers WHERE isActive = TRUE) AS activeCustomers,
        (SELECT COUNT(*) FROM Orders) AS totalOrders,
        (SELECT IFNULL(SUM(totalAmount), 0) FROM Orders) AS totalRevenue,
        (SELECT COUNT(*) FROM Products) AS totalProducts
    `);

    res.status(200).json({ success: true, data: summary[0] });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerSummary = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'name', 'email', 'phone', 'isActive'],
      include: [
        {
          model: Order,
          attributes: ['id', 'totalAmount', 'orderedAt', 'status'],
          order: [['orderedAt', 'DESC']],
          limit: 1,
        },
      ],
    });

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const [summary] = await Customer.sequelize?.query(
      `
      SELECT
        COUNT(*) AS totalOrders,
        IFNULL(SUM(totalAmount), 0) AS totalSpent
      FROM Orders
      WHERE customerId = ?
    `,
      { replacements: [customerId] }
    );

    res.status(200).json({
      success: true,
      data: {
        ...customer.toJSON(),
        totalOrders: summary[0].totalOrders,
        totalSpent: summary[0].totalSpent,
        latestOrder: customer.Orders?.[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, isActive } = req.body;
    // Basic validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    

    // Check if email already exists (if provided)
    if (email) {
      const existingCustomerByEmail = await Customer.findOne({ where: { email } });
      if (existingCustomerByEmail) {
        return res.status(409).json({
          success: false,
          message: 'Customer with this email already exists',
        });
      }
    }
    
    const normalizedPhone = normalizePhone(phone);
    // Check if phone already exists (if provided)
    if (normalizedPhone) {
      const existingCustomerByPhone = await Customer.findOne({ where: { phone: normalizedPhone } });
      if (existingCustomerByPhone) {
        return res.status(409).json({
          success: false,
          message: 'Customer with this phone number already exists',
        });
      }
    }

    // Create the customer
    const newCustomer = await Customer.create({
      name: name.trim(),
      email: email?.trim() === "N/A" ? null :  email?.trim(),
      phone: normalizedPhone?.trim() || null,
      address: address?.trim() || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer,
    });
  } catch (error) {
    next(error);
  }
};


// Utility to normalize phone numbers
function normalizePhone(phone) {
  if (!phone) return null;
  // Remove non-digit chars
  let normalized = phone.replace(/\D/g, "");
  // Optionally remove leading zeros (or keep one, based on your DB standard)
  normalized = normalized.replace(/^0+/, "");
  return normalized;
}

function normalizePhoneForSearch(phone) {
  const clean = phone.replace(/\D/g, "");
  return { clean, withZero: "0" + clean };
}
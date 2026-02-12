const { Request, Response } = require('express');
const Employee = require('../../models/Auth/Employee');
const FormDetail = require('../../models/Form/FormDetail');
const Call = require('../../models/Calling/Call');
const QueryType = require('../../models/Form/QueryType');
const Customer = require('../../models/Customer/Customer');
const SupportType = require('../../models/Form/SupportType');
const { uploadFile } = require('../../libs/awsS3');
const { Op } = require('sequelize');
const { sequelize } = require('../../models');

exports.test = async (req, res) => {
  res.json('this is test route for Form Data');
};

exports.createFormDetail = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('📝 Received form submission:', {
      body: req.body,
      files: req.files?.length || 0,
      contentType: req.headers['content-type'],
    });

    const {
      CallId,
      EmployeeId,
      callDateTime,
      callType,
      supportTypeId,
      inquiryNumber,
      queryTypeId,
      remarks,
      status,
      followUpDate,
      customerPhoneNumber,
      sourceTypeId,
    } = req.body;

    // // Validate required fields
    // if (!EmployeeId) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'EmployeeId is required',
    //   });
    // }

    // if (!supportTypeId) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Support Type is required',
    //   });
    // }

    // if (!queryTypeId) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Query Type is required',
    //   });
    // }

    // if (!remarks || !remarks.trim()) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Remarks are required',
    //   });
    // }

    // // Validate that Employee exists
    // const employee = await Employee.findByPk(EmployeeId);
    // if (!employee) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid EmployeeId - employee not found',
    //   });
    // }

    // // Validate that SupportType exists
    // const supportType = await SupportType.findByPk(supportTypeId);
    // if (!supportType) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid Support Type',
    //   });
    // }

    // // Validate that QueryType exists
    // const queryType = await QueryType.findByPk(queryTypeId);
    // if (!queryType) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid Query Type',
    //   });
    // }

    // Handle file uploads
    let attachmentUrls = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        console.log('📎 Processing file uploads:', req.files.length);

        const uploadPromises = req.files.map(async (file) => {
          // Create unique filename to avoid conflicts
          const timestamp = Date.now();
          const uniqueFilename = `${timestamp}-${file.originalname}`;

          // Create a new file object with unique name
          const fileToUpload = {
            ...file,
            originalname: uniqueFilename,
          };

          const uploadResult = await uploadFile(
            fileToUpload,
            `form-attachments/${CallId}`,
            'public'
          );

          return {
            originalName: file.originalname,
            fileName: uniqueFilename,
            url: uploadResult.Location,
            key: uploadResult.Key,
            size: file.size,
            mimeType: file.mimetype,
          };
        });

        attachmentUrls = await Promise.all(uploadPromises);
        console.log('✅ File uploads completed:', attachmentUrls.length);
      } catch (uploadError) {
        console.error('❌ Error uploading files:', uploadError);
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          message: 'Failed to upload attachments',
          error: uploadError.message,
        });
      }
    }

    // Generate CallId if not provided
    // const finalCallId = CallId;

    // Create or update the Call record first
    // let callRecord;
    // try {
    //   // Try to find existing call record
    //   callRecord = await Call.findOne({
    //     where: { CallId: finalCallId },
    //     transaction,
    //   });

    //   if (!callRecord) {
    //     // Create new call record
    //     callRecord = await Call.create(
    //       {
    //         CallId: finalCallId,
    //       },
    //       { transaction }
    //     );
    //     console.log('✅ Created new call record:', finalCallId);
    //   } else {
    //     console.log('📞 Using existing call record:', finalCallId);
    //   }
    // } catch (callError) {
    //   console.error('❌ Error handling call record:', callError);
    //   // Continue even if call record fails - it's not critical
    // }

    let customerId = null;

    if (customerPhoneNumber && customerPhoneNumber.trim() !== '') {
      // Check if customer already exists
      const normalizedPhone = normalizePhoneNumber(customerPhoneNumber);

      let existingCustomer = await Customer.findOne({
        where: { phone: normalizedPhone },
        transaction,
      });

      // if (!existingCustomer) {
      //   // Create new customer record if not found
      //   existingCustomer = await Customer.create(
      //     {
      //       phone: customerPhoneNumber,
      //     },
      //     { transaction }
      //   );
      //   console.log('✅ Created new customer with ID:', existingCustomer.id);
      // } else {
      //   console.log('📌 Using existing customer ID:', existingCustomer.id);
      // }

      customerId = existingCustomer.id;
    }

    const generateManualCallId = () => `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare data for database
    const formData = {
      CallId: CallId || generateManualCallId(),
      EmployeeId: parseInt(EmployeeId),
      callDateTime: callDateTime ? new Date(callDateTime) : new Date(),
      callType: callType || 'InBound',
      supportTypeId: parseInt(supportTypeId),
      inquiryNumber: inquiryNumber || null,
      queryTypeId: parseInt(queryTypeId),
      remarks: remarks.trim(),
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
      status: status || 'closed',
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      customerId: customerId || null,
      customerPhoneNumber: customerPhoneNumber || null,
      sourceTypeId: sourceTypeId ? parseInt(sourceTypeId) : null,
    };
    // Save FormDetail
    const newFormDetail = await FormDetail.create(formData, { transaction });

    // Commit transaction
    await transaction.commit();

    // Respond with success
    return res.status(201).json({
      success: true,
      message: 'Form detail created successfully',
      data: newFormDetail,
    });
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    console.error('❌ Error creating form detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create form detail',
      error: error.message,
    });
  }
};

const normalizePhoneNumber = (phone) => {
  if (!phone) return "";

  // Remove everything except digits
  let cleaned = phone.replace(/\D/g, "");

  // Remove leading 0s
  cleaned = cleaned.replace(/^0+/, "");

  // If it becomes longer than 10 digits, keep the last 10
  if (cleaned.length > 10) {
    cleaned = cleaned.slice(-10);
  }

  return cleaned;
};

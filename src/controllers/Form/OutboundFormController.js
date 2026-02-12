// controllers/outboundCallController.js
const { sequelize } = require('../../models'); // make sure sequelize instance is imported
const OutboundFormDetails = require('../../models/Form/OutboundFormDetail');
const Customer = require('../../models/Customer/Customer');

/**
 * Normalize phone numbers:
 * - Remove non-digit characters
 * - Remove leading zeros
 */
function normalizePhone(phone) {
    if (!phone) return null;
    return phone.replace(/\D/g, '').replace(/^0+/, '');
  }
  
  exports.createOutboundCall = async (req, res) => {
    const transaction = await sequelize.transaction();
  
    try {
      console.log("📞 Received outbound call submission:", req.body);
  
      const {
        CallId,
        EmployeeId,
        callDateTime,
        callType = "OutBound",
        callTypeId,
        attemptStatusId,
        dispositionId,
        outcomeTagIds,
        closureStatusId,
        remarks,
        followUpRequired = false,
        followUpDate,
        customerNumber
      } = req.body;
  
      // Normalize the customer number
      const normalizedNumber = normalizePhone(customerNumber);
      let customerId = null;
  
      if (normalizedNumber) {
        // Look for existing customer
        const existingCustomer = await Customer.findOne({
          where: { phone: normalizedNumber },
          transaction,
        });
  
        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log('📌 Using existing customer ID:', customerId);
        } else {
          console.warn('⚠️ Customer not found for number:', normalizedNumber);
          // Optionally, you can return an error if customer must exist
          // return res.status(404).json({ success: false, message: 'Customer not found' });
        }
      }

      const generateManualCallId = () => `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const formData = {
        CallId: CallId || generateManualCallId(),
        EmployeeId: parseInt(EmployeeId),
        callDateTime: callDateTime ? new Date(callDateTime) : new Date(),
        callType,
        callTypeId: parseInt(callTypeId),
        attemptStatusId: parseInt(attemptStatusId),
        dispositionId: dispositionId ? parseInt(dispositionId) : null,
        outcomeTagIds: outcomeTagIds,
        closureStatusId: closureStatusId ? parseInt(closureStatusId) : null,
        remarks: remarks?.trim() || null,
        followUpRequired: !!followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        customerNumber: normalizedNumber || null,
        customerId, // either the found customer ID or null
      };
  
      // Save the outbound call
      const newOutboundCall = await OutboundFormDetails.create(formData, { transaction });
  
      await transaction.commit();
  
      return res.status(201).json({
        success: true,
        message: "Outbound call details saved successfully",
        data: newOutboundCall,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("❌ Error saving outbound call:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save outbound call",
        error: error.message,
      });
    }
  };